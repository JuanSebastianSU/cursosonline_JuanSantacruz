package com.cursosonline.cursosonlinejs.Servicios;

import com.cursosonline.cursosonlinejs.Entidades.Modulo;
import com.cursosonline.cursosonlinejs.Repositorios.ModuloRepositorio;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ModuloServicio {

    private final ModuloRepositorio moduloRepositorio;
    private final CursoServicio cursoServicio;

    public ModuloServicio(ModuloRepositorio moduloRepositorio,
                          CursoServicio cursoServicio) {
        this.moduloRepositorio = moduloRepositorio;
        this.cursoServicio = cursoServicio;
    }

    public Modulo guardar(Modulo modulo) {
        if (modulo.getTitulo() != null) {
            modulo.setTitulo(modulo.getTitulo().trim());
        }

        final boolean esNueva = (modulo.getId() == null);

        if (!esNueva) {
            Modulo actual = moduloRepositorio.findById(modulo.getId())
                    .orElseThrow(() -> new NoSuchElementException("Módulo no encontrado"));
            if (actual.getEstado() == Modulo.EstadoModulo.PUBLICADO) {
                throw new IllegalStateException("No se puede editar un módulo en estado PUBLICADO. Archívalo primero.");
            }
            modulo.setIdCurso(actual.getIdCurso());
        }

        Modulo saved = moduloRepositorio.save(modulo);

        if (saved.getIdCurso() != null) {
            cursoServicio.reconstruirModulosSnapshot(saved.getIdCurso());
        }
        return saved;
    }

    public List<Modulo> listaAll() {
        return moduloRepositorio.findAll();
    }

    public Modulo listaModulo(String id) {
        return moduloRepositorio.findById(id).orElse(null);
    }

    public void eliminar(String id) {
        String idCurso = moduloRepositorio.findById(id).map(Modulo::getIdCurso).orElse(null);
        moduloRepositorio.deleteById(id);
        if (idCurso != null) {
            cursoServicio.reconstruirModulosSnapshot(idCurso);
        }
    }

    public Modulo obtener(String id) {
        return moduloRepositorio.findById(id).orElse(null);
    }

    public List<Modulo> listarPorCurso(String idCurso) {
        return moduloRepositorio.findByIdCursoOrderByOrdenAsc(idCurso);
    }

    public boolean existeOrdenEnCurso(String idCurso, int orden) {
        return moduloRepositorio.existsByIdCursoAndOrden(idCurso, orden);
    }

    public boolean existeOrdenEnCursoExceptoId(String idCurso, int orden, String idExcluido) {
        return moduloRepositorio.existsByIdCursoAndOrdenAndIdNot(idCurso, orden, idExcluido);
    }

    public int siguienteOrden(String idCurso) {
        return moduloRepositorio.findTopByIdCursoOrderByOrdenDesc(idCurso)
                .map(m -> m.getOrden() + 1)
                .orElse(1);
    }

    public Modulo cambiarOrden(String idCurso, String idModulo, int nuevoOrden) {
        if (nuevoOrden < 1) nuevoOrden = 1;

        Modulo actual = moduloRepositorio.findById(idModulo)
                .orElseThrow(() -> new NoSuchElementException("Módulo no encontrado"));

        if (actual.getEstado() == Modulo.EstadoModulo.PUBLICADO) {
            throw new IllegalStateException("No se puede reordenar un módulo PUBLICADO. Archívalo primero.");
        }
        if (!idCurso.equals(actual.getIdCurso()))
            throw new IllegalArgumentException("El módulo no pertenece al curso");

        if (actual.getOrden() == nuevoOrden) {
            cursoServicio.reconstruirModulosSnapshot(idCurso);
            return actual;
        }

        Optional<Modulo> conflicto = moduloRepositorio.findByIdCursoAndOrden(idCurso, nuevoOrden);
        if (conflicto.isPresent() && !conflicto.get().getId().equals(idModulo)) {
            Modulo otro = conflicto.get();
            int old = actual.getOrden();
            actual.setOrden(nuevoOrden);
            otro.setOrden(old);
            moduloRepositorio.save(otro);
            Modulo result = moduloRepositorio.save(actual);
            cursoServicio.reconstruirModulosSnapshot(idCurso);
            return result;
        } else {
            actual.setOrden(nuevoOrden);
            Modulo result = moduloRepositorio.save(actual);
            cursoServicio.reconstruirModulosSnapshot(idCurso);
            return result;
        }
    }

    public Modulo moverPorDelta(String idCurso, String idModulo, int delta) {
        Modulo actual = moduloRepositorio.findById(idModulo)
                .orElseThrow(() -> new NoSuchElementException("Módulo no encontrado"));

        if (actual.getEstado() == Modulo.EstadoModulo.PUBLICADO) {
            throw new IllegalStateException("No se puede reordenar un módulo PUBLICADO. Archívalo primero.");
        }
        if (!idCurso.equals(actual.getIdCurso()))
            throw new IllegalArgumentException("El módulo no pertenece al curso");

        int nuevoOrden = Math.max(1, actual.getOrden() + delta);
        return cambiarOrden(idCurso, idModulo, nuevoOrden);
    }

    public Optional<Modulo> publicar(String id) {
        return moduloRepositorio.findById(id).map(m -> {
            if (m.getEstado() != Modulo.EstadoModulo.PUBLICADO) {
                m.setEstado(Modulo.EstadoModulo.PUBLICADO);
                m.setPublishedAt(Instant.now());
                m = moduloRepositorio.save(m);
                if (m.getIdCurso() != null) {
                    cursoServicio.reconstruirModulosSnapshot(m.getIdCurso());
                }
            }
            return m;
        });
    }

    public Optional<Modulo> archivar(String id) {
        return moduloRepositorio.findById(id).map(m -> {
            if (m.getEstado() != Modulo.EstadoModulo.ARCHIVADO) {
                m.setEstado(Modulo.EstadoModulo.ARCHIVADO);
                m = moduloRepositorio.save(m);
                if (m.getIdCurso() != null) {
                    cursoServicio.reconstruirModulosSnapshot(m.getIdCurso());
                }
            }
            return m;
        });
    }

    public List<Modulo> reordenarSecuencial(String idCurso, List<String> idsEnOrden) {
        if (idsEnOrden == null || idsEnOrden.isEmpty())
            throw new IllegalArgumentException("La lista de ids no puede estar vacía");

        List<Modulo> modulos = moduloRepositorio.findByIdIn(idsEnOrden);
        if (modulos.size() != idsEnOrden.size())
            throw new IllegalArgumentException("Algún id no corresponde a un módulo existente");

        for (Modulo m : modulos) {
            if (!idCurso.equals(m.getIdCurso()))
                throw new IllegalArgumentException("Todos los módulos deben pertenecer al mismo curso");
            if (m.getEstado() == Modulo.EstadoModulo.PUBLICADO) {
                throw new IllegalStateException("No se puede reordenar módulos PUBLICADOS. Archívalos primero.");
            }
        }

        Map<String, Modulo> mapa = modulos.stream().collect(Collectors.toMap(Modulo::getId, m -> m));
        int orden = 1;
        for (String id : idsEnOrden) {
            mapa.get(id).setOrden(orden++);
        }
        List<Modulo> res = moduloRepositorio.saveAll(modulos);
        cursoServicio.reconstruirModulosSnapshot(idCurso);
        return res;
    }
}
