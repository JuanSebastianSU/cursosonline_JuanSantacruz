package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.Entidades.Pago;
import com.cursosonline.cursosonlinejs.Repositorios.UsuarioRepositorio;
import com.cursosonline.cursosonlinejs.Servicios.CursoServicio;
import com.cursosonline.cursosonlinejs.Servicios.InscripcionServicio;
import com.cursosonline.cursosonlinejs.Servicios.PagoServicio;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;
import java.util.Map;

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
@RequestMapping("/api/v1/inscripciones/{idInscripcion}/pagos")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
@Tag(
        name = "Pagos",
        description = "Gestión de pagos asociados a una inscripción de curso."
)
@SecurityRequirement(name = "bearerAuth")
public class PagoControlador {

    private final PagoServicio pagoServicio;
    private final UsuarioRepositorio usuarioRepo;
    private final InscripcionServicio inscripcionServicio;
    private final CursoServicio cursoServicio;

    public PagoControlador(PagoServicio pagoServicio,
                           UsuarioRepositorio usuarioRepo,
                           InscripcionServicio inscripcionServicio,
                           CursoServicio cursoServicio) {
        this.pagoServicio = pagoServicio;
        this.usuarioRepo = usuarioRepo;
        this.inscripcionServicio = inscripcionServicio;
        this.cursoServicio = cursoServicio;
    }

