package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.Entidades.Curso;
import com.cursosonline.cursosonlinejs.Entidades.Evaluacion;
import com.cursosonline.cursosonlinejs.Entidades.Evaluacion.TipoEvaluacion;
import com.cursosonline.cursosonlinejs.Entidades.Leccion;
import com.cursosonline.cursosonlinejs.Entidades.Modulo;
import com.cursosonline.cursosonlinejs.Entidades.Pregunta;
import com.cursosonline.cursosonlinejs.Entidades.OpcionPregunta;
import com.cursosonline.cursosonlinejs.Entidades.TipoPregunta;
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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

// Swagger / OpenAPI
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/lecciones/{idLeccion}/evaluaciones")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
@Tag(
        name = "Evaluaciones",
        description = "Gestión de evaluaciones dentro de una lección (creación, publicación, archivo, preguntas, etc.)."
)
@SecurityRequirement(name = "bearerAuth")
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

    // =========================================================
    // CRUD BÁSICO DE EVALUACIONES
    // =========================================================

    @Operation(
            summary = "Crear una evaluación en una lección",
            description = """
                    Crea una nueva evaluación (quiz o tarea) asociada a una lección.
                    Solo el instructor de la lección o un administrador pueden crear evaluaciones.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Evaluación creada correctamente",
                    content = @Content(schema = @Schema(implementation = Evaluacion.class))),
            @ApiResponse(responseCode = "400", description = "Datos inválidos en la petición"),
            @ApiResponse(responseCode = "403", description = "No autorizado para crear evaluaciones en esta lección")
    })
    @PostMapping(consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion)")
    public ResponseEntity<?> crear(
            @Parameter(description = "ID de la lección a la que pertenece la evaluación", example = "lec_123456")
            @PathVariable String idLeccion,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Datos básicos de la evaluación a crear",
                    required = true,
                    content = @Content(schema = @Schema(implementation = CrearEvalRequest.class))
            )
            @Valid @RequestBody CrearEvalRequest body
    ) {
        Evaluacion e = new Evaluacion();
        e.setTitulo(body.titulo().trim());
        e.setTipo(parseTipo(body.tipo()));
        e.setPuntajeMaximo(BigDecimal.valueOf(body.puntajeMaximo()));
        e.setIdLeccion(idLeccion);

        Evaluacion creada = evaluacionServicio.guardar(e);
        URI location = URI.create("/api/v1/lecciones/" + idLeccion + "/evaluaciones/" + creada.getId());
        return ResponseEntity.created(location).body(creada);
    }

    @Operation(
            summary = "Listar evaluaciones de una lección",
            description = """
                    Lista las evaluaciones de una lección.
                    - Estudiantes ven solo evaluaciones PUBLICADAS y no archivadas.
                    - Instructores y administradores ven todas las evaluaciones de la lección.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado de evaluaciones",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = Evaluacion.class)))),
            @ApiResponse(responseCode = "403", description = "Contenido archivado o no disponible"),
            @ApiResponse(responseCode = "404", description = "Lección/curso/módulo no encontrado")
    })
    @GetMapping(produces = "application/json")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> listar(
            @Parameter(description = "ID de la lección", example = "lec_123456")
            @PathVariable String idLeccion
    ) {
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

    @Operation(
            summary = "Obtener detalles de una evaluación",
            description = """
                    Obtiene una evaluación por ID dentro de una lección.
                    - Estudiantes solo pueden ver evaluaciones PUBLICADAS y no archivadas.
                    - Instructores y administradores pueden ver cualquier estado.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Evaluación encontrada",
                    content = @Content(schema = @Schema(implementation = Evaluacion.class))),
            @ApiResponse(responseCode = "403", description = "Evaluación/Contenido archivado o no disponible"),
            @ApiResponse(responseCode = "404", description = "Evaluación, lección, módulo o curso no encontrado")
    })
    @GetMapping(value = "/{idEval}", produces = "application/json")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> obtener(
            @Parameter(description = "ID de la lección", example = "lec_123456")
            @PathVariable String idLeccion,
            @Parameter(description = "ID de la evaluación", example = "eval_123456")
            @PathVariable String idEval
    ) {
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

    @Operation(
            summary = "Publicar una evaluación",
            description = "Cambia el estado de la evaluación a PUBLICADA. Solo instructor de la lección o administrador."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Evaluación publicada correctamente",
                    content = @Content(schema = @Schema(implementation = Evaluacion.class))),
            @ApiResponse(responseCode = "404", description = "Evaluación no encontrada")
    })
    @PatchMapping("/{idEval}/publicar")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion)")
    public ResponseEntity<?> publicar(
            @Parameter(description = "ID de la lección", example = "lec_123456")
            @PathVariable String idLeccion,
            @Parameter(description = "ID de la evaluación", example = "eval_123456")
            @PathVariable String idEval
    ) {
        return evaluacionServicio.publicar(idEval, idLeccion)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Operation(
            summary = "Archivar una evaluación",
            description = "Cambia el estado de la evaluación a ARCHIVADA. Solo instructor de la lección o administrador."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Evaluación archivada correctamente",
                    content = @Content(schema = @Schema(implementation = Evaluacion.class))),
            @ApiResponse(responseCode = "404", description = "Evaluación no encontrada"),
            @ApiResponse(responseCode = "409", description = "No se puede archivar por restricciones de negocio")
    })
    @PatchMapping("/{idEval}/archivar")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion)")
    public ResponseEntity<?> archivar(
            @Parameter(description = "ID de la lección", example = "lec_123456")
            @PathVariable String idLeccion,
            @Parameter(description = "ID de la evaluación", example = "eval_123456")
            @PathVariable String idEval
    ) {
        try {
            return evaluacionServicio.archivar(idEval, idLeccion)
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(409).body(ex.getMessage());
        }
    }

    @Operation(
            summary = "Actualizar completamente una evaluación",
            description = "Reemplaza título, tipo y puntaje máximo de una evaluación existente."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Evaluación actualizada correctamente",
                    content = @Content(schema = @Schema(implementation = Evaluacion.class))),
            @ApiResponse(responseCode = "404", description = "Evaluación no encontrada")
    })
    @PutMapping(value = "/{idEval}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion)")
    public ResponseEntity<?> actualizar(
            @Parameter(description = "ID de la lección", example = "lec_123456")
            @PathVariable String idLeccion,
            @Parameter(description = "ID de la evaluación", example = "eval_123456")
            @PathVariable String idEval,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Datos actualizados de la evaluación",
                    required = true,
                    content = @Content(schema = @Schema(implementation = ActualizarEvalRequest.class))
            )
            @Valid @RequestBody ActualizarEvalRequest body
    ) {
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

    @Operation(
            summary = "Actualizar parcialmente una evaluación",
            description = "Permite actualizar uno o más campos de la evaluación (título, tipo, puntaje máximo)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Evaluación actualizada parcialmente",
                    content = @Content(schema = @Schema(implementation = Evaluacion.class))),
            @ApiResponse(responseCode = "404", description = "Evaluación no encontrada")
    })
    @PatchMapping(value = "/{idEval}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion)")
    public ResponseEntity<?> patch(
            @Parameter(description = "ID de la lección", example = "lec_123456")
            @PathVariable String idLeccion,
            @Parameter(description = "ID de la evaluación", example = "eval_123456")
            @PathVariable String idEval,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Campos parciales a actualizar",
                    required = true,
                    content = @Content(schema = @Schema(implementation = PatchEvalRequest.class))
            )
            @RequestBody PatchEvalRequest body
    ) {
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

    @Operation(
            summary = "Eliminar una evaluación",
            description = "Elimina una evaluación de una lección. Solo instructor de la lección o administrador."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Evaluación eliminada correctamente"),
            @ApiResponse(responseCode = "404", description = "Evaluación no encontrada")
    })
    @DeleteMapping("/{idEval}")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion)")
    public ResponseEntity<?> eliminar(
            @Parameter(description = "ID de la lección", example = "lec_123456")
            @PathVariable String idLeccion,
            @Parameter(description = "ID de la evaluación", example = "eval_123456")
            @PathVariable String idEval
    ) {
        boolean ok = evaluacionServicio.eliminar(idEval, idLeccion);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    // =========================================================
    // CRUD DE PREGUNTAS DENTRO DE UNA EVALUACIÓN
    // /api/v1/lecciones/{idLeccion}/evaluaciones/{idEval}/preguntas
    // =========================================================

    @Operation(
            summary = "Listar preguntas de una evaluación",
            description = "Devuelve todas las preguntas asociadas a una evaluación, solo para instructor o administrador."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado de preguntas",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = Pregunta.class)))),
            @ApiResponse(responseCode = "404", description = "Evaluación no encontrada")
    })
    @GetMapping("/{idEval}/preguntas")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion)")
    public ResponseEntity<?> listarPreguntas(
            @Parameter(description = "ID de la lección", example = "lec_123456")
            @PathVariable String idLeccion,
            @Parameter(description = "ID de la evaluación", example = "eval_123456")
            @PathVariable String idEval
    ) {
        var opt = evaluacionServicio.obtenerPorIdYLeccion(idEval, idLeccion);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Evaluacion eval = opt.get();

        List<Pregunta> lista = eval.getPreguntas();
        if (lista == null) lista = List.of();
        return ResponseEntity.ok(lista);
    }

    @Operation(
            summary = "Crear una pregunta en una evaluación",
            description = """
                    Crea una nueva pregunta (opción múltiple, VF, numérica o abierta) dentro de una evaluación.
                    Solo instructor de la lección o administrador.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Pregunta creada correctamente",
                    content = @Content(schema = @Schema(implementation = Pregunta.class))),
            @ApiResponse(responseCode = "400", description = "Datos inválidos en la pregunta"),
            @ApiResponse(responseCode = "404", description = "Evaluación no encontrada")
    })
    @PostMapping(value = "/{idEval}/preguntas", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion)")
    public ResponseEntity<?> crearPregunta(
            @Parameter(description = "ID de la lección", example = "lec_123456")
            @PathVariable String idLeccion,
            @Parameter(description = "ID de la evaluación", example = "eval_123456")
            @PathVariable String idEval,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Datos de la pregunta a crear",
                    required = true,
                    content = @Content(schema = @Schema(implementation = PreguntaRequest.class))
            )
            @Valid @RequestBody PreguntaRequest body
    ) {
        var opt = evaluacionServicio.obtenerPorIdYLeccion(idEval, idLeccion);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Evaluacion eval = opt.get();

        Pregunta p = new Pregunta();
        p.setEnunciado(body.enunciado().trim());
        p.setTipo(parseTipoPregunta(body.tipo()));
        p.setPuntaje(body.puntaje());
        p.setAutoCalificable(body.autoCalificable() == null ? true : body.autoCalificable());

        // Opciones
        if (body.opciones() != null && !body.opciones().isEmpty()) {
            List<OpcionPregunta> ops = new ArrayList<>();
            for (OpcionRequest oReq : body.opciones()) {
                OpcionPregunta op = new OpcionPregunta();
                op.setTexto(oReq.texto().trim());
                op.setCorrecta(Boolean.TRUE.equals(oReq.correcta()));
                op.setRetroalimentacion(oReq.retroalimentacion());
                ops.add(op);
            }
            p.setOpciones(ops);
        }

        // Numérica
        p.setRespuestaNumericaCorrecta(body.respuestaNumericaCorrecta());

        // Abierta
        p.setRespuestaTextoGuia(body.respuestaTextoGuia());

        inicializarPregunta(eval, p);

        if (eval.getPreguntas() == null) {
            eval.setPreguntas(new ArrayList<>());
        }
        eval.getPreguntas().add(p);
        postProcesarPreguntas(eval);

        evaluacionServicio.guardar(eval);

        URI location = URI.create("/api/v1/lecciones/" + idLeccion
                + "/evaluaciones/" + idEval + "/preguntas/" + p.getId());
        return ResponseEntity.created(location).body(p);
    }

    @Operation(
            summary = "Actualizar una pregunta de una evaluación",
            description = "Reemplaza completamente los datos de una pregunta dentro de una evaluación."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Pregunta actualizada correctamente",
                    content = @Content(schema = @Schema(implementation = Pregunta.class))),
            @ApiResponse(responseCode = "404", description = "Evaluación o pregunta no encontrada")
    })
    @PutMapping(value = "/{idEval}/preguntas/{idPregunta}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion)")
    public ResponseEntity<?> actualizarPregunta(
            @Parameter(description = "ID de la lección", example = "lec_123456")
            @PathVariable String idLeccion,
            @Parameter(description = "ID de la evaluación", example = "eval_123456")
            @PathVariable String idEval,
            @Parameter(description = "ID de la pregunta", example = "preg_123456")
            @PathVariable String idPregunta,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Datos actualizados de la pregunta",
                    required = true,
                    content = @Content(schema = @Schema(implementation = PreguntaRequest.class))
            )
            @Valid @RequestBody PreguntaRequest body
    ) {
        var opt = evaluacionServicio.obtenerPorIdYLeccion(idEval, idLeccion);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Evaluacion eval = opt.get();

        if (eval.getPreguntas() == null || eval.getPreguntas().isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Pregunta encontrada = null;
        for (Pregunta p : eval.getPreguntas()) {
            if (idPregunta.equals(p.getId())) {
                encontrada = p;
                break;
            }
        }
        if (encontrada == null) return ResponseEntity.notFound().build();

        // Actualizamos campos
        encontrada.setEnunciado(body.enunciado().trim());
        encontrada.setTipo(parseTipoPregunta(body.tipo()));
        encontrada.setPuntaje(body.puntaje());
        if (body.autoCalificable() != null) {
            encontrada.setAutoCalificable(body.autoCalificable());
        }

        // Opciones
        List<OpcionPregunta> nuevasOpciones = new ArrayList<>();
        if (body.opciones() != null) {
            for (OpcionRequest oReq : body.opciones()) {
                OpcionPregunta op = new OpcionPregunta();
                op.setTexto(oReq.texto().trim());
                op.setCorrecta(Boolean.TRUE.equals(oReq.correcta()));
                op.setRetroalimentacion(oReq.retroalimentacion());
                nuevasOpciones.add(op);
            }
        }
        encontrada.setOpciones(nuevasOpciones);

        // Numérica / abierta
        encontrada.setRespuestaNumericaCorrecta(body.respuestaNumericaCorrecta());
        encontrada.setRespuestaTextoGuia(body.respuestaTextoGuia());

        inicializarPregunta(eval, encontrada);
        postProcesarPreguntas(eval);
        evaluacionServicio.guardar(eval);

        return ResponseEntity.ok(encontrada);
    }

    @Operation(
            summary = "Eliminar una pregunta de una evaluación",
            description = "Elimina una pregunta específica de una evaluación."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Pregunta eliminada correctamente"),
            @ApiResponse(responseCode = "404", description = "Evaluación o pregunta no encontrada")
    })
    @DeleteMapping("/{idEval}/preguntas/{idPregunta}")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion)")
    public ResponseEntity<?> eliminarPregunta(
            @Parameter(description = "ID de la lección", example = "lec_123456")
            @PathVariable String idLeccion,
            @Parameter(description = "ID de la evaluación", example = "eval_123456")
            @PathVariable String idEval,
            @Parameter(description = "ID de la pregunta", example = "preg_123456")
            @PathVariable String idPregunta
    ) {
        var opt = evaluacionServicio.obtenerPorIdYLeccion(idEval, idLeccion);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Evaluacion eval = opt.get();

        if (eval.getPreguntas() == null || eval.getPreguntas().isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        boolean removed = eval.getPreguntas().removeIf(p -> idPregunta.equals(p.getId()));
        if (!removed) return ResponseEntity.notFound().build();

        postProcesarPreguntas(eval);
        evaluacionServicio.guardar(eval);

        return ResponseEntity.noContent().build();
    }

    // =========================================================
    // DTOs / REQUEST RECORDS
    // =========================================================

    @Schema(description = "Datos requeridos para crear una evaluación")
    public static record CrearEvalRequest(
            @Schema(description = "Título de la evaluación", example = "Quiz de introducción")
            @NotBlank String titulo,

            @Schema(description = "Tipo de evaluación: 'quiz' o 'tarea'", example = "quiz")
            @NotBlank String tipo,

            @Schema(description = "Puntaje máximo de la evaluación", example = "10")
            @Min(1) int puntajeMaximo
    ) {}

    @Schema(description = "Datos para actualizar completamente una evaluación")
    public static record ActualizarEvalRequest(
            @Schema(description = "Título de la evaluación", example = "Quiz de introducción (actualizado)")
            @NotBlank String titulo,

            @Schema(description = "Tipo de evaluación: 'quiz' o 'tarea'", example = "tarea")
            @NotBlank String tipo,

            @Schema(description = "Puntaje máximo de la evaluación", example = "20")
            @Min(1) int puntajeMaximo
    ) {}

    @Schema(description = "Datos para actualización parcial de una evaluación")
    public static record PatchEvalRequest(
            @Schema(description = "Nuevo título de la evaluación", example = "Quiz final")
            String titulo,

            @Schema(description = "Nuevo tipo de evaluación", example = "quiz")
            String tipo,

            @Schema(description = "Nuevo puntaje máximo", example = "15")
            Integer puntajeMaximo
    ) {}

    @Schema(description = "Datos para crear o actualizar una pregunta dentro de una evaluación")
    public static record PreguntaRequest(
            @Schema(description = "Enunciado de la pregunta", example = "¿Qué es una variable en programación?")
            @NotBlank String enunciado,

            @Schema(
                    description = "Tipo de pregunta: 'opcion_unica', 'multiple', 'vf', 'numerica', 'abierta'",
                    example = "opcion_unica"
            )
            @NotBlank String tipo,

            @Schema(description = "Puntaje de la pregunta", example = "2")
            @Min(0) Integer puntaje,

            @Schema(description = "Indica si la pregunta se califica automáticamente (por defecto true para opción múltiple)", example = "true")
            Boolean autoCalificable,

            @Schema(description = "Opciones de respuesta (aplica para opción múltiple y VF)")
            List<OpcionRequest> opciones,

            @Schema(description = "Respuesta correcta numérica (solo para preguntas numéricas)", example = "3.14")
            Double respuestaNumericaCorrecta,

            @Schema(description = "Texto guía o ejemplo de respuesta (aplica para abiertas)", example = "Explica con tus propias palabras...")
            String respuestaTextoGuia
    ) {}

    @Schema(description = "Datos de una opción dentro de una pregunta de opción múltiple o VF")
    public static record OpcionRequest(
            @Schema(description = "Texto de la opción", example = "Es un espacio en memoria donde se almacena un valor.")
            @NotBlank String texto,

            @Schema(description = "Indica si la opción es correcta", example = "true")
            Boolean correcta,

            @Schema(description = "Retroalimentación opcional sobre la opción", example = "Recuerda que una variable tiene un tipo de dato asociado.")
            String retroalimentacion
    ) {}

    // =========================================================
    // HELPERS
    // =========================================================

    private static TipoEvaluacion parseTipo(String raw) {
        if (raw == null) throw new IllegalArgumentException("tipo es obligatorio");
        switch (raw.trim().toLowerCase()) {
            case "quiz":
                return TipoEvaluacion.QUIZ;
            case "tarea":
                return TipoEvaluacion.TAREA;
            default:
                throw new IllegalArgumentException(
                        "tipo inválido: " + raw + " (use 'quiz' o 'tarea')"
                );
        }
    }

    /**
     * Convierte el string que viene del front en tu enum TipoPregunta
     * (OPCION_MULTIPLE, VERDADERO_FALSO, NUMERICA, ABIERTA / ABIERTA_TEXTO, etc).
     */
    private static TipoPregunta parseTipoPregunta(String raw) {
        if (raw == null) {
            throw new IllegalArgumentException("tipo de pregunta es obligatorio");
        }
        String v = raw.trim().toLowerCase();

        switch (v) {
            // opción única → la tratamos como OPCION_MULTIPLE en el enum
            case "opcion_unica":
            case "opcion-unica":
            case "single":
            case "single_choice":
                return TipoPregunta.OPCION_MULTIPLE;

            // selección múltiple
            case "multiple":
            case "multiple_seleccion":
            case "multiple-seleccion":
            case "multiple_choice":
                return TipoPregunta.OPCION_MULTIPLE;

            // verdadero / falso
            case "vf":
            case "v-f":
            case "verdadero_falso":
            case "verdadero-falso":
            case "true_false":
                return TipoPregunta.VERDADERO_FALSO;

            // numérica
            case "numerica":
            case "num":
                return TipoPregunta.NUMERICA;

            // abierta: buscamos cualquier constante del enum que empiece por "ABIERTA"
            case "abierta":
            case "texto":
            case "essay":
                for (TipoPregunta tp : TipoPregunta.values()) {
                    if (tp.name().startsWith("ABIERTA")) {
                        return tp;   // sirve tanto para ABIERTA como para ABIERTA_TEXTO
                    }
                }
                // si por algún motivo no existiera ninguna, devolvemos algo por defecto
                return TipoPregunta.OPCION_MULTIPLE;

            default:
                throw new IllegalArgumentException("tipo de pregunta inválido: " + raw);
        }
    }

    /**
     * Inicializa IDs, valida opciones y ajusta autoCalificable según el tipo.
     */
    private static void inicializarPregunta(Evaluacion eval, Pregunta p) {
        // ID de la pregunta
        if (p.getId() == null || p.getId().isBlank()) {
            p.setId(UUID.randomUUID().toString());
        }

        // Puntaje mínimo
        if (p.getPuntaje() == null || p.getPuntaje() <= 0) {
            p.setPuntaje(1);
        }

        // Tipo por defecto
        if (p.getTipo() == null) {
            p.setTipo(TipoPregunta.OPCION_MULTIPLE);
        }

        // IDs de opciones
        if (p.getOpciones() != null) {
            for (OpcionPregunta op : p.getOpciones()) {
                if (op.getId() == null || op.getId().isBlank()) {
                    op.setId(UUID.randomUUID().toString());
                }
            }
        }

        // Verdadero / falso: si no hay opciones, las creamos
        if (p.getTipo() == TipoPregunta.VERDADERO_FALSO) {
            if (p.getOpciones() == null || p.getOpciones().isEmpty()) {
                List<OpcionPregunta> ops = new ArrayList<>();

                OpcionPregunta v = new OpcionPregunta();
                v.setId(UUID.randomUUID().toString());
                v.setTexto("Verdadero");
                v.setCorrecta(true);
                ops.add(v);

                OpcionPregunta f = new OpcionPregunta();
                f.setId(UUID.randomUUID().toString());
                f.setTexto("Falso");
                f.setCorrecta(false);
                ops.add(f);

                p.setOpciones(ops);
            }
        }

        // Opción múltiple / única: requieren al menos una opción
        if (p.getTipo() == TipoPregunta.OPCION_MULTIPLE) {
            if (p.getOpciones() == null || p.getOpciones().isEmpty()) {
                throw new IllegalArgumentException(
                        "Las preguntas de opción requieren al menos una opción."
                );
            }
        }

        // Numérica: debe tener respuesta correcta
        if (p.getTipo() == TipoPregunta.NUMERICA
                && p.getRespuestaNumericaCorrecta() == null) {
            throw new IllegalArgumentException(
                    "La pregunta numérica requiere una respuesta correcta."
            );
        }

        // Abierta (cualquier constante del enum que empiece por "ABIERTA"):
        // por defecto NO auto-calificable
        if (p.getTipo() != null
                && p.getTipo().name().startsWith("ABIERTA")
                && p.isAutoCalificable()) {
            p.setAutoCalificable(false);
        }
    }

    private static void postProcesarPreguntas(Evaluacion eval) {
        List<Pregunta> lista = eval.getPreguntas();
        int total = (lista == null) ? 0 : lista.size();
        eval.setTotalPreguntas(total);

        boolean auto = true;
        boolean requiereManual = false;

        if (lista != null) {
            for (Pregunta p : lista) {
                if (!p.isAutoCalificable()) {
                    auto = false;
                    requiereManual = true;
                    break;
                }
            }
        }

        eval.setAutoCalificable(auto);
        eval.setRequiereRevisionManual(requiereManual);
    }
}
