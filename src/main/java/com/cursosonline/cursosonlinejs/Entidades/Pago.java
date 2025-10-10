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
@Getter
@Setter
@CompoundIndexes({
    @CompoundIndex(name = "inscripcion_estado_fecha_idx", def = "{'idInscripcion': 1, 'estado': 1, 'createdAt': -1}"),
    @CompoundIndex(name = "idempotency_key_unique", def = "{'idempotencyKey': 1}", unique = true, sparse = true)
})
public class Pago {

    @Id
    private String id;

    @Indexed
    private String idInscripcion;
    @Indexed
    private String userId;

    @NotNull
    @Positive
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal monto;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal subtotal;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal impuestos;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal comisiones;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal descuento;

    @NotBlank
    @Pattern(regexp = "^[A-Z]{3}$", message = "Moneda debe ser código ISO-4217 en mayúsculas (p.ej., USD)")
    private String moneda;

    @NotNull
    private MetodoPago metodo;

    @NotNull
    private EstadoPago estado;

    private String referencia;
    @Indexed(unique = true, sparse = true)
    private String idempotencyKey;
    private String cupon;

    private String gateway;
    private String gatewayPaymentId;
    private String authorizationCode;
    private String reciboUrl;
    private MetodoDetalle metodoDetalle;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    private Instant autorizadoAt;
    private Instant pagadoAt;
    private Instant fallidoAt;
    private Instant reembolsadoAt;

    @Version
    private Long version;

    private Map<String, String> metadata;

    public enum MetodoPago {
        TARJETA, TRANSFERENCIA, PAYPAL, STRIPE, EFECTIVO, MERCADOPAGO
    }

    public enum EstadoPago {
        PENDIENTE, AUTORIZADO, APROBADO, CAPTURADO, FALLIDO, REEMBOLSADO, CANCELADO
    }

    @Getter
    @Setter
    public static class MetodoDetalle {
        private String cardBrand;
        private String cardLast4;
        private Integer installments;
        private String bank;
        private String accountType;
    }
}
