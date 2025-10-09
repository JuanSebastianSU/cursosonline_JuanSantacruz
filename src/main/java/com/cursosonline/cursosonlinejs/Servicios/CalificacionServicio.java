// src/main/java/com/cursosonline/cursosonlinejs/Servicios/CalificacionServicio.java
package com.cursosonline.cursosonlinejs.Servicios;

import com.cursosonline.cursosonlinejs.Entidades.Calificacion;
import com.cursosonline.cursosonlinejs.Entidades.Curso;
import com.cursosonline.cursosonlinejs.Entidades.Evaluacion;
import com.cursosonline.cursosonlinejs.Entidades.Intento;
import com.cursosonline.cursosonlinejs.Entidades.Intento.EstadoIntento;
import com.cursosonline.cursosonlinejs.Entidades.Leccion;
import com.cursosonline.cursosonlinejs.Entidades.Modulo;
import com.cursosonline.cursosonlinejs.Repositorios.*;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class CalificacionServicio {

    private final CalificacionRepositorio calificacionRepositorio;
    private final IntentoRepositorio intentoRepositorio;

    // NUEVO: para validar “no interactuar si está archivado”
    private final EvaluacionRepositorio evaluacionRepositorio;
    private final LeccionRepositorio leccionRepositorio;
    private final ModuloRepositorio moduloRepositorio;
    private final CursoRepositorio cursoRepositorio;

    public CalificacionServicio(CalificacionRepositorio calificacionRepositorio,
                                IntentoRepositorio intentoRepositorio,
                                EvaluacionRepositorio evaluacionRepositorio,
                                LeccionRepositorio leccionRepositorio,
                                ModuloRepositorio moduloRepositorio,
                                CursoRepositorio cursoRepositorio) {
        this.calificacionRepositorio = calificacionRepositorio;
        this.intentoRepositorio = intentoRepositorio;
        this.evaluacionRepositorio = evaluacionRepositorio;
        this.leccionRepositorio = leccionRepositorio;
        this.moduloRepositorio = moduloRepositorio;
        this.cursoRepositorio = cursoRepositorio;
    }

    /** Crear (una sola por intento). */
    public Optional<Calificacion> calificar(String idIntento,
                                            BigDecimal puntaje,
                                            String feedback,
                                            String calificadoPor) {
        var intentoOpt = intentoRepositorio.findById(idIntento);
        if (intentoOpt.isEmpty()) return Optional.empty();
        if (calificacionRepositorio.existsByIdIntento(idIntento)) return Optional.empty();

        Intento intento = intentoOpt.get();

        // *** BLOQUEO si eval/lección/módulo/curso están ARCHIVADOS ***
        assertNoArchivado(intento.getIdEvaluacion());

        BigDecimal maximo = (intento.getPuntajeMaximo() != null) ? intento.getPuntajeMaximo() : BigDecimal.TEN;

        if (puntaje == null) puntaje = BigDecimal.ZERO;
        if (puntaje.compareTo(BigDecimal.ZERO) < 0)
            throw new IllegalArgumentException("El puntaje no puede ser negativo.");
        if (puntaje.compareTo(maximo) > 0)
            throw new IllegalArgumentException("El puntaje no puede ser mayor al puntaje máximo (" + maximo + ").");

        Calificacion c = new Calificacion();
        c.setIdIntento(idIntento);
        c.setIdEvaluacion(intento.getIdEvaluacion());
        c.setIdEstudiante(intento.getIdEstudiante());
        c.setPuntaje(puntaje);
        c.setPuntajeMaximo(maximo);
        c.setPorcentaje(maximo.signum() == 0
                ? BigDecimal.ZERO
                : puntaje.multiply(BigDecimal.valueOf(100)).divide(maximo, 2, RoundingMode.HALF_UP));
        c.setFeedback(feedback);
        c.setCalificadoPor(calificadoPor); // solo id, sin nombre
        c.setEstado(Calificacion.EstadoCalificacion.PENDIENTE);
        c.setCalificadoAt(null); // se marca al publicar

        Calificacion creada = calificacionRepositorio.save(c);

        // Reflejar en intento
        intento.setPuntaje(puntaje);
        intento.setEstado(EstadoIntento.CALIFICADO);
        intento.setCalificadoAt(Instant.now());
        intentoRepositorio.save(intento);

        return Optional.of(creada);
    }

    public Optional<Calificacion> buscarPorId(String id) { return calificacionRepositorio.findById(id); }
    public Optional<Calificacion> buscarPorIntento(String idIntento) { return calificacionRepositorio.findByIdIntento(idIntento); }
    public List<Calificacion> listarPorEvaluacion(String idEvaluacion) { return calificacionRepositorio.findByIdEvaluacionOrderByCreatedAtDesc(idEvaluacion); }

    /** Actualizar (parcial). */
    public Optional<Calificacion> actualizarParcial(String id, BigDecimal puntaje, String feedback) {
        return calificacionRepositorio.findById(id).map(c -> {
            if (puntaje != null) {
                if (puntaje.compareTo(BigDecimal.ZERO) < 0)
                    throw new IllegalArgumentException("El puntaje no puede ser negativo.");
                BigDecimal max = (c.getPuntajeMaximo() != null) ? c.getPuntajeMaximo() : BigDecimal.TEN;
                if (puntaje.compareTo(max) > 0)
                    throw new IllegalArgumentException("El puntaje no puede ser mayor al puntaje máximo (" + max + ").");

                c.setPuntaje(puntaje);
                c.setPorcentaje(max.signum() == 0
                        ? BigDecimal.ZERO
                        : puntaje.multiply(BigDecimal.valueOf(100)).divide(max, 2, RoundingMode.HALF_UP));
            }
            if (feedback != null) c.setFeedback(feedback);
            return calificacionRepositorio.save(c);
        });
    }

    /** Publicar (marca fecha). */
    public Optional<Calificacion> publicar(String id) {
        return calificacionRepositorio.findById(id).map(c -> {
            // (Opcional) puedes bloquear publicar si la evaluación está archivada:
            // assertNoArchivado(c.getIdEvaluacion());

            c.setEstado(Calificacion.EstadoCalificacion.PUBLICADA);
            c.setCalificadoAt(Instant.now());
            return calificacionRepositorio.save(c);
        });
    }

    public boolean eliminar(String id) {
        return calificacionRepositorio.findById(id).map(c -> {
            calificacionRepositorio.deleteById(id);
            return true;
        }).orElse(false);
    }

    /* ===================== Helpers ===================== */

    /** Lanza IllegalStateException si curso/módulo/lección/evaluación están ARCHIVADOS. */
    private void assertNoArchivado(String idEvaluacion) {
        Evaluacion eval = evaluacionRepositorio.findById(idEvaluacion)
                .orElseThrow(() -> new NoSuchElementException("Evaluación no encontrada"));
        if (eval.getEstado() == Evaluacion.EstadoPublicacion.ARCHIVADA) {
            throw new IllegalStateException("No se puede calificar: la evaluación está ARCHIVADA.");
        }

        Leccion lec = leccionRepositorio.findById(eval.getIdLeccion())
                .orElseThrow(() -> new NoSuchElementException("Lección no encontrada"));
        if (lec.getEstado() == Leccion.EstadoPublicacion.ARCHIVADO) {
            throw new IllegalStateException("No se puede calificar: la lección está ARCHIVADA.");
        }

        Modulo mod = moduloRepositorio.findById(lec.getIdModulo())
                .orElseThrow(() -> new NoSuchElementException("Módulo no encontrado"));
        if (mod.getEstado() == Modulo.EstadoModulo.ARCHIVADO) {
            throw new IllegalStateException("No se puede calificar: el módulo está ARCHIVADO.");
        }

        Curso cur = cursoRepositorio.findById(mod.getIdCurso())
                .orElseThrow(() -> new NoSuchElementException("Curso no encontrado"));
        if (cur.getEstado() == Curso.EstadoCurso.ARCHIVADO) {
            throw new IllegalStateException("No se puede calificar: el curso está ARCHIVADO.");
        }
    }
}
