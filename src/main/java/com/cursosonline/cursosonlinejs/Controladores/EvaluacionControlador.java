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

@RestController
@RequestMapping("/api/v1/lecciones/{idLeccion}/evaluaciones")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
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
    @PreAuthorize("isAuthenticated()")
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
    @PreAuthorize("isAuthenticated()")
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

    // =========================================================
    // CRUD DE PREGUNTAS DENTRO DE UNA EVALUACIÓN
    // /api/v1/lecciones/{idLeccion}/evaluaciones/{idEval}/preguntas
    // =========================================================

    @GetMapping("/{idEval}/preguntas")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion)")
    public ResponseEntity<?> listarPreguntas(@PathVariable String idLeccion,
                                             @PathVariable String idEval) {
        var opt = evaluacionServicio.obtenerPorIdYLeccion(idEval, idLeccion);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Evaluacion eval = opt.get();

        List<Pregunta> lista = eval.getPreguntas();
        if (lista == null) lista = List.of();
        return ResponseEntity.ok(lista);
    }

    @PostMapping(value = "/{idEval}/preguntas", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion)")
    public ResponseEntity<?> crearPregunta(@PathVariable String idLeccion,
                                           @PathVariable String idEval,
                                           @Valid @RequestBody PreguntaRequest body) {
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

    @PutMapping(value = "/{idEval}/preguntas/{idPregunta}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion)")
    public ResponseEntity<?> actualizarPregunta(@PathVariable String idLeccion,
                                                @PathVariable String idEval,
                                                @PathVariable String idPregunta,
                                                @Valid @RequestBody PreguntaRequest body) {
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

    @DeleteMapping("/{idEval}/preguntas/{idPregunta}")
    @PreAuthorize("hasRole('ADMIN') or @evalPermisos.esInstructorDeLeccion(#idLeccion)")
    public ResponseEntity<?> eliminarPregunta(@PathVariable String idLeccion,
                                              @PathVariable String idEval,
                                              @PathVariable String idPregunta) {
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

    // DTO para crear/editar preguntas
    public static record PreguntaRequest(
            @NotBlank String enunciado,
            @NotBlank String tipo,          // "opcion_unica", "multiple", "vf", "numerica", "abierta"
            @Min(0) Integer puntaje,
            Boolean autoCalificable,
            List<OpcionRequest> opciones,
            Double respuestaNumericaCorrecta,
            String respuestaTextoGuia
    ) {}

    public static record OpcionRequest(
            @NotBlank String texto,
            Boolean correcta,
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
