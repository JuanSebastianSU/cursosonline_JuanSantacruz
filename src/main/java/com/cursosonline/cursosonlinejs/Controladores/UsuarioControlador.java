package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.Entidades.Usuario;
import com.cursosonline.cursosonlinejs.Servicios.UsuarioServicio;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

// Swagger / OpenAPI
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
@Tag(
        name = "Usuarios",
        description = "Gestión de usuarios de la plataforma."
)
@SecurityRequirement(name = "bearerAuth")
public class UsuarioControlador {

    private final UsuarioServicio usuarioServicio;

    public UsuarioControlador(UsuarioServicio usuarioServicio) {
        this.usuarioServicio = usuarioServicio;
    }

    @Operation(
            summary = "Listar todos los usuarios",
            description = "Devuelve el listado completo de usuarios. Solo ADMIN."
    )
    @GetMapping(produces = "application/json")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Usuario>> listarTodos() {
        return ResponseEntity.ok(usuarioServicio.listarTodos());
    }

    @Operation(
            summary = "Obtener usuario por ID",
            description = "Devuelve los datos de un usuario. ADMIN puede ver cualquiera, un usuario solo puede ver su propio perfil."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Usuario encontrado",
                    content = @Content(schema = @Schema(implementation = Usuario.class))),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @GetMapping(value = "/{id}", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @seguridadUtil.esMismoUsuario(#id)")
    public ResponseEntity<Usuario> obtenerPorId(
            @Parameter(description = "ID del usuario") @PathVariable String id
    ) {
        return usuarioServicio.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(
            summary = "Actualizar usuario (ADMIN)",
            description = "Actualiza los datos de un usuario. Solo ADMIN."
    )
    @PutMapping(value = "/{id}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> actualizar(
            @Parameter(description = "ID del usuario") @PathVariable String id,
            @RequestBody Usuario cambios
    ) {
        return usuarioServicio.actualizar(id, cambios)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(
            summary = "Subir foto de perfil",
            description = "Sube una foto de perfil para el usuario indicado. ADMIN o el mismo usuario."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Foto subida correctamente",
                    content = @Content(schema = @Schema(implementation = String.class))),
            @ApiResponse(responseCode = "400", description = "Archivo vacío o inválido"),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado"),
            @ApiResponse(responseCode = "500", description = "Error al subir la foto")
    })
    @PostMapping("/{id}/foto")
    @PreAuthorize("hasRole('ADMIN') or @seguridadUtil.esMismoUsuario(#id)")
    public ResponseEntity<String> subirFoto(
            @Parameter(description = "ID del usuario") @PathVariable String id,
            @Parameter(description = "Archivo de imagen", required = true)
            @RequestParam("file") MultipartFile file
    ) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("El archivo está vacío");
            }

            // Crear carpeta si no existe
            String uploadDir = "uploads/fotos/";
            java.io.File directorio = new java.io.File(uploadDir);
            if (!directorio.exists()) {
                directorio.mkdirs();
            }

            // Nombre único
            String fileName = id + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
            java.nio.file.Path filePath = java.nio.file.Paths.get(uploadDir, fileName);
            java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            // URL accesible públicamente
            String fotoUrl = "/uploads/fotos/" + fileName;

            // Actualizar en BD mediante el servicio
            boolean actualizado = usuarioServicio.actualizarFotoUrl(id, fotoUrl);
            if (!actualizado) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(fotoUrl);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error al subir la foto");
        }
    }

    @Operation(
            summary = "Patch de usuario (ADMIN)",
            description = "Actualización parcial de un usuario. Solo ADMIN."
    )
    @PatchMapping(value = "/{id}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> patch(
            @Parameter(description = "ID del usuario") @PathVariable String id,
            @RequestBody Usuario cambios
    ) {
        return usuarioServicio.patch(id, cambios)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(
            summary = "Cambiar estado del usuario",
            description = "Permite activar/desactivar u otros estados definidos. Solo ADMIN."
    )
    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cambiarEstado(
            @Parameter(description = "ID del usuario") @PathVariable String id,
            @RequestBody EstadoRequest body
    ) {
        return usuarioServicio.cambiarEstado(id, body.estado())
                ? ResponseEntity.ok(Map.of("message", "Estado actualizado correctamente."))
                : ResponseEntity.notFound().build();
    }

    @Operation(
            summary = "Cambiar contraseña",
            description = "Permite cambiar la contraseña del usuario. Puede hacerlo el ADMIN o el mismo usuario."
    )
    @PatchMapping("/{id}/password")
    @PreAuthorize("hasRole('ADMIN') or @seguridadUtil.esMismoUsuario(#id)")
    public ResponseEntity<?> cambiarPassword(
            @Parameter(description = "ID del usuario") @PathVariable String id,
            @RequestBody PasswordRequest body
    ) {
        boolean ok = usuarioServicio.actualizarPassword(id, body.password());
        return ok ? ResponseEntity.ok(Map.of("message", "Contraseña actualizada correctamente."))
                  : ResponseEntity.notFound().build();
    }

    public static record EstadoRequest(@NotBlank String estado) {}
    public static record PasswordRequest(@NotBlank String password) {}

    @Operation(
            summary = "Eliminar usuario",
            description = "Elimina un usuario del sistema. Solo ADMIN."
    )
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(
            @Parameter(description = "ID del usuario") @PathVariable String id
    ) {
        boolean ok = usuarioServicio.eliminar(id);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
