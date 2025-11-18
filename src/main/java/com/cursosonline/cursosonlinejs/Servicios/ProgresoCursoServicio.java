package com.cursosonline.cursosonlinejs.Servicios;

import com.cursosonline.cursosonlinejs.DTO.CursoProgresoDTO;
import com.cursosonline.cursosonlinejs.DTO.LeccionProgresoDTO;
import com.cursosonline.cursosonlinejs.DTO.ModuloProgresoDTO;
import com.cursosonline.cursosonlinejs.Entidades.Calificacion;
import com.cursosonline.cursosonlinejs.Entidades.Curso;
import com.cursosonline.cursosonlinejs.Entidades.Evaluacion;
import com.cursosonline.cursosonlinejs.Entidades.Inscripcion;
import com.cursosonline.cursosonlinejs.Entidades.Intento;
import com.cursosonline.cursosonlinejs.Entidades.Leccion;
import com.cursosonline.cursosonlinejs.Entidades.Modulo;
import com.cursosonline.cursosonlinejs.Repositorios.CursoRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.EvaluacionRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.InscripcionRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.IntentoRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.LeccionRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.ModuloRepositorio;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

@Service
public class ProgresoCursoServicio {

    private static final BigDecimal CIEN = BigDecimal.valueOf(100);
    // Umbral global por ahora (no hay panel para cambiarlo todavía)
    private static final BigDecimal NOTA_APROBATORIA_DEFAULT = BigDecimal.valueOf(70);

    private final CursoRepositorio cursoRepositorio;
    private final ModuloRepositorio moduloRepositorio;
    private final LeccionRepositorio leccionRepositorio;
    private final EvaluacionRepositorio evaluacionRepositorio;
    private final IntentoRepositorio intentoRepositorio;
    private final InscripcionRepositorio inscripcionRepositorio;

    public ProgresoCursoServicio(CursoRepositorio cursoRepositorio,
                                 ModuloRepositorio moduloRepositorio,
                                 LeccionRepositorio leccionRepositorio,
                                 EvaluacionRepositorio evaluacionRepositorio,
                                 IntentoRepositorio intentoRepositorio,
                                 InscripcionRepositorio inscripcionRepositorio) {
        this.cursoRepositorio = cursoRepositorio;
        this.moduloRepositorio = moduloRepositorio;
        this.leccionRepositorio = leccionRepositorio;
        this.evaluacionRepositorio = evaluacionRepositorio;
        this.intentoRepositorio = intentoRepositorio;
        this.inscripcionRepositorio = inscripcionRepositorio;
    }

