package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.Entidades.Curso;
import com.cursosonline.cursosonlinejs.Entidades.Evaluacion;
import com.cursosonline.cursosonlinejs.Entidades.Evaluacion.TipoEvaluacion;
import com.cursosonline.cursosonlinejs.Entidades.Leccion;
import com.cursosonline.cursosonlinejs.Entidades.Modulo;
import com.cursosonline.cursosonlinejs.Repositorios.CursoRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.LeccionRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.ModuloRepositorio;
import com.cursosonline.cursosonlinejs.Seguridad.EvaluacionPermisos;
import com.cursosonline.cursosonlinejs.Servicios.EvaluacionServicio;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/lecciones/{idLeccion}/evaluaciones")

public class EvaluacionControlador {

    private final EvaluacionServicio evaluacionServicio;
    private final EvaluacionPermisos evalPermisos;
    private final LeccionRepositorio leccionRepo;
    private final ModuloRepositorio moduloRepo;
    private final CursoRepositorio cursoRepo;

    public EvaluacionControlador(EvaluacionServicio evaluacionServicio,
                                 EvaluacionPermisos evalPermisos,
                                 LeccionRepositorio leccionRepo,
                                 ModuloRepositorio moduloRepo,
                                 CursoRepositorio cursoRepo) {
        this.evaluacionServicio = evaluacionServicio;
        this.evalPermisos = evalPermisos;
        this.leccionRepo = leccionRepo;
        this.moduloRepo = moduloRepo;
        this.cursoRepo = cursoRepo;
    }

