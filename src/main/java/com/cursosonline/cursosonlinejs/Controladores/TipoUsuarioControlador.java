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
@RequestMapping("/api/tipousuario")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
@Tag(
        name = "Tipos de usuario",
        description = "Catálogo de tipos/roles de usuario de la plataforma."
)
@SecurityRequirement(name = "bearerAuth")
public class TipoUsuarioControlador {

    private final TipoUsuarioServicio svc;

    public TipoUsuarioControlador(TipoUsuarioServicio svc) {
        this.svc = svc;
    }

    @Operation(
            summary = "Listar tipos de usuario",
            description = "Devuelve una página de tipos de usuario, con filtro opcional por nombre."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Listado paginado de tipos de usuario",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = TipoUsuario.class)))
    )
    @GetMapping(produces = "application/json")
    @PermitAll
    public ResponseEntity<Page<TipoUsuario>> listar(
            @Parameter(description = "Texto de búsqueda por nombre", example = "admin")
            @RequestParam(value = "q", required = false) String q,
            @PageableDefault(size = 20, sort = "nombre") Pageable pageable
    ) {
        Page<TipoUsuario> page = (q == null || q.isBlank())
                ? svc.listar(pageable)
                : svc.buscarPorNombre(q.trim(), pageable);
        return ResponseEntity.ok(page);
    }

    @Operation(
            summary = "Obtener tipo de usuario por ID",
            description = "Devuelve un tipo de usuario concreto."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tipo de usuario encontrado",
                    content = @Content(schema = @Schema(implementation = TipoUsuario.class))),
            @ApiResponse(responseCode = "404", description = "Tipo de usuario no encontrado")
    })
    @GetMapping(value = "/{id}", produces = "application/json")
    @PermitAll
    public ResponseEntity<TipoUsuario> obtener(
            @Parameter(description = "ID del tipo de usuario") @PathVariable String id
    ) {
        return svc.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Operation(
            summary = "Crear tipo de usuario",
            description = "Crea un nuevo tipo de usuario. Solo ADMIN."
    )
    @PostMapping(consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> crear(
            @Valid @RequestBody TipoUsuario tipoUsuario
    ) {
        TipoUsuario creado = svc.guardar(tipoUsuario);
        return ResponseEntity.created(URI.create("/api/tipousuario/" + creado.getId()))
                .body(creado);
    }

    @Operation(
            summary = "Actualizar tipo de usuario",
            description = "Actualiza nombre, descripción y bandera 'default' de un tipo de usuario."
    )
    @PutMapping(value = "/{id}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> actualizar(
            @Parameter(description = "ID del tipo de usuario") @PathVariable String id,
            @Valid @RequestBody TipoUsuario tipoUsuario
    ) {
        return svc.actualizar(id, tipoUsuario.getNombre(), tipoUsuario.getDescripcion(), tipoUsuario.isDefault())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Operation(
            summary = "Eliminar tipo de usuario",
            description = "Elimina un tipo de usuario existente. Solo ADMIN."
    )
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(
            @Parameter(description = "ID del tipo de usuario") @PathVariable String id
    ) {
        boolean eliminado = svc.eliminar(id);
        return eliminado ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
