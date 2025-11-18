package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.Entidades.Curso;
import com.cursosonline.cursosonlinejs.Repositorios.CursoRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.UsuarioRepositorio;
import com.cursosonline.cursosonlinejs.Servicios.CursoServicio;
import com.cursosonline.cursosonlinejs.Servicios.JWTService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.parameters.P;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Map;

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
@RequestMapping("/api/v1/cursos")
@CrossOrigin(origins = { "http://localhost:3000" }, allowCredentials = "true")
@Tag(
        name = "Cursos",
        description = "Operaciones para gestionar cursos (creación, listado, actualización, publicación, archivo, eliminación y portadas)."
)
@SecurityRequirement(name = "bearerAuth")
public class CursoControlador {

    private final CursoServicio cursoServicio;
    private final CursoRepositorio cursoRepo;
    private final UsuarioRepositorio usuarioRepo;
    private final com.cursosonline.cursosonlinejs.Servicios.LocalStorageService storage;
    private final JWTService jwtService;

    public CursoControlador(CursoServicio cursoServicio,
                            CursoRepositorio cursoRepo,
                            UsuarioRepositorio usuarioRepo,
                            com.cursosonline.cursosonlinejs.Servicios.LocalStorageService storage,
                            JWTService jwtService) {
        this.cursoServicio = cursoServicio;
        this.cursoRepo = cursoRepo;
        this.usuarioRepo = usuarioRepo;
        this.storage = storage;
        this.jwtService = jwtService;
    }

    /* ====================== Helpers seguridad ====================== */

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

    /* ====================== Endpoints CRUD ====================== */

