// src/main/java/com/cursosonline/cursosonlinejs/Servicios/EvaluacionServicio.java
package com.cursosonline.cursosonlinejs.Servicios;

import com.cursosonline.cursosonlinejs.Entidades.Evaluacion;
import com.cursosonline.cursosonlinejs.Entidades.Leccion;
import com.cursosonline.cursosonlinejs.Repositorios.EvaluacionRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.LeccionRepositorio;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class EvaluacionServicio {

    private final EvaluacionRepositorio evaluacionRepositorio;
    private final LeccionRepositorio leccionRepositorio;

    public EvaluacionServicio(EvaluacionRepositorio evaluacionRepositorio,
                              LeccionRepositorio leccionRepositorio) {
        this.evaluacionRepositorio = evaluacionRepositorio;
        this.leccionRepositorio = leccionRepositorio;
    }

    /** Crear o actualizar. En creación: copio idModulo/idCurso desde la Lección. */
    public Evaluacion guardar(Evaluacion e) {
        if (e.getTitulo() != null) e.setTitulo(e.getTitulo().trim());
        if (e.getTipo() == null) throw new IllegalArgumentException("El tipo de evaluación es obligatorio");
        if (e.getPuntajeMaximo() == null) e.setPuntajeMaximo(BigDecimal.ZERO);

        final boolean esNueva = (e.getId() == null);

        // Siempre necesitamos saber a qué lección pertenece
        String idLeccion = e.getIdLeccion();
        if (idLeccion == null || idLeccion.isBlank()) {
            throw new IllegalArgumentException("idLeccion es obligatorio.");
        }

        if (esNueva) {
            // Tomar idModulo e idCurso desde la lección
            Leccion l = leccionRepositorio.findById(idLeccion)
                    .orElseThrow(() -> new NoSuchElementException("Lección no encontrada"));
            e.setIdModulo(l.getIdModulo());
            e.setIdCurso(l.getIdCurso());
        } else {
            // Blindaje: no permitir mover la evaluación de lección
            Evaluacion actual = evaluacionRepositorio.findById(e.getId())
                    .orElseThrow(() -> new NoSuchElementException("Evaluación no encontrada"));
            if (!Objects.equals(actual.getIdLeccion(), e.getIdLeccion())) {
                throw new IllegalArgumentException("No se permite cambiar la evaluación de lección.");
            }
            // Congelar idCurso/idModulo
            e.setIdModulo(actual.getIdModulo());
            e.setIdCurso(actual.getIdCurso());
        }

        Evaluacion saved = evaluacionRepositorio.save(e);
        // Sincroniza la lista de evaluaciones PUBLICADAS en la lección
        syncEvaluacionesPublicadasEnLeccion(saved.getIdLeccion());
        return saved;
    }

    public List<Evaluacion> listarPorLeccion(String idLeccion) {
        return evaluacionRepositorio.findByIdLeccionOrderByTituloAsc(idLeccion);
    }

    /** Solo PUBLICADAS de la lección (para alumnos/visitantes) */
    public List<Evaluacion> listarPublicadasPorLeccion(String idLeccion) {
        return evaluacionRepositorio.findByIdLeccionAndEstadoOrderByTituloAsc(
                idLeccion, Evaluacion.EstadoPublicacion.PUBLICADA
        );
    }

    public Optional<Evaluacion> obtenerPorIdYLeccion(String id, String idLeccion) {
        return evaluacionRepositorio.findByIdAndIdLeccion(id, idLeccion);
    }

    /** PUT completo (sin permitir cambiar de lección) */
    public Optional<Evaluacion> actualizar(String idEval,
                                           String idLeccion,
                                           String titulo,
                                           Evaluacion.TipoEvaluacion tipo,
                                           BigDecimal puntajeMaximo) {
        return evaluacionRepositorio.findByIdAndIdLeccion(idEval, idLeccion).map(actual -> {
            if (actual.getEstado() == Evaluacion.EstadoPublicacion.PUBLICADA) {
                throw new IllegalStateException("No se puede editar una evaluación PUBLICADA. Archívala primero.");
            }
            if (titulo != null && !titulo.isBlank()) actual.setTitulo(titulo.trim());
            if (tipo != null) actual.setTipo(tipo);
            if (puntajeMaximo != null && puntajeMaximo.signum() >= 0) actual.setPuntajeMaximo(puntajeMaximo);
            Evaluacion s = evaluacionRepositorio.save(actual);
            syncEvaluacionesPublicadasEnLeccion(s.getIdLeccion());
            return s;
        });
    }

    /** PATCH parcial (sin permitir cambiar de lección) */
    public Optional<Evaluacion> patchParcial(String idEval,
                                             String idLeccion,
                                             String titulo,
                                             Evaluacion.TipoEvaluacion tipo,
                                             BigDecimal puntajeMaximo) {
        return evaluacionRepositorio.findByIdAndIdLeccion(idEval, idLeccion).map(actual -> {
            if (actual.getEstado() == Evaluacion.EstadoPublicacion.PUBLICADA) {
                throw new IllegalStateException("No se puede editar una evaluación PUBLICADA. Archívala primero.");
            }
            if (titulo != null) actual.setTitulo(titulo.isBlank() ? actual.getTitulo() : titulo.trim());
            if (tipo != null) actual.setTipo(tipo);
            if (puntajeMaximo != null && puntajeMaximo.signum() >= 0) actual.setPuntajeMaximo(puntajeMaximo);
            Evaluacion s = evaluacionRepositorio.save(actual);
            syncEvaluacionesPublicadasEnLeccion(s.getIdLeccion());
            return s;
        });
    }

    public boolean eliminar(String idEval, String idLeccion) {
        return evaluacionRepositorio.findByIdAndIdLeccion(idEval, idLeccion)
                .map(e -> {
                    evaluacionRepositorio.deleteByIdAndIdLeccion(idEval, idLeccion);
                    syncEvaluacionesPublicadasEnLeccion(idLeccion);
                    return true;
                })
                .orElse(false);
    }

    /* ====== Publicar / Archivar ====== */

    public Optional<Evaluacion> publicar(String idEval, String idLeccion) {
        return evaluacionRepositorio.findByIdAndIdLeccion(idEval, idLeccion).map(e -> {
            if (e.getEstado() != Evaluacion.EstadoPublicacion.PUBLICADA) {
                e.setEstado(Evaluacion.EstadoPublicacion.PUBLICADA);
                e.setPublishedAt(Instant.now());
                e = evaluacionRepositorio.save(e);
                syncEvaluacionesPublicadasEnLeccion(e.getIdLeccion());
            }
            return e;
        });
    }

    public Optional<Evaluacion> archivar(String idEval, String idLeccion) {
        return evaluacionRepositorio.findByIdAndIdLeccion(idEval, idLeccion).map(e -> {
            if (e.getEstado() != Evaluacion.EstadoPublicacion.ARCHIVADA) {
                e.setEstado(Evaluacion.EstadoPublicacion.ARCHIVADA);
                e = evaluacionRepositorio.save(e);
                syncEvaluacionesPublicadasEnLeccion(e.getIdLeccion());
            }
            return e;
        });
    }

    /* ===== Helpers ===== */

    /** Mantiene leccion.evaluaciones con SOLO las PUBLICADAS (ids ordenados por título). */
    private void syncEvaluacionesPublicadasEnLeccion(String idLeccion) {
        Leccion leccion = leccionRepositorio.findById(idLeccion).orElse(null);
        if (leccion == null) return;

        List<String> publicadasIds = evaluacionRepositorio
                .findByIdLeccionAndEstadoOrderByTituloAsc(idLeccion, Evaluacion.EstadoPublicacion.PUBLICADA)
                .stream()
                .map(Evaluacion::getId)
                .collect(Collectors.toList());

        leccion.setEvaluaciones(publicadasIds);
        leccionRepositorio.save(leccion);
    }

    /* ===== Helpers sobrecarga String/int (si las usas) ===== */
    public Optional<Evaluacion> actualizar(String idEval, String idLeccion, String titulo, String tipo, int puntajeMaximo) {
        Evaluacion.TipoEvaluacion t = (tipo == null || tipo.isBlank()) ? null : parseTipo(tipo);
        BigDecimal pm = (puntajeMaximo < 0) ? null : BigDecimal.valueOf(puntajeMaximo);
        return actualizar(idEval, idLeccion, titulo, t, pm);
    }

    private Evaluacion.TipoEvaluacion parseTipo(String raw) {
        String v = raw.trim().toLowerCase();
        switch (v) {
            case "quiz":
            case "cuestionario": return Evaluacion.TipoEvaluacion.QUIZ;
            case "tarea":
            case "asignacion":   return Evaluacion.TipoEvaluacion.TAREA;
            case "examen":
            case "final":        return Evaluacion.TipoEvaluacion.EXAMEN;
            default: throw new IllegalArgumentException("Tipo de evaluación inválido: " + raw);
        }
    }
}
