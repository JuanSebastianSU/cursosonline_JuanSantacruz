package com.cursosonline.cursosonlinejs.Entidades;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Document(collection = "pagos")
@Getter @Setter
@CompoundIndexes({
    @CompoundIndex(name = "inscripcion_estado_fecha_idx", def = "{'idInscripcion': 1, 'estado': 1, 'createdAt': -1}"),
    // Evita duplicados por reintentos (idempotencia). Sparse para permitir null:
    @CompoundIndex(name = "idempotency_key_unique", def = "{'idempotencyKey': 1}", unique = true, sparse = true)
})
public class Pago {

    @Id
    private String id;

    /** Relaciones */
    @Indexed
    private String idInscripcion;  // referencia a la inscripción
    @Indexed
    private String userId;         // quién pagó (opcional pero muy útil)

    /** Importes: usa Decimal128 en Mongo (precisión) */
    @NotNull
    @Positive
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal monto;      // total cobrado

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal subtotal;   // opcional: antes de impuestos/fees

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal impuestos;  // IVA/IGV, etc. (opcional)

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal comisiones; // fees de pasarela (opcional)

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal descuento;  // cupones/promos (opcional)

    /** Moneda ISO-4217 (USD, EUR, MXN, etc.) */
    @NotBlank
    @Pattern(regexp = "^[A-Z]{3}$", message = "Moneda debe ser código ISO-4217 en mayúsculas (p.ej., USD)")
    private String moneda;

    /** Método y estado */
    @NotNull
    private MetodoPago metodo;     // TARJETA, TRANSFERENCIA, PAYPAL, etc.

    @NotNull
    private EstadoPago estado;     // PENDIENTE, AUTORIZADO, APROBADO, FALLIDO, REEMBOLSADO, CANCELADO

    /** Trazabilidad / referencias */
    private String referencia;         // tu referencia interna / nro comprobante
    @Indexed(unique = true, sparse = true)
    private String idempotencyKey;     // para evitar pagos duplicados por reintento
    private String cupon;              // si aplicó algún cupón

    /** Campos de pasarela (usa solo los que necesites) */
    private String gateway;            // stripe, paypal, mercadopago...
    private String gatewayPaymentId;   // ID de pago en la pasarela
    private String authorizationCode;  // código de autorización (si aplica)
    private String reciboUrl;          // URL de recibo/boleta en la pasarela
    private MetodoDetalle metodoDetalle; // datos sensibles NO críticos (últimos 4, marca, banco...)

    /** Auditoría / tiempos */
    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    private Instant autorizadoAt;  // si hubo hold/authorization
    private Instant pagadoAt;      // cuando se capturó/aprobó
    private Instant fallidoAt;     // cuando falló
    private Instant reembolsadoAt; // cuando se reembolsó (si corresponde)

    @Version
    private Long version;          // optimistic locking para evitar pisadas

    /** Metadata libre para extensiones (clave/valor) */
    private Map<String, String> metadata;

    /* ====== Tipos auxiliares ====== */

    public enum MetodoPago {
        TARJETA, TRANSFERENCIA, PAYPAL, STRIPE, EFECTIVO, MERCADOPAGO
    }

    public enum EstadoPago {
        PENDIENTE, AUTORIZADO, APROBADO, CAPTURADO, FALLIDO, REEMBOLSADO, CANCELADO
    }

    @Getter @Setter
    public static class MetodoDetalle {
        private String cardBrand;    // VISA/MASTERCARD
        private String cardLast4;    // últimos 4
        private Integer installments; // cuotas, si corresponde
        private String bank;          // para transferencia
        private String accountType;   // CA/CC
    }
    
}
