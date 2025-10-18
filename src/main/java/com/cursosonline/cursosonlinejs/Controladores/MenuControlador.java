package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.Entidades.Menu;
import com.cursosonline.cursosonlinejs.Servicios.MenuServicio;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

/**
 * Controlador REST para el MENÚ (navbar).
 * Endpoints:
 *  - GET    /api/menu               -> lista
 *  - POST   /api/menu               -> crear
 *  - PUT    /api/menu/{id}          -> actualizar (nombre, url, orden)
 *  - PATCH  /api/menu/reordenar     -> reordenar varios [{id,orden},...]
 *  - DELETE /api/menu/{id}          -> eliminar
 *
 * Seguridad recomendada:
 *  - GET   público
 *  - POST/PUT/PATCH/DELETE con rol (admin)
 */
@RestController
@RequestMapping("/api/menu")
public class MenuControlador {

    private final MenuServicio service;

    public MenuControlador(MenuServicio service) {
        this.service = service;
    }

    /** Lista ordenada por 'orden' (si existe). */
    @GetMapping(produces = "application/json")
    public ResponseEntity<List<Menu>> listar() {
        return ResponseEntity.ok(service.listar());
    }

    /** Crea un item de menú. */
    @PostMapping(consumes = "application/json", produces = "application/json")
    public ResponseEntity<Menu> crear(@Valid @RequestBody Menu body) {
        Menu creado = service.crear(body);
        return ResponseEntity.created(URI.create("/api/menu/" + creado.getId())).body(creado);
    }

    /** Actualiza parcialmente un item (nombre/url/orden). */
    @PutMapping(path="/{id}", consumes="application/json", produces="application/json")
    public ResponseEntity<Menu> actualizar(@PathVariable String id, @RequestBody Menu body) {
        return ResponseEntity.ok(service.actualizar(id, body));
    }

    /** PATCH para reordenar varios a la vez: [{id, orden}, ...]. */
    @PatchMapping(path="/reordenar", consumes="application/json")
    public ResponseEntity<Void> reordenar(@RequestBody List<Menu> items) {
        if (items == null || items.isEmpty()) return ResponseEntity.noContent().build();
        // Reusamos actualizar(id, changes) solo seteando 'orden'
        items.forEach(it -> {
            Menu m = new Menu();
            m.setOrden(it.getOrden());
            service.actualizar(it.getId(), m);
        });
        return ResponseEntity.noContent().build();
    }

    /** Elimina por id. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