    private String currentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return null;
        return usuarioRepo.findByEmail(auth.getName()).map(u -> u.getId()).orElse(null);
    }

    @Operation(
            summary = "Listar pagos de una inscripción",
            description = "Devuelve todos los pagos (borradores, pendientes, aprobados, etc.) de una inscripción concreta."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado de pagos",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = Pago.class)))),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "No autorizado para ver esta inscripción")
    })
    @GetMapping(produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @pagoPermisos.esInstructorDeInscripcion(#idInscripcion) or @pagoPermisos.esDuenoDeInscripcion(#idInscripcion)")
    public ResponseEntity<List<Pago>> listarPagos(
            @Parameter(description = "ID de la inscripción", example = "insc_123456")
            @PathVariable String idInscripcion
    ) {
        return ResponseEntity.ok(pagoServicio.listarPorInscripcion(idInscripcion));
    }

    @Operation(
            summary = "Obtener un pago concreto",
            description = "Devuelve el detalle de un pago perteneciente a una inscripción concreta."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Pago encontrado",
                    content = @Content(schema = @Schema(implementation = Pago.class))),
            @ApiResponse(responseCode = "404", description = "No existe el pago o no pertenece a la inscripción")
    })
    @GetMapping(value = "/{id}", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN') or @pagoPermisos.esInstructorDeInscripcion(#idInscripcion) or @pagoPermisos.esDuenoDeInscripcion(#idInscripcion)")
    public ResponseEntity<?> obtenerPago(
            @Parameter(description = "ID de la inscripción") @PathVariable String idInscripcion,
            @Parameter(description = "ID del pago") @PathVariable String id
    ) {
        Pago pago = pagoServicio.listaPago(id);
        if (pago == null) return ResponseEntity.notFound().build();
        if (!idInscripcion.equals(pago.getIdInscripcion())) {
            return ResponseEntity.status(404).body(Map.of("message", "El pago no pertenece a la inscripción especificada."));
        }
        return ResponseEntity.ok(pago);
    }

    @Operation(
            summary = "Crear borrador de pago",
            description = """
                    Crea un pago en estado borrador para la inscripción indicada.
                    Solo puede hacerlo el dueño de la inscripción.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Borrador de pago creado",
                    content = @Content(schema = @Schema(implementation = Pago.class))),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    @PostMapping(path = "/borrador", consumes = "application/json", produces = "application/json")
    @PreAuthorize("@pagoPermisos.esDuenoDeInscripcion(#idInscripcion)")
    public ResponseEntity<?> crearBorrador(
            @Parameter(description = "ID de la inscripción") @PathVariable String idInscripcion,
            @Valid @RequestBody CrearBorradorRequest body
    ) {
        if (body.monto() == null || body.monto().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "El monto debe ser mayor a 0."));
        }
        if (body.moneda() == null || body.moneda().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "La moneda es obligatoria."));
        }
        if (body.metodo() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "El método de pago es obligatorio."));
        }

        String uid = currentUserId();
        if (uid == null) return ResponseEntity.status(401).body(Map.of("message", "No autenticado."));

        Pago creado = pagoServicio.crearBorrador(
                idInscripcion, uid,
                body.monto(), body.moneda(), body.metodo(),
                body.referencia(), body.cupon(), body.gateway(), body.idempotencyKey()
        );
        URI location = URI.create("/api/v1/inscripciones/" + idInscripcion + "/pagos/" + creado.getId());
        return ResponseEntity.created(location).body(creado);
    }

    @Operation(
            summary = "Confirmar/checkout de un pago",
            description = "Confirma un pago borrador por parte del usuario dueño del pago."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Pago confirmado",
                    content = @Content(schema = @Schema(implementation = Pago.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Pago no encontrado")
    })
    @PostMapping(path = "/{id}/checkout", produces = "application/json")
    @PreAuthorize("@pagoPermisos.esDuenoDePago(#id)")
    public ResponseEntity<?> aceptar(
            @Parameter(description = "ID de la inscripción") @PathVariable String idInscripcion,
            @Parameter(description = "ID del pago") @PathVariable String id
    ) {
        String uid = currentUserId();
        if (uid == null) return ResponseEntity.status(401).body(Map.of("message", "No autenticado."));
        var ok = pagoServicio.aceptarPorUsuario(id, uid).orElse(null);
        if (ok == null) return ResponseEntity.notFound().build();
        if (!idInscripcion.equals(ok.getIdInscripcion())) {
            return ResponseEntity.status(404).body(Map.of("message", "El pago no pertenece a la inscripción especificada."));
        }
        return ResponseEntity.ok(ok);
    }

    @Operation(
            summary = "Editar borrador de pago",
            description = "Permite modificar los datos de un pago en estado borrador."
    )
    @PatchMapping(path = "/{id}", consumes = "application/json", produces = "application/json")
    @PreAuthorize("@pagoPermisos.esDuenoDePago(#id)")
    public ResponseEntity<?> editarBorrador(
            @Parameter(description = "ID de la inscripción") @PathVariable String idInscripcion,
            @Parameter(description = "ID del pago") @PathVariable String id,
            @RequestBody EditarBorradorRequest body
    ) {
        var editado = pagoServicio.actualizarBorrador(
                id,
                body.monto(), body.moneda(), body.metodo(),
                body.referencia(), body.cupon(), body.gateway()
        ).orElse(null);

        if (editado == null) return ResponseEntity.notFound().build();
        if (!idInscripcion.equals(editado.getIdInscripcion())) {
            return ResponseEntity.status(404).body(Map.of("message", "El pago no pertenece a la inscripción especificada."));
        }
        return ResponseEntity.ok(editado);
    }

    @Operation(
            summary = "Eliminar borrador de pago",
            description = "Elimina un pago mientras siga en estado pendiente/borrador."
    )
    @DeleteMapping("/{id}")
    @PreAuthorize("@pagoPermisos.esDuenoDePago(#id)")
    public ResponseEntity<?> eliminarBorrador(
            @Parameter(description = "ID de la inscripción") @PathVariable String idInscripcion,
            @Parameter(description = "ID del pago") @PathVariable String id
    ) {
        String uid = currentUserId();
        if (uid == null) return ResponseEntity.status(401).body(Map.of("message", "No autenticado."));
        try {
            boolean ok = pagoServicio.eliminarSiPendiente(id, idInscripcion, uid);
            return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(409).body(Map.of("message", ex.getMessage()));
        }
    }

    @Operation(
            summary = "Aprobar un pago (ADMIN/INSTRUCTOR)",
            description = """
                    Marca un pago como aprobado desde el backend (ej. conciliación manual, confirmación de gateway).
                    Si la inscripción estaba pendiente de pago, se activa y se incrementa el contador de inscritos en el curso.
                    """
    )
    @PostMapping("/{id}/aprobar")
    @PreAuthorize("hasRole('ADMIN') or @pagoPermisos.esInstructorDeInscripcion(#idInscripcion)")
    public ResponseEntity<?> aprobarPago(
            @Parameter(description = "ID de la inscripción") @PathVariable String idInscripcion,
            @Parameter(description = "ID del pago") @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        String gatewayPaymentId = body != null ? (String) body.get("gatewayPaymentId") : null;
        String authorizationCode = body != null ? (String) body.get("authorizationCode") : null;
        String reciboUrl = body != null ? (String) body.get("reciboUrl") : null;

        var pago = pagoServicio.marcarAprobado(id, gatewayPaymentId, authorizationCode, reciboUrl, true)
                .orElse(null);
        if (pago == null) return ResponseEntity.notFound().build();

        String idCurso = inscripcionServicio.activarSiPendientePago(idInscripcion);
        if (idCurso != null) {
            cursoServicio.incInscritosCount(idCurso, +1);
        }

        return ResponseEntity.ok(pago);
    }

    public static record CrearBorradorRequest(
            @NotNull @Min(0) BigDecimal monto,
            @NotBlank String moneda,
            @NotNull Pago.MetodoPago metodo,
            String referencia,
            String cupon,
            String gateway,
            String idempotencyKey
    ) {}

    public static record EditarBorradorRequest(
            BigDecimal monto,
            String moneda,
            Pago.MetodoPago metodo,
            String referencia,
            String cupon,
            String gateway
    ) {}
}
