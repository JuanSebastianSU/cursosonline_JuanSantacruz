package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.Entidades.Curso;
import com.cursosonline.cursosonlinejs.Entidades.Modulo;
import com.cursosonline.cursosonlinejs.Repositorios.CursoRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.UsuarioRepositorio;
import com.cursosonline.cursosonlinejs.Servicios.ModuloServicio;
import com.cursosonline.cursosonlinejs.Servicios.InscripcionServicio;
import com.cursosonline.cursosonlinejs.Servicios.SolicitudReintentoModuloServicio;
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
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

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
@RequestMapping("/api/v1/cursos/{idCurso}/modulos")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
@Tag(
        name = "Módulos",
        description = "Gestión de módulos dentro de un curso (creación, publicación, orden, nota mínima, reintentos, etc.)."
)
@SecurityRequirement(name = "bearerAuth")
public class ModuloControlador {

    private final ModuloServicio moduloServicio;
    private final CursoRepositorio cursoRepo;
    private final UsuarioRepositorio usuarioRepo;
    private final InscripcionServicio inscripcionServicio;
    private final SolicitudReintentoModuloServicio solicitudReintentoModuloServicio;

    public ModuloControlador(ModuloServicio moduloServicio,
                             CursoRepositorio cursoRepo,
                             UsuarioRepositorio usuarioRepo,
                             InscripcionServicio inscripcionServicio,
                             SolicitudReintentoModuloServicio solicitudReintentoModuloServicio) {
        this.moduloServicio = moduloServicio;
        this.cursoRepo = cursoRepo;
        this.usuarioRepo = usuarioRepo;
        this.inscripcionServicio = inscripcionServicio;
        this.solicitudReintentoModuloServicio = solicitudReintentoModuloServicio;
    }

