package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.Entidades.Usuario;
import com.cursosonline.cursosonlinejs.Servicios.UsuarioServicio;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(
        origins = {
                "http://localhost:9090",
                "https://cursosonline-juan-santacruz.vercel.app"
        },
        allowCredentials = "true"
)
public class UsuarioControlador {

    private final UsuarioServicio usuarioServicio;

    public UsuarioControlador(UsuarioServicio usuarioServicio) {
        this.usuarioServicio = usuarioServicio;
    }

    @GetMapping(produces = "application/json")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Usuario>> listarTodos() {
        return ResponseEntity.ok(usuarioServicio.listarTodos());
    }

   @GetMapping(value = "/{id}", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @seguridadUtil.esMismoUsuario(#id)")
    public ResponseEntity<Usuario> obtenerPorId(@PathVariable String id) {
        return usuarioServicio.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }


    @PutMapping(value = "/{id}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> actualizar(@PathVariable String id, @RequestBody Usuario cambios) {
        return usuarioServicio.actualizar(id, cambios)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/foto")
@PreAuthorize("hasRole('ADMIN') or @seguridadUtil.esMismoUsuario(#id)")
public ResponseEntity<String> subirFoto(
        @PathVariable String id,
        @RequestParam("file") MultipartFile file) {
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


    @PatchMapping(value = "/{id}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> patch(@PathVariable String id, @RequestBody Usuario cambios) {
        return usuarioServicio.patch(id, cambios)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cambiarEstado(@PathVariable String id, @RequestBody EstadoRequest body) {
        return usuarioServicio.cambiarEstado(id, body.estado())
                ? ResponseEntity.ok(Map.of("message", "Estado actualizado correctamente."))
                : ResponseEntity.notFound().build();
    }

    @PatchMapping("/{id}/password")
    @PreAuthorize("hasRole('ADMIN') or @seguridadUtil.esMismoUsuario(#id)")
    public ResponseEntity<?> cambiarPassword(@PathVariable String id, @RequestBody PasswordRequest body) {
        boolean ok = usuarioServicio.actualizarPassword(id, body.password());
        return ok ? ResponseEntity.ok(Map.of("message", "Contraseña actualizada correctamente."))
                  : ResponseEntity.notFound().build();
    }

    public static record EstadoRequest(@NotBlank String estado) {}
    public static record PasswordRequest(@NotBlank String password) {}

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        boolean ok = usuarioServicio.eliminar(id);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