    private static boolean isAdmin() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null) return false;
        return a.getAuthorities().stream().anyMatch(ga -> "ROLE_ADMIN".equals(ga.getAuthority()));
    }

    @PostMapping(consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion)")
    public ResponseEntity<?> crear(@PathVariable String idLeccion,
                                   @Valid @RequestBody CrearEvalRequest body) {
        Evaluacion e = new Evaluacion();
        e.setTitulo(body.titulo().trim());
        e.setTipo(parseTipo(body.tipo()));
        e.setPuntajeMaximo(BigDecimal.valueOf(body.puntajeMaximo()));
        e.setIdLeccion(idLeccion);

        Evaluacion creada = evaluacionServicio.guardar(e);
        URI location = URI.create("/api/v1/lecciones/" + idLeccion + "/evaluaciones/" + creada.getId());
        return ResponseEntity.created(location).body(creada);
    }

    @GetMapping(produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion) or @evalPermisos.estaInscritoEnCursoDeLeccion(#idLeccion)")
    public ResponseEntity<?> listar(@PathVariable String idLeccion) {
        Leccion leccion = leccionRepo.findById(idLeccion).orElse(null);
        if (leccion == null) return ResponseEntity.notFound().build();
        Modulo modulo = moduloRepo.findById(leccion.getIdModulo()).orElse(null);
        if (modulo == null) return ResponseEntity.notFound().build();
        Curso curso = cursoRepo.findById(leccion.getIdCurso()).orElse(null);
        if (curso == null) return ResponseEntity.notFound().build();

        boolean admin = isAdmin();
        boolean instructor = evalPermisos.esInstructorDeLeccion(idLeccion);

        if (!admin && !instructor) {
            if (curso.getEstado() == Curso.EstadoCurso.ARCHIVADO
                    || modulo.getEstado() == Modulo.EstadoModulo.ARCHIVADO
                    || leccion.getEstado() == Leccion.EstadoPublicacion.ARCHIVADO) {
                return ResponseEntity.status(403).body("Contenido archivado.");
            }
            return ResponseEntity.ok(evaluacionServicio.listarPublicadasPorLeccion(idLeccion));
        }

        return ResponseEntity.ok(evaluacionServicio.listarPorLeccion(idLeccion));
    }

    @GetMapping(value = "/{idEval}", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion) or @evalPermisos.estaInscritoEnCursoDeLeccion(#idLeccion)")
    public ResponseEntity<?> obtener(@PathVariable String idLeccion, @PathVariable String idEval) {
        var opt = evaluacionServicio.obtenerPorIdYLeccion(idEval, idLeccion);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Evaluacion e = opt.get();

        Leccion leccion = leccionRepo.findById(idLeccion).orElse(null);
        if (leccion == null) return ResponseEntity.notFound().build();
        Modulo modulo = moduloRepo.findById(leccion.getIdModulo()).orElse(null);
        if (modulo == null) return ResponseEntity.notFound().build();
        Curso curso = cursoRepo.findById(leccion.getIdCurso()).orElse(null);
        if (curso == null) return ResponseEntity.notFound().build();

        boolean admin = isAdmin();
        boolean instructor = evalPermisos.esInstructorDeLeccion(idLeccion);

        if (!admin && !instructor) {
            if (curso.getEstado() == Curso.EstadoCurso.ARCHIVADO
                    || modulo.getEstado() == Modulo.EstadoModulo.ARCHIVADO
                    || leccion.getEstado() == Leccion.EstadoPublicacion.ARCHIVADO) {
                return ResponseEntity.status(403).body("Contenido archivado.");
            }
            if (e.getEstado() != Evaluacion.EstadoPublicacion.PUBLICADA) {
                return ResponseEntity.status(404).body("Evaluación no disponible.");
            }
        }

        return ResponseEntity.ok(e);
    }

    @PatchMapping("/{idEval}/publicar")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion)")
    public ResponseEntity<?> publicar(@PathVariable String idLeccion, @PathVariable String idEval) {
        return evaluacionServicio.publicar(idEval, idLeccion)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{idEval}/archivar")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion)")
    public ResponseEntity<?> archivar(@PathVariable String idLeccion, @PathVariable String idEval) {
        try {
            return evaluacionServicio.archivar(idEval, idLeccion)
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(409).body(ex.getMessage());
        }
    }

    @PutMapping(value = "/{idEval}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion)")
    public ResponseEntity<?> actualizar(@PathVariable String idLeccion,
                                        @PathVariable String idEval,
                                        @Valid @RequestBody ActualizarEvalRequest body) {
        return evaluacionServicio
                .actualizar(
                        idEval,
                        idLeccion,
                        body.titulo().trim(),
                        parseTipo(body.tipo()),
                        BigDecimal.valueOf(body.puntajeMaximo())
                )
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping(value = "/{idEval}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion)")
    public ResponseEntity<?> patch(@PathVariable String idLeccion,
                                   @PathVariable String idEval,
                                   @RequestBody PatchEvalRequest body) {
        TipoEvaluacion tipo = body.tipo() == null ? null : parseTipo(body.tipo());
        BigDecimal puntaje = body.puntajeMaximo() == null ? null : BigDecimal.valueOf(body.puntajeMaximo());

        return evaluacionServicio.patchParcial(
                        idEval,
                        idLeccion,
                        body.titulo(),
                        tipo,
                        puntaje
                )
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{idEval}")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion)")
    public ResponseEntity<?> eliminar(@PathVariable String idLeccion, @PathVariable String idEval) {
        boolean ok = evaluacionServicio.eliminar(idEval, idLeccion);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    public static record CrearEvalRequest(
            @NotBlank String titulo,
            @NotBlank String tipo,
            @Min(1) int puntajeMaximo
    ) {}

    public static record ActualizarEvalRequest(
            @NotBlank String titulo,
            @NotBlank String tipo,
            @Min(1) int puntajeMaximo
    ) {}

    public static record PatchEvalRequest(
            String titulo,
            String tipo,
            Integer puntajeMaximo
    ) {}

    private static TipoEvaluacion parseTipo(String raw) {
        if (raw == null) throw new IllegalArgumentException("tipo es obligatorio");
        switch (raw.trim().toLowerCase()) {
            case "quiz":  return TipoEvaluacion.QUIZ;
            case "tarea": return TipoEvaluacion.TAREA;
            default: throw new IllegalArgumentException("tipo inválido: " + raw + " (use 'quiz' o 'tarea')");
        }
    }
}