    private static boolean isAdmin() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null) return false;
        return a.getAuthorities().stream().anyMatch(ga -> "ROLE_ADMIN".equals(ga.getAuthority()));
    }

    private boolean esInstructorDelCurso(String idCurso) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return false;
        var userOpt = usuarioRepo.findByEmail(auth.getName());
        if (userOpt.isEmpty()) return false;
        var curso = cursoRepo.findById(idCurso).orElse(null);
        return curso != null && userOpt.get().getId().equals(curso.getIdInstructor());
    }

    // --- helper para validar nota mínima ---
    private ResponseEntity<String> validarNotaMinima(BigDecimal nota) {
        if (nota == null) return null; // permitido null (sin nota configurada)
        if (nota.compareTo(BigDecimal.ZERO) < 0 || nota.compareTo(BigDecimal.valueOf(100)) > 0) {
            return ResponseEntity
                    .badRequest()
                    .body("La nota mínima debe estar entre 0 y 100.");
        }
        return null;
    }

    @Operation(
            summary = "Crear módulo en un curso",
            description = """
                    Crea un nuevo módulo en el curso.
                    Solo el dueño del curso (instructor) o un ADMIN pueden crear módulos.
                    Se puede configurar una nota mínima de aprobación entre 0 y 100 (opcional).
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Módulo creado correctamente",
                    content = @Content(schema = @Schema(implementation = Modulo.class))),
            @ApiResponse(responseCode = "400", description = "Datos inválidos (ej. nota mínima fuera de rango)"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "No autorizado para crear módulos en este curso"),
            @ApiResponse(responseCode = "409", description = "Conflicto de orden en el curso")
    })
    @PostMapping(consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @cursoPermisos.esDueno(#idCurso)")
    public ResponseEntity<?> crearModulo(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String idCurso,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Datos del módulo a crear",
                    required = true,
                    content = @Content(schema = @Schema(implementation = Modulo.class))
            )
            @Valid @RequestBody Modulo body
    ) {
        if (body.getTitulo() == null || body.getTitulo().isBlank()) {
            return ResponseEntity.badRequest().body("El título es obligatorio.");
        }

        // validar nota mínima (0–100, opcional)
        var errorNota = validarNotaMinima(body.getNotaMinimaAprobacion());
        if (errorNota != null) return errorNota;

        body.setId(null);
        body.setIdCurso(idCurso);

        if (body.getOrden() <= 0) {
            body.setOrden(moduloServicio.siguienteOrden(idCurso));
        } else if (moduloServicio.existeOrdenEnCurso(idCurso, body.getOrden())) {
            return ResponseEntity.status(409).body("Ya existe un módulo con ese orden en este curso.");
        }

        Modulo creado = moduloServicio.guardar(body);
        URI location = URI.create("/api/v1/cursos/" + idCurso + "/modulos/" + creado.getId());
        return ResponseEntity.created(location).body(creado);
    }

    @Operation(
            summary = "Listar módulos de un curso",
            description = """
                    Lista los módulos de un curso.
                    - Estudiantes: solo ven módulos PUBLICADOS y no archivados si el curso está activo.
                    - Instructores/ADMIN: ven todos los módulos del curso.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado de módulos",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = Modulo.class)))),
            @ApiResponse(responseCode = "204", description = "No hay módulos"),
            @ApiResponse(responseCode = "404", description = "Curso no encontrado"),
            @ApiResponse(responseCode = "403", description = "Contenido archivado")
    })
    @GetMapping(produces = "application/json")
    public ResponseEntity<?> listarModulos(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String idCurso
    ) {
        var curso = cursoRepo.findById(idCurso).orElse(null);
        if (curso == null) return ResponseEntity.notFound().build();

        boolean admin = isAdmin();
        boolean instructor = esInstructorDelCurso(idCurso);

        if (!admin && !instructor) {
            if (curso.getEstado() == Curso.EstadoCurso.ARCHIVADO) {
                return ResponseEntity.status(403).body("Contenido archivado.");
            }
            List<Modulo> publicados = moduloServicio.listarPorCurso(idCurso).stream()
                    .filter(m -> m.getEstado() == Modulo.EstadoModulo.PUBLICADO)
                    .collect(Collectors.toList());
            return publicados.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(publicados);
        }

        List<Modulo> todos = moduloServicio.listarPorCurso(idCurso);
        return todos.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(todos);
    }

    @Operation(
            summary = "Obtener detalles de un módulo",
            description = """
                    Devuelve un módulo específico de un curso.
                    - Estudiantes: solo ven módulos PUBLICADOS y no archivados.
                    - Instructores/ADMIN: ven cualquier estado.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Módulo encontrado",
                    content = @Content(schema = @Schema(implementation = Modulo.class))),
            @ApiResponse(responseCode = "404", description = "Módulo o curso no encontrado"),
            @ApiResponse(responseCode = "403", description = "Contenido archivado o módulo no disponible")
    })
    @GetMapping(value = "/{id}", produces = "application/json")
    public ResponseEntity<?> obtenerModulo(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String idCurso,
            @Parameter(description = "ID del módulo", example = "mod_123456")
            @PathVariable String id
    ) {
        var modulo = moduloServicio.obtener(id);
        if (modulo == null) return ResponseEntity.notFound().build();
        if (!idCurso.equals(modulo.getIdCurso())) {
            return ResponseEntity.status(404).body("El módulo no pertenece al curso especificado.");
        }

        var curso = cursoRepo.findById(idCurso).orElse(null);
        if (curso == null) return ResponseEntity.notFound().build();

        boolean admin = isAdmin();
        boolean instructor = esInstructorDelCurso(idCurso);

        if (!admin && !instructor) {
            if (curso.getEstado() == Curso.EstadoCurso.ARCHIVADO
                    || modulo.getEstado() == Modulo.EstadoModulo.ARCHIVADO) {
                return ResponseEntity.status(403).body("Contenido archivado.");
            }
            if (modulo.getEstado() != Modulo.EstadoModulo.PUBLICADO) {
                return ResponseEntity.status(404).body("Módulo no disponible.");
            }
        }

        return ResponseEntity.ok(modulo);
    }

    @Operation(
            summary = "Actualizar módulo",
            description = """
                    Actualiza los datos de un módulo (título, orden, descripción, nota mínima).
                    Solo dueño del curso o ADMIN.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Módulo actualizado correctamente",
                    content = @Content(schema = @Schema(implementation = Modulo.class))),
            @ApiResponse(responseCode = "400", description = "Datos inválidos"),
            @ApiResponse(responseCode = "404", description = "Módulo no encontrado o no pertenece al curso"),
            @ApiResponse(responseCode = "409", description = "Conflicto de orden")
    })
    @PutMapping(value = "/{id}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @cursoPermisos.esDueno(#idCurso)")
    public ResponseEntity<?> actualizarModulo(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String idCurso,
            @Parameter(description = "ID del módulo", example = "mod_123456")
            @PathVariable String id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Datos a actualizar del módulo",
                    required = true,
                    content = @Content(schema = @Schema(implementation = Modulo.class))
            )
            @Valid @RequestBody Modulo body
    ) {
        Modulo actual = moduloServicio.obtener(id);
        if (actual == null) return ResponseEntity.notFound().build();
        if (!idCurso.equals(actual.getIdCurso())) {
            return ResponseEntity.status(404).body("El módulo no pertenece al curso especificado.");
        }

        if (body.getTitulo() != null && !body.getTitulo().isBlank()) {
            actual.setTitulo(body.getTitulo().trim());
        }
        if (body.getOrden() > 0 && body.getOrden() != actual.getOrden()) {
            if (moduloServicio.existeOrdenEnCursoExceptoId(idCurso, body.getOrden(), id)) {
                return ResponseEntity.status(409).body("Ya existe un módulo con ese orden en este curso.");
            }
            actual.setOrden(body.getOrden());
        }
        if (body.getDescripcion() != null) {
            actual.setDescripcion(body.getDescripcion());
        }

        // actualizar nota mínima si viene en el body
        if (body.getNotaMinimaAprobacion() != null) {
            var errorNota = validarNotaMinima(body.getNotaMinimaAprobacion());
            if (errorNota != null) return errorNota;
            actual.setNotaMinimaAprobacion(body.getNotaMinimaAprobacion());
        }

        Modulo actualizado = moduloServicio.guardar(actual);
        return ResponseEntity.ok(actualizado);
    }

    @Operation(
            summary = "Eliminar módulo",
            description = "Elimina un módulo de un curso. Solo dueño del curso o ADMIN."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Módulo eliminado correctamente"),
            @ApiResponse(responseCode = "404", description = "Módulo no encontrado o no pertenece al curso")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @cursoPermisos.esDueno(#idCurso)")
    public ResponseEntity<?> eliminarModulo(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String idCurso,
            @Parameter(description = "ID del módulo", example = "mod_123456")
            @PathVariable String id
    ) {
        Modulo actual = moduloServicio.obtener(id);
        if (actual == null) return ResponseEntity.notFound().build();
        if (!idCurso.equals(actual.getIdCurso())) {
            return ResponseEntity.status(404).body("El módulo no pertenece al curso especificado.");
        }
        moduloServicio.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Cambiar orden de un módulo",
            description = "Cambia el número de orden de un módulo dentro del curso."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Orden actualizado correctamente",
                    content = @Content(schema = @Schema(implementation = Modulo.class))),
            @ApiResponse(responseCode = "400", description = "Petición inválida"),
            @ApiResponse(responseCode = "404", description = "Módulo no encontrado o error de negocio"),
            @ApiResponse(responseCode = "409", description = "Conflicto de orden (indirecto por IllegalArgumentException)")
    })
    @PatchMapping(value = "/{id}/orden", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @cursoPermisos.esDueno(#idCurso)")
    public ResponseEntity<?> cambiarOrden(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String idCurso,
            @Parameter(description = "ID del módulo", example = "mod_123456")
            @PathVariable String id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Nuevo orden del módulo",
                    required = true,
                    content = @Content(schema = @Schema(implementation = CambiarOrdenRequest.class))
            )
            @RequestBody CambiarOrdenRequest body
    ) {
        if (body == null || body.orden() == null || body.orden() < 1) {
            return ResponseEntity.badRequest().body("Debes enviar un 'orden' >= 1.");
        }
        try {
            Modulo result = moduloServicio.cambiarOrden(idCurso, id, body.orden());
            return ResponseEntity.ok(result);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @Operation(
            summary = "Mover módulo en el orden",
            description = "Mueve un módulo hacia arriba o abajo mediante 'delta' o 'direccion'."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Módulo movido correctamente",
                    content = @Content(schema = @Schema(implementation = Modulo.class))),
            @ApiResponse(responseCode = "400", description = "Petición inválida"),
            @ApiResponse(responseCode = "404", description = "Módulo no encontrado o error de negocio")
    })
    @PatchMapping(value = "/{id}/mover", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @cursoPermisos.esDueno(#idCurso)")
    public ResponseEntity<?> mover(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String idCurso,
            @Parameter(description = "ID del módulo", example = "mod_123456")
            @PathVariable String id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Delta (+/-1) o dirección ('up'/'down')",
                    required = true,
                    content = @Content(schema = @Schema(implementation = MoverRequest.class))
            )
            @RequestBody MoverRequest body
    ) {
        int delta = 0;
        if (body != null) {
            if (body.delta() != null) {
                delta = body.delta();
            } else if (body.direccion() != null) {
                switch (body.direccion().toLowerCase()) {
                    case "up":
                    case "arriba":
                        delta = -1;
                        break;
                    case "down":
                    case "abajo":
                        delta = +1;
                        break;
                }
            }
        }
        if (delta == 0) return ResponseEntity.badRequest().body("Envía 'delta' (+/-1) o 'direccion' ('up'/'down').");

        try {
            Modulo result = moduloServicio.moverPorDelta(idCurso, id, delta);
            return ResponseEntity.ok(result);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @Operation(
            summary = "Reordenar módulos de un curso",
            description = "Reordena secuencialmente los módulos de un curso según la lista de IDs enviada."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Módulos reordenados correctamente",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = Modulo.class)))),
            @ApiResponse(responseCode = "400", description = "Petición inválida")
    })
    @PatchMapping(value = "/orden", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @cursoPermisos.esDueno(#idCurso)")
    public ResponseEntity<?> reordenar(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String idCurso,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Lista de IDs de módulos en el orden deseado",
                    required = true,
                    content = @Content(schema = @Schema(implementation = ReordenarRequest.class))
            )
            @RequestBody ReordenarRequest body
    ) {
        if (body == null || body.ids() == null || body.ids().isEmpty()) {
            return ResponseEntity.badRequest().body("Debes enviar 'ids' en el orden deseado.");
        }
        try {
            List<Modulo> result = moduloServicio.reordenarSecuencial(idCurso, body.ids());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(
            summary = "Publicar módulo",
            description = "Marca un módulo como PUBLICADO para que los estudiantes lo vean."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Módulo publicado correctamente",
                    content = @Content(schema = @Schema(implementation = Modulo.class))),
            @ApiResponse(responseCode = "404", description = "Módulo no encontrado o no pertenece al curso")
    })
    @PatchMapping("/{id}/publicar")
    @PreAuthorize("hasRole('ADMIN') or @cursoPermisos.esDueno(#idCurso)")
    public ResponseEntity<?> publicar(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String idCurso,
            @Parameter(description = "ID del módulo", example = "mod_123456")
            @PathVariable String id
    ) {
        var mod = moduloServicio.obtener(id);
        if (mod == null) return ResponseEntity.notFound().build();
        if (!idCurso.equals(mod.getIdCurso())) {
            return ResponseEntity.status(404).body("El módulo no pertenece al curso.");
        }
        return moduloServicio.publicar(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Operation(
            summary = "Archivar módulo",
            description = "Marca un módulo como ARCHIVADO. No será visible para estudiantes."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Módulo archivado correctamente",
                    content = @Content(schema = @Schema(implementation = Modulo.class))),
            @ApiResponse(responseCode = "404", description = "Módulo no encontrado o no pertenece al curso")
    })
    @PatchMapping("/{id}/archivar")
    @PreAuthorize("hasRole('ADMIN') or @cursoPermisos.esDueno(#idCurso)")
    public ResponseEntity<?> archivar(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String idCurso,
            @Parameter(description = "ID del módulo", example = "mod_123456")
            @PathVariable String id
    ) {
        var mod = moduloServicio.obtener(id);
        if (mod == null) return ResponseEntity.notFound().build();
        if (!idCurso.equals(mod.getIdCurso())) {
            return ResponseEntity.status(404).body("El módulo no pertenece al curso.");
        }
        return moduloServicio.archivar(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * NUEVO: el alumno autenticado solicita reintento de este módulo.
     */
    @Operation(
            summary = "Solicitar reintento de módulo (alumno)",
            description = """
                    Permite que el estudiante autenticado solicite un reintento del módulo.
                    Requiere que el estudiante esté inscrito en el curso. Puede opcionalmente enviar un motivo.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Solicitud de reintento creada",
                    content = @Content(schema = @Schema(
                            description = "Objeto de solicitud de reintento de módulo (entidad propia de tu dominio)"
                    ))),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "No está inscrito en el curso"),
            @ApiResponse(responseCode = "404", description = "Módulo no encontrado para este curso"),
            @ApiResponse(responseCode = "409", description = "Ya existe una solicitud o no se puede crear por reglas de negocio")
    })
    @PostMapping("/{id}/solicitar-reintento-mio")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> solicitarReintentoMio(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String idCurso,
            @Parameter(description = "ID del módulo", example = "mod_123456")
            @PathVariable("id") String idModulo,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Motivo opcional de la solicitud de reintento",
                    required = false,
                    content = @Content(schema = @Schema(implementation = SolicitarReintentoRequest.class))
            )
            @RequestBody(required = false) SolicitarReintentoRequest body
    ) {

        // 1) Verificar que el módulo existe y pertenece al curso
        var modulo = moduloServicio.obtener(idModulo);
        if (modulo == null || !idCurso.equals(modulo.getIdCurso())) {
            return ResponseEntity.status(404).body(Map.of(
                    "message", "Módulo no encontrado para este curso."
            ));
        }

        // 2) Obtener id del estudiante actual
        var idEstOpt = inscripcionServicio.obtenerIdEstudianteActual();
        if (idEstOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of(
                    "message", "No autenticado."
            ));
        }
        String idEstudiante = idEstOpt.get();

        // 3) Verificar que está inscrito en el curso
        var inscOpt = inscripcionServicio.obtenerPorCursoYEstudiante(idCurso, idEstudiante);
        if (inscOpt.isEmpty()) {
            return ResponseEntity.status(403).body(Map.of(
                    "message", "No estás inscrito en este curso."
            ));
        }

        String motivo = null;
        if (body != null && body.motivo() != null && !body.motivo().isBlank()) {
            motivo = body.motivo().trim();
        }

        try {
            var sol = solicitudReintentoModuloServicio.crearSolicitud(
                    idCurso,
                    idModulo,
                    idEstudiante,
                    motivo
            );

            return ResponseEntity
                    .created(URI.create("/api/v1/reintentos-modulo/" + sol.getId()))
                    .body(sol);

        } catch (IllegalStateException ex) {
            return ResponseEntity.status(409).body(Map.of(
                    "message", ex.getMessage()
            ));
        }
    }

    // ================== DTOs ==================

    @Schema(description = "Petición para cambiar el orden de un módulo")
    public static record CambiarOrdenRequest(
            @Schema(description = "Nuevo orden (>=1)", example = "2")
            @Min(1) Integer orden
    ) {}

    @Schema(description = "Petición para mover un módulo en el orden")
    public static record MoverRequest(
            @Schema(description = "Delta de movimiento (+/-1). Se ignora si se especifica 'direccion'.", example = "1")
            Integer delta,
            @Schema(description = "Dirección del movimiento: 'up'/'down' o 'arriba'/'abajo'", example = "down")
            String direccion
    ) {}

    @Schema(description = "Petición para reordenar módulos de un curso")
    public static record ReordenarRequest(
            @Schema(description = "Lista de IDs de módulos en el orden deseado")
            List<@NotBlank String> ids
    ) {}

    @Schema(description = "Motivo opcional para solicitar reintento de un módulo")
    public static record SolicitarReintentoRequest(
            @Schema(description = "Motivo de la solicitud", example = "Tuve problemas de conexión durante la evaluación del módulo.")
            String motivo
    ) {}
}