    @Operation(
            summary = "Crear un nuevo curso",
            description = """
                    Crea un curso a nombre del usuario autenticado. 
                    Si es el primer curso del usuario, se le promociona automáticamente al rol INSTRUCTOR.
                    Devuelve el curso creado y, si aplica, un JWT actualizado con el nuevo rol.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Curso creado correctamente",
                    content = @Content(schema = @Schema(implementation = CrearCursoResponse.class))),
            @ApiResponse(responseCode = "400", description = "Datos inválidos en la petición"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "500", description = "Error interno al crear el curso")
    })
    @PostMapping(consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> crearCurso(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Datos básicos del curso a crear",
                    required = true,
                    content = @Content(schema = @Schema(implementation = CrearCursoRequest.class))
            )
            @RequestBody @Valid CrearCursoRequest body
    ) {
        // 1) Crea el curso (el servicio ya promueve a Instructor si es su primer curso)
        var creado = cursoServicio.crearCursoDesdeDto(body);

        // 2) Genera un JWT fresco con el rol actualizado
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("message", "No autenticado"));
        }
        var usuario = usuarioRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalStateException("Usuario no encontrado"));

        String tokenNuevo;
        try {
            tokenNuevo = jwtService.generateToken(usuario);
        } catch (Exception ex) {
            // No romper la creación del curso si fallara el token por alguna razón
            tokenNuevo = null;
        }

        URI location = URI.create("/api/v1/cursos/" + creado.getId());
        return ResponseEntity.created(location)
                .body(new CrearCursoResponse(creado, tokenNuevo, usuario.getRol()));
    }

    @Operation(
            summary = "Listar cursos con filtros y paginación",
            description = """
                    Devuelve un listado paginado de cursos. 
                    - Si no se envía token, solo se listan cursos PUBLICADOS.
                    - Si se envía token de instructor, puede listar sus propios cursos con `mis=true`.
                    - Si se envía token de administrador, puede filtrar por cualquier estado.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado de cursos",
                    content = @Content(schema = @Schema(implementation = PageResponse.class))),
            @ApiResponse(responseCode = "500", description = "Error interno al listar cursos")
    })
    @GetMapping(produces = "application/json")
    public ResponseEntity<?> listarCursos(
            @Parameter(description = "Filtrar por categoría del curso (opcional)")
            @RequestParam(required = false) String categoria,

            @Parameter(description = "Filtrar por nivel del curso (ej: PRINCIPIANTE, INTERMEDIO, AVANZADO) (opcional)")
            @RequestParam(required = false) String nivel,

            @Parameter(description = "Filtrar por estado del curso (ADMIN únicamente) (opcional)")
            @RequestParam(required = false) String estado,

            @Parameter(description = "Texto de búsqueda en título/descripcion del curso (opcional)", name = "q")
            @RequestParam(required = false, name = "q") String query,

            @Parameter(description = "Número de página (0-index)", example = "0")
            @RequestParam(defaultValue = "0") @Min(0) int page,

            @Parameter(description = "Tamaño de página (número de elementos por página)", example = "10")
            @RequestParam(defaultValue = "10") @Min(1) int size,

            @Parameter(description = "Criterio de ordenamiento, por ejemplo: 'createdAt,desc' o 'titulo,asc'",
                    example = "createdAt,desc")
            @RequestParam(defaultValue = "createdAt,desc") String sort,

            @Parameter(description = "Si es true, devuelve solo cursos del instructor autenticado (requiere token)",
                    example = "false")
            @RequestParam(defaultValue = "false") boolean mis
    ) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean admin = isAdmin();

            String userId = null;
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
                userId = usuarioRepo.findByEmail(auth.getName().trim().toLowerCase())
                        .map(u -> u.getId())
                        .orElse(null);
            }

            String filtroInstructor = null;
            String filtroEstado = null;

            if (admin) {
                filtroEstado = estado;
            } else if (userId != null) {
                if (mis) {
                    filtroInstructor = userId;
                } else {
                    filtroEstado = "PUBLICADO";
                }
            } else {
                filtroEstado = "PUBLICADO";
            }

            var result = cursoServicio.buscarAvanzado(
                    null, filtroInstructor, categoria, query,
                    null, nivel, filtroEstado,
                    null, null, null, null, null,
                    page, size, sort
            );

            var resp = new PageResponse<>(
                    result.getContent(), page, size,
                    result.getTotalElements(), result.getTotalPages(), sort
            );

            return ResponseEntity.ok(resp);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "message", "Error interno al listar cursos",
                    "error", e.getMessage()
            ));
        }
    }

    @Operation(
            summary = "Obtener detalles de un curso por ID",
            description = """
                    Recupera la información completa de un curso por su ID. 
                    - Usuarios no autenticados solo pueden ver cursos PUBLICADOS y no ARCHIVADOS.
                    - Instructores dueños del curso y administradores pueden ver cualquier estado.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Curso encontrado",
                    content = @Content(schema = @Schema(implementation = Curso.class))),
            @ApiResponse(responseCode = "403", description = "Acceso restringido (curso archivado o no disponible para el usuario)"),
            @ApiResponse(responseCode = "404", description = "Curso no encontrado")
    })
    @GetMapping(value = "/{id}", produces = "application/json")
    public ResponseEntity<?> obtenerCurso(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String id
    ) {
        var opt = cursoServicio.obtenerPorId(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        var curso = opt.get();
        boolean admin = isAdmin();
        boolean instructor = esInstructorDelCurso(curso.getId());

        if (!admin && !instructor) {
            if (curso.getEstado() == Curso.EstadoCurso.ARCHIVADO) {
                return ResponseEntity.status(403).body("Contenido archivado.");
            }
            if (curso.getEstado() != Curso.EstadoCurso.PUBLICADO) {
                return ResponseEntity.status(404).body("Curso no disponible.");
            }
        }
        return ResponseEntity.ok(curso);
    }

    @Operation(
            summary = "Actualizar un curso",
            description = """
                    Actualiza los datos de un curso existente. 
                    Solo puede ser editado por su autor o por un administrador.
                    Si el curso está PUBLICADO, primero debe archivarse (excepto administrador).
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Curso actualizado correctamente",
                    content = @Content(schema = @Schema(implementation = Curso.class))),
            @ApiResponse(responseCode = "403", description = "No se puede editar el curso en el estado actual"),
            @ApiResponse(responseCode = "404", description = "Curso no encontrado")
    })
    @PreAuthorize("@cursoPermisos.cursoEditablePorAutor(#id) or hasRole('ADMIN')")
    @PutMapping(value = "/{id}", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> actualizarCurso(
            @Parameter(description = "ID del curso a actualizar", example = "c_123456")
            @PathVariable("id") @P("id") String id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Datos a actualizar del curso",
                    required = true,
                    content = @Content(schema = @Schema(implementation = ActualizarCursoRequest.class))
            )
            @RequestBody @Valid ActualizarCursoRequest body
    ) {
        var cursoOpt = cursoRepo.findById(id);
        if (cursoOpt.isEmpty()) return ResponseEntity.notFound().build();

        var curso = cursoOpt.get();

        if (curso.getEstado() == Curso.EstadoCurso.PUBLICADO && !isAdmin()) {
            return ResponseEntity.status(403).body(Map.of(
                    "message", "No se puede editar un curso publicado. Archívalo antes de modificarlo."
            ));
        }

        return cursoServicio.actualizarDesdeDto(id, body)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Operation(
            summary = "Cambiar el estado de un curso",
            description = "Actualiza el estado de un curso (ej. BORRADOR, PUBLICADO, ARCHIVADO) según la lógica de negocio."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estado actualizado correctamente",
                    content = @Content(schema = @Schema(implementation = Curso.class))),
            @ApiResponse(responseCode = "404", description = "Curso no encontrado")
    })
    @PreAuthorize("@cursoPermisos.cursoEditablePorAutor(#id) or hasRole('ADMIN')")
    @PatchMapping(value = "/{id}/estado", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> cambiarEstado(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable("id") @P("id") String id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Nuevo estado del curso",
                    required = true,
                    content = @Content(schema = @Schema(implementation = EstadoRequest.class))
            )
            @RequestBody @Valid EstadoRequest body
    ) {
        var actualizado = cursoServicio.cambiarEstado(id, body.estado());
        return actualizado.<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Operation(
            summary = "Publicar un curso",
            description = "Marca el curso como PUBLICADO. Solo el dueño del curso o un administrador pueden realizar esta acción."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Curso publicado correctamente",
                    content = @Content(schema = @Schema(implementation = Curso.class))),
            @ApiResponse(responseCode = "404", description = "Curso no encontrado")
    })
    @PreAuthorize("@cursoPermisos.esDueno(#id) or hasRole('ADMIN')")
    @PatchMapping(value = "/{id}/publicar", produces = "application/json")
    public ResponseEntity<?> publicar(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable("id") @P("id") String id
    ) {
        return cursoServicio.publicar(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Operation(
            summary = "Archivar un curso",
            description = "Marca el curso como ARCHIVADO. Solo el dueño o un administrador pueden archivarlo."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Curso archivado correctamente",
                    content = @Content(schema = @Schema(implementation = Curso.class))),
            @ApiResponse(responseCode = "404", description = "Curso no encontrado")
    })
    @PreAuthorize("@cursoPermisos.esDueno(#id) or hasRole('ADMIN')")
    @PatchMapping(value = "/{id}/archivar", produces = "application/json")
    public ResponseEntity<?> archivar(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable("id") @P("id") String id
    ) {
        return cursoServicio.archivar(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Operation(
            summary = "Eliminar un curso",
            description = "Elimina un curso de forma permanente. Solo el dueño o un administrador pueden hacerlo."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Curso eliminado correctamente"),
            @ApiResponse(responseCode = "404", description = "Curso no encontrado")
    })
    @PreAuthorize("@cursoPermisos.esDueno(#id) or hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarCurso(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable("id") @P("id") String id
    ) {
        return cursoServicio.eliminarPorId(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    /* ====================== Portada: archivo y por URL ====================== */

    @Operation(
            summary = "Subir portada de curso (archivo)",
            description = """
                    Sube una imagen de portada para el curso indicado. 
                    Solo el dueño del curso o un administrador pueden modificar la portada.
                    No se permite modificar la portada de un curso PUBLICADO (salvo administrador).
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Portada actualizada correctamente",
                    content = @Content(schema = @Schema(
                            description = "URL pública de la imagen de portada",
                            example = "{\"imagenPortadaUrl\": \"https://cdn.misitio.com/cursos/curso123.png\"}"
                    ))),
            @ApiResponse(responseCode = "400", description = "Archivo vacío o tipo no permitido"),
            @ApiResponse(responseCode = "403", description = "No se puede modificar la imagen del curso en el estado actual"),
            @ApiResponse(responseCode = "404", description = "Curso no encontrado")
    })
    @PreAuthorize("@cursoPermisos.esDueno(#id) or hasRole('ADMIN')")
    @PostMapping(value = "/{id}/portada", consumes = "multipart/form-data", produces = "application/json")
    public ResponseEntity<?> subirPortada(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String id,
            @Parameter(
                    description = "Archivo de imagen (jpeg, png, etc.)",
                    required = true,
                    content = @Content(mediaType = "multipart/form-data",
                            schema = @Schema(type = "string", format = "binary"))
            )
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        var curso = cursoRepo.findById(id).orElse(null);
        if (curso == null) return ResponseEntity.notFound().build();

        if (curso.getEstado() == Curso.EstadoCurso.PUBLICADO && !isAdmin()) {
            return ResponseEntity.status(403).body(Map.of(
                    "message", "No se puede modificar la imagen de un curso publicado."
            ));
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Archivo vacío"));
        }
        if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tipo no permitido, debe ser imagen"));
        }

        String safeName = id.replaceAll("[^a-zA-Z0-9_-]", "");
        String publicUrl = storage.save(file, "cursos", safeName);

        curso.setImagenPortadaUrl(publicUrl);
        cursoRepo.save(curso);

        return ResponseEntity.ok(Map.of("imagenPortadaUrl", publicUrl));
    }

    @Operation(
            summary = "Asignar portada de curso desde URL",
            description = """
                    Asigna una imagen de portada a partir de una URL pública. 
                    Solo el dueño del curso o un administrador pueden modificar la portada.
                    No se permite modificar la portada de un curso PUBLICADO (salvo administrador).
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Portada actualizada correctamente",
                    content = @Content(schema = @Schema(
                            description = "URL pública de la imagen de portada",
                            example = "{\"imagenPortadaUrl\": \"https://cdn.misitio.com/cursos/curso123.png\"}"
                    ))),
            @ApiResponse(responseCode = "400", description = "URL inválida"),
            @ApiResponse(responseCode = "403", description = "No se puede modificar la imagen del curso en el estado actual"),
            @ApiResponse(responseCode = "404", description = "Curso no encontrado")
    })
    @PreAuthorize("@cursoPermisos.esDueno(#id) or hasRole('ADMIN')")
    @PostMapping(value = "/{id}/portada/url", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> asignarPortadaDesdeUrl(
            @Parameter(description = "ID del curso", example = "c_123456")
            @PathVariable String id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Objeto con la URL de la portada. Debe comenzar con http:// o https://",
                    required = true,
                    content = @Content(schema = @Schema(
                            example = "{\"url\": \"https://cdn.misitio.com/cursos/curso123.png\"}"
                    ))
            )
            @RequestBody Map<String, String> body
    ) {
        var curso = cursoRepo.findById(id).orElse(null);
        if (curso == null) return ResponseEntity.notFound().build();

        if (curso.getEstado() == Curso.EstadoCurso.PUBLICADO && !isAdmin()) {
            return ResponseEntity.status(403).body(Map.of(
                    "message", "No se puede modificar la imagen de un curso publicado."
            ));
        }

        String url = body.get("url");
        if (url == null || !url.matches("^https?://.+")) {
            return ResponseEntity.badRequest().body(Map.of("message", "URL inválida"));
        }

        curso.setImagenPortadaUrl(url);
        cursoRepo.save(curso);

        return ResponseEntity.ok(Map.of("imagenPortadaUrl", url));
    }

    /* ====================== DTOs y Page wrapper ====================== */

    @Schema(description = "Datos necesarios para crear un curso")
    public static record CrearCursoRequest(
            @Schema(description = "Título del curso", example = "Curso de Java desde cero")
            @NotBlank String titulo,

            @Schema(description = "Descripción detallada del curso", example = "Aprende Java paso a paso con proyectos prácticos")
            String descripcion,

            @Schema(description = "Categoría del curso", example = "PROGRAMACION")
            @NotBlank String categoria,

            @Schema(description = "Nivel del curso (ej: PRINCIPIANTE, INTERMEDIO, AVANZADO)", example = "PRINCIPIANTE")
            @NotBlank String nivel,

            @Schema(description = "Idioma principal del curso", example = "ES")
            @NotBlank String idioma,

            @Schema(description = "Precio del curso en dólares (0 para curso gratuito)", example = "49.99")
            @Min(0) double precio,

            @Schema(description = "URL inicial de la imagen de portada (opcional)", example = "https://cdn.misitio.com/cursos/java.png")
            String imagenPortadaUrl
    ) {}

    @Schema(description = "Respuesta al crear un curso. Incluye el curso, un token opcional actualizado y el rol actual del usuario.")
    public static record CrearCursoResponse(
            @Schema(description = "Curso creado")
            Curso curso,

            @Schema(description = "Nuevo token JWT con rol actualizado (puede ser null si hubo error al generarlo)")
            String token,

            @Schema(description = "Rol actual del usuario después de crear el curso", example = "INSTRUCTOR")
            String rol
    ) {}

    @Schema(description = "Datos para actualizar un curso ya existente")
    public static record ActualizarCursoRequest(
            @Schema(description = "Título del curso", example = "Curso de Java desde cero (actualizado)")
            @NotBlank String titulo,

            @Schema(description = "Descripción del curso", example = "Descripción actualizada del curso de Java")
            String descripcion,

            @Schema(description = "Categoría del curso", example = "PROGRAMACION")
            @NotBlank String categoria,

            @Schema(description = "Nivel del curso", example = "INTERMEDIO")
            @NotBlank String nivel,

            @Schema(description = "Idioma principal del curso", example = "ES")
            @NotBlank String idioma,

            @Schema(description = "Precio del curso en dólares", example = "59.99")
            @Min(0) double precio,

            @Schema(description = "URL de la imagen de portada", example = "https://cdn.misitio.com/cursos/java2.png")
            String imagenPortadaUrl
    ) {}

    @Schema(description = "Petición para cambiar el estado de un curso")
    public static record EstadoRequest(
            @Schema(description = "Nuevo estado del curso (ej: BORRADOR, PUBLICADO, ARCHIVADO)", example = "PUBLICADO")
            @NotBlank String estado
    ) {}

    @Schema(description = "Respuesta de página genérica con metadatos de paginación")
    public static class PageResponse<T> {

        @ArraySchema(arraySchema = @Schema(description = "Listado de elementos de la página actual"))
        public List<T> content;

        @Schema(description = "Número de página (0-index)", example = "0")
        public int page;

        @Schema(description = "Tamaño de página (número de elementos)", example = "10")
        public int size;

        @Schema(description = "Total de elementos en la consulta", example = "125")
        public long totalElements;

        @Schema(description = "Total de páginas", example = "13")
        public int totalPages;

        @Schema(description = "Criterio de ordenamiento aplicado", example = "createdAt,desc")
        public String sort;

        public PageResponse(List<T> content, int page, int size, long totalElements, int totalPages, String sort) {
            this.content = content;
            this.page = page;
            this.size = size;
            this.totalElements = totalElements;
            this.totalPages = totalPages;
            this.sort = sort;
        }
    }
}
