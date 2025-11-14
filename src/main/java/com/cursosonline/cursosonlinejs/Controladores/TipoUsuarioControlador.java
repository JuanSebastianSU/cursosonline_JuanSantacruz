package com.cursosonline.cursosonlinejs.Controladores;

import java.net.URI;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.cursosonline.cursosonlinejs.Entidades.TipoUsuario;
import com.cursosonline.cursosonlinejs.Servicios.TipoUsuarioServicio;

import jakarta.annotation.security.PermitAll;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tipousuario")

public class TipoUsuarioControlador {

    private final TipoUsuarioServicio svc;

    public TipoUsuarioControlador(TipoUsuarioServicio svc) {
        this.svc = svc;
    }

    @GetMapping(produces = "application/json")
    @PermitAll
    public ResponseEntity<Page<TipoUsuario>> listar(
            @RequestParam(value = "q", required = false) String q,
            @PageableDefault(size = 20, sort = "nombre") Pageable pageable) {
        Page<TipoUsuario> page = (q == null || q.isBlank())
                ? svc.listar(pageable)
                : svc.buscarPorNombre(q.trim(), pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping(value = "/{id}", produces = "application/json")
    @PermitAll
    public ResponseEntity<TipoUsuario> obtener(@PathVariable String id) {
        return svc.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping(consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> crear(@Valid @RequestBody TipoUsuario tipoUsuario) {
        TipoUsuario creado = svc.guardar(tipoUsuario);
        return ResponseEntity.created(URI.create("/api/tipousuario/" + creado.getId()))
                .body(creado);
    }

    @PutMapping(value = "/{id}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> actualizar(@PathVariable String id, @Valid @RequestBody TipoUsuario tipoUsuario) {
        return svc.actualizar(id, tipoUsuario.getNombre(), tipoUsuario.getDescripcion(), tipoUsuario.isDefault())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        boolean eliminado = svc.eliminar(id);
        return eliminado ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
