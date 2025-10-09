package com.cursosonline.cursosonlinejs.Servicios;

import com.cursosonline.cursosonlinejs.Entidades.Leccion;
import com.cursosonline.cursosonlinejs.Entidades.Modulo;
import com.cursosonline.cursosonlinejs.Repositorios.LeccionRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.ModuloRepositorio;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class LeccionServicio {

    private final LeccionRepositorio leccionRepositorio;
    private final ModuloRepositorio moduloRepositorio;
    private final CursoServicio cursoServicio; // <<< NUEVO

    public LeccionServicio(LeccionRepositorio leccionRepositorio,
                           ModuloRepositorio moduloRepositorio,
                           CursoServicio cursoServicio) { // <<< NUEVO
        this.leccionRepositorio = leccionRepositorio;
        this.moduloRepositorio = moduloRepositorio;
        this.cursoServicio = cursoServicio; // <<< NUEVO
    }

    /* ===================== CRUD ===================== */

    public Leccion guardar(Leccion leccion) {
    if (leccion.getTitulo() != null) leccion.setTitulo(leccion.getTitulo().trim());
    if (leccion.getUrlContenido() != null) leccion.setUrlContenido(leccion.getUrlContenido().trim());

    final boolean esNueva = (leccion.getId() == null);

    if (esNueva) {
        // creación: igual que ya tienes (no se bloquea)
        String idModulo = leccion.getIdModulo();
        if (idModulo == null || idModulo.isBlank())
            throw new IllegalArgumentException("idModulo es obligatorio para crear la lección.");
        Modulo m = moduloRepositorio.findById(idModulo)
                .orElseThrow(() -> new NoSuchElementException("Módulo no encontrado"));
        leccion.setIdCurso(m.getIdCurso());
    } else {
        // actualización: validar editabilidad
        Leccion actual = leccionRepositorio.findById(leccion.getId())
                .orElseThrow(() -> new NoSuchElementException("Lección no encontrada"));
        if (actual.getEstado() == Leccion.EstadoPublicacion.PUBLICADO) {
            throw new IllegalStateException("No se puede editar una lección en estado PUBLICADO. Archívala primero.");
        }
        // congelar idModulo/idCurso
        if (!Objects.equals(actual.getIdModulo(), leccion.getIdModulo())) {
            throw new IllegalArgumentException("No se permite cambiar la lección de módulo.");
        }
        leccion.setIdCurso(actual.getIdCurso());
    }

    Leccion guardada = leccionRepositorio.save(leccion);

    if (esNueva) {
        anexarLeccionAlModulo(guardada.getIdModulo(), guardada.getId());
    }

    return guardada;
}


    public List<Leccion> listaAll() { return leccionRepositorio.findAll(); }

    public Leccion listaLeccion(String id) { return leccionRepositorio.findById(id).orElse(null); }

    public void eliminar(String id) {
        // Quitar el id de la lección del módulo antes de borrar
        Leccion l = leccionRepositorio.findById(id).orElse(null);
        if (l != null) {
            String idCurso = l.getIdCurso(); // lo guardamos para refrescar después
            quitarLeccionDeModulo(l.getIdModulo(), l.getId());
            leccionRepositorio.deleteById(id);

            // <<< NUEVO: refrescar el contador de lecciones del curso
            if (idCurso != null) {
                cursoServicio.onLeccionChanged(idCurso);
            }
        }
    }

    /* ===================== Soporte controlador ===================== */

    public Leccion obtener(String id) { return leccionRepositorio.findById(id).orElse(null); }

    public List<Leccion> listarPorModulo(String idModulo) {
        return leccionRepositorio.findByIdModuloOrderByOrdenAsc(idModulo);
    }

    public boolean existeOrdenEnModulo(String idModulo, int orden) {
        return leccionRepositorio.existsByIdModuloAndOrden(idModulo, orden);
    }

    public boolean existeOrdenEnModuloExceptoId(String idModulo, int orden, String idExcluido) {
        return leccionRepositorio.existsByIdModuloAndOrdenAndIdNot(idModulo, orden, idExcluido);
    }

    public int siguienteOrden(String idModulo) {
        return leccionRepositorio.findTopByIdModuloOrderByOrdenDesc(idModulo)
                .map(l -> l.getOrden() + 1)
                .orElse(1);
    }

    /* ===================== Reordenamientos (sin mover de módulo) ===================== */

    public Leccion cambiarOrden(String idModulo, String idLeccion, int nuevoOrden) {
        if (nuevoOrden < 1) nuevoOrden = 1;

        Leccion actual = leccionRepositorio.findById(idLeccion)
                .orElseThrow(() -> new NoSuchElementException("Lección no encontrada"));
        if (actual.getEstado() == Leccion.EstadoPublicacion.PUBLICADO) {
        throw new IllegalStateException("No se puede reordenar una lección PUBLICADA. Archívala primero.");
    }
        if (!idModulo.equals(actual.getIdModulo()))
            throw new IllegalArgumentException("La lección no pertenece al módulo");

        if (Objects.equals(actual.getOrden(), nuevoOrden)) return actual;

        Optional<Leccion> conflicto = leccionRepositorio.findByIdModuloAndOrden(idModulo, nuevoOrden);
        if (conflicto.isPresent() && !conflicto.get().getId().equals(idLeccion)) {
            Leccion otra = conflicto.get();
            int old = actual.getOrden();
            actual.setOrden(nuevoOrden);
            otra.setOrden(old);
            leccionRepositorio.save(otra);
            return leccionRepositorio.save(actual);
        } else {
            actual.setOrden(nuevoOrden);
            return leccionRepositorio.save(actual);
        }
    }

    public Leccion moverPorDelta(String idModulo, String idLeccion, int delta) {
    Leccion actual = leccionRepositorio.findById(idLeccion)
            .orElseThrow(() -> new NoSuchElementException("Lección no encontrada"));

    if (actual.getEstado() == Leccion.EstadoPublicacion.PUBLICADO) {
        throw new IllegalStateException("No se puede reordenar una lección PUBLICADA. Archívala primero.");
    }
    if (!idModulo.equals(actual.getIdModulo()))
        throw new IllegalArgumentException("La lección no pertenece al módulo");

    int nuevoOrden = Math.max(1, actual.getOrden() + delta);
    return cambiarOrden(idModulo, idLeccion, nuevoOrden);
}


    public List<Leccion> reordenarSecuencial(String idModulo, List<String> idsEnOrden) {
        if (idsEnOrden == null || idsEnOrden.isEmpty())
            throw new IllegalArgumentException("La lista de ids no puede estar vacía");

        List<Leccion> lecciones = leccionRepositorio.findByIdIn(idsEnOrden);
        if (lecciones.size() != idsEnOrden.size())
            throw new IllegalArgumentException("Algún id no corresponde a una lección existente");

        for (Leccion l : lecciones) {
            if (!idModulo.equals(l.getIdModulo()))
                throw new IllegalArgumentException("Todas las lecciones deben pertenecer al módulo");
            if (l.getEstado() == Leccion.EstadoPublicacion.PUBLICADO) {
                throw new IllegalStateException("No se puede reordenar lecciones PUBLICADAS. Archívalas primero.");
            }
        }

        Map<String, Leccion> map = new HashMap<>();
        for (Leccion l : lecciones) map.put(l.getId(), l);

        int orden = 1;
        for (String id : idsEnOrden) {
            map.get(id).setOrden(orden++);
        }
        return leccionRepositorio.saveAll(lecciones);
    }
    // En src/main/java/com/cursosonline/cursosonlinejs/Servicios/LeccionServicio.java

    public List<Leccion> listarPublicadasPorModulo(String idModulo) {
        return leccionRepositorio.findByIdModuloAndEstadoOrderByOrdenAsc(
                idModulo, Leccion.EstadoPublicacion.PUBLICADO
        );
    }

    /* ===================== Patch parcial ===================== */

    public Leccion patchParcial(Leccion actual, String titulo, Leccion.TipoLeccion tipo,
                                String urlContenido, Integer duracion) {

        if (titulo != null && !titulo.isBlank()) actual.setTitulo(titulo.trim());
        if (tipo != null) actual.setTipo(tipo);
        if (urlContenido != null) actual.setUrlContenido(urlContenido.trim());
        if (duracion != null && duracion >= 0) actual.setDuracion(duracion);

        // NO tocamos idModulo / idCurso aquí
        return leccionRepositorio.save(actual);
    }

    /* ===================== Helpers de sincronización ===================== */

    private void anexarLeccionAlModulo(String idModulo, String idLeccion) {
        Modulo m = moduloRepositorio.findById(idModulo)
                .orElseThrow(() -> new NoSuchElementException("Módulo no encontrado"));
        List<String> ids = (m.getLecciones() == null) ? new ArrayList<>() : new ArrayList<>(m.getLecciones());
        if (!ids.contains(idLeccion)) {
            ids.add(idLeccion); // la dejamos al final; el orden “real” lo maneja Leccion.orden
            m.setLecciones(ids);
            moduloRepositorio.save(m);
        }
    }

    private void quitarLeccionDeModulo(String idModulo, String idLeccion) {
        if (idModulo == null) return;
        Modulo m = moduloRepositorio.findById(idModulo).orElse(null);
        if (m == null || m.getLecciones() == null) return;
        List<String> ids = new ArrayList<>(m.getLecciones());
        if (ids.remove(idLeccion)) {
            m.setLecciones(ids);
            moduloRepositorio.save(m);
        }
    }
    public Optional<Leccion> publicar(String id) {
    return leccionRepositorio.findById(id).map(l -> {
        if (l.getEstado() != Leccion.EstadoPublicacion.PUBLICADO) {
            l.setEstado(Leccion.EstadoPublicacion.PUBLICADO);
            l.setPublishedAt(Instant.now());
            l = leccionRepositorio.save(l);
            if (l.getIdCurso() != null) cursoServicio.onLeccionChanged(l.getIdCurso());
        }
        return l;
    });
}

public Optional<Leccion> archivar(String id) {
    return leccionRepositorio.findById(id).map(l -> {
        if (l.getEstado() != Leccion.EstadoPublicacion.ARCHIVADO) {
            l.setEstado(Leccion.EstadoPublicacion.ARCHIVADO);
            l = leccionRepositorio.save(l);
            if (l.getIdCurso() != null) cursoServicio.onLeccionChanged(l.getIdCurso());
        }
        return l;
    });
}
}