    /**
     * Calcula el progreso (notas) de un estudiante en un curso
     * y, si actualizarInscripcion=true, actualiza la inscripción
     * con notaFinal, aprobadoFinal y estado COMPLETADA cuando corresponda.
     */
    public CursoProgresoDTO calcularProgresoCurso(String idCurso,
                                                  String idEstudiante,
                                                  boolean actualizarInscripcion) {

        Inscripcion insc = inscripcionRepositorio
                .findByIdCursoAndIdEstudiante(idCurso, idEstudiante)
                .orElseThrow(() -> new NoSuchElementException("Inscripción no encontrada para el curso y estudiante."));

        // Módulos del curso
        List<Modulo> modulos = moduloRepositorio.findByIdCursoOrderByOrdenAsc(idCurso);
        if (modulos == null) modulos = List.of();

        // Set de módulos aprobados manualmente (si existe)
        Set<String> modulosAprobadosManualmente =
                Optional.ofNullable(insc.getModulosAprobadosManualmente())
                        .orElseGet(HashSet::new);

        List<ModuloProgresoDTO> modulosDTO = new ArrayList<>();
        List<BigDecimal> notasModulos = new ArrayList<>();
        boolean todosModulosAprobados = true;

        for (Modulo mod : modulos) {
            // Lecciones del módulo
            List<Leccion> lecciones = leccionRepositorio.findByIdModuloOrderByOrdenAsc(mod.getId());
            if (lecciones == null) lecciones = List.of();

            List<LeccionProgresoDTO> leccionesDTO = new ArrayList<>();
            List<BigDecimal> notasLeccion = new ArrayList<>();

            for (Leccion lec : lecciones) {

                // Evaluaciones de la lección (todas, sin filtrar por estado por ahora)
                List<Evaluacion> evals = evaluacionRepositorio.findByIdLeccionOrderByTituloAsc(lec.getId());
                if (evals == null) evals = List.of();

                List<BigDecimal> notasEval = new ArrayList<>();

                for (Evaluacion eval : evals) {
                    // Si quieres, puedes saltar ARCHIVADAS:
                    if (eval.getEstado() == Evaluacion.EstadoPublicacion.ARCHIVADA) {
                        continue;
                    }

                    // Intentos del estudiante en esta evaluación
                    List<Intento> intentos = intentoRepositorio
                            .findByIdEvaluacionAndIdEstudianteOrderByEnviadoEnDesc(
                                    eval.getId(), idEstudiante
                            );

                    if (intentos == null || intentos.isEmpty()) {
                        continue;
                    }

                    // Usar el intento con mayor puntaje que tenga puntaje y puntajeMaximo
                    Optional<Intento> mejorIntento = intentos.stream()
                            .filter(i -> i.getPuntaje() != null && i.getPuntajeMaximo() != null)
                            .max(Comparator.comparing(i -> safeBigDecimal(i.getPuntaje())));

                    if (mejorIntento.isEmpty()) {
                        continue;
                    }

                    Intento i = mejorIntento.get();
                    BigDecimal puntaje = safeBigDecimal(i.getPuntaje());
                    BigDecimal max = safeBigDecimal(i.getPuntajeMaximo());

                    if (max.signum() <= 0) continue;

                    BigDecimal porcentaje = puntaje
                            .multiply(CIEN)
                            .divide(max, 2, RoundingMode.HALF_UP);

                    notasEval.add(porcentaje);
                }

                BigDecimal notaLeccion = promedio(notasEval);
                boolean leccionAprobada = notaLeccion != null &&
                        notaLeccion.compareTo(NOTA_APROBATORIA_DEFAULT) >= 0;

                if (notaLeccion != null) {
                    notasLeccion.add(notaLeccion);
                }

                leccionesDTO.add(new LeccionProgresoDTO(
                        lec.getId(),
                        lec.getTitulo(),
                        notaLeccion,
                        leccionAprobada
                ));
            }

            BigDecimal notaModulo = promedio(notasLeccion);

            // Umbral fijo por módulo, por ahora
            BigDecimal umbralModulo = NOTA_APROBATORIA_DEFAULT;

            boolean aprobadoModulo = false;

            // Si el módulo está marcado manualmente, se considera aprobado
            if (modulosAprobadosManualmente.contains(mod.getId())) {
                aprobadoModulo = true;
            } else if (notaModulo != null) {
                aprobadoModulo = notaModulo.compareTo(umbralModulo) >= 0;
            }

            if (!aprobadoModulo) {
                todosModulosAprobados = false;
            }

            if (notaModulo != null) {
                notasModulos.add(notaModulo);
            }

            modulosDTO.add(new ModuloProgresoDTO(
                    mod.getId(),
                    mod.getTitulo(),
                    notaModulo,
                    aprobadoModulo,
                    leccionesDTO
            ));
        }

        BigDecimal notaFinalCurso = promedio(notasModulos);
        boolean aprobadoFinal = todosModulosAprobados && !modulosDTO.isEmpty();

        if (actualizarInscripcion) {
            insc.setNotaFinal(notaFinalCurso);
            insc.setAprobadoFinal(aprobadoFinal);

            // Si aprobó todo, marcamos COMPLETADA
            if (aprobadoFinal &&
                insc.getEstado() != Inscripcion.EstadoInscripcion.COMPLETADA) {
                insc.setEstado(Inscripcion.EstadoInscripcion.COMPLETADA);
                insc.setCompletadaAt(Instant.now());
            }

            inscripcionRepositorio.save(insc);
        }

        return new CursoProgresoDTO(
                idCurso,
                insc.getId(),
                notaFinalCurso,
                aprobadoFinal,
                modulosDTO
        );
    }

    /**
     * Helper para ser llamado desde CalificacionServicio.publicar(...)
     * cuando quieras recalcular progreso a partir de una calificación.
     */
    public void recalcularProgresoPorCalificacion(Calificacion calificacion) {
        if (calificacion == null) return;
        String idEvaluacion = calificacion.getIdEvaluacion();
        String idEstudiante = calificacion.getIdEstudiante();
        if (idEvaluacion == null || idEstudiante == null) return;

        evaluacionRepositorio.findById(idEvaluacion).ifPresent(eval -> {
            String idCurso = eval.getIdCurso();
            if (idCurso != null) {
                calcularProgresoCurso(idCurso, idEstudiante, true);
            }
        });
    }

    // ================= helpers numéricos =================

    private BigDecimal promedio(List<BigDecimal> valores) {
        if (valores == null || valores.isEmpty()) return null;
        BigDecimal suma = BigDecimal.ZERO;
        long count = 0;
        for (BigDecimal v : valores) {
            if (v != null) {
                suma = suma.add(v);
                count++;
            }
        }
        if (count == 0) return null;
        return suma.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal safeBigDecimal(BigDecimal bd) {
        return bd == null ? BigDecimal.ZERO : bd;
    }
}
