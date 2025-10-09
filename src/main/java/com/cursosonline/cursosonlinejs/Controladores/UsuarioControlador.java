// src/main/java/com/cursosonline/cursosonlinejs/Controladores/UsuarioControlador.java
package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.Entidades.Usuario;
import com.cursosonline.cursosonlinejs.Servicios.UsuarioServicio;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
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
    @PreAuthorize("hasRole('ADMIN')")
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

    @PatchMapping(value = "/{id}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> patch(@PathVariable String id, @RequestBody Usuario cambios) {
        return usuarioServicio.patch(id, cambios)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ---- PATCHs específicos ----

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cambiarEstado(@PathVariable String id, @RequestBody EstadoRequest body) {
        return usuarioServicio.cambiarEstado(id, body.estado())
                ? ResponseEntity.ok(Map.of("message", "Estado actualizado correctamente."))
                : ResponseEntity.notFound().build();
    }

    // Nota: `principal` por defecto es UserDetails (username = email), no tiene `id`.
    // Usamos un bean helper para permitir que el propio usuario cambie su contraseña.
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
