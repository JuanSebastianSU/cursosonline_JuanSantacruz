package com.cursosonline.cursosonlinejs.Entidades;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

@Document(collection = "inscripciones")
@Getter
@Setter
@CompoundIndexes({
    @CompoundIndex(name = "estudiante_curso_fecha_idx", def = "{'idEstudiante': 1, 'idCurso': 1, 'createdAt': -1}"),
    @CompoundIndex(name = "curso_estado_fecha_idx", def = "{'idCurso': 1, 'estado': 1, 'createdAt': -1}"),
    @CompoundIndex(name = "access_end_idx", def = "{'accessEndAt': 1}")
})
public class Inscripcion {

    @Id
    private String id;

    @NotBlank
    @Indexed
    private String idCurso;

    @NotBlank
    @Indexed
    private String idEstudiante;

    @NotNull
    private EstadoInscripcion estado = EstadoInscripcion.ACTIVA;
    public enum EstadoInscripcion { PENDIENTE_PAGO, ACTIVA, SUSPENDIDA, COMPLETADA, CANCELADA, EXPIRADA }

    private Instant accessStartAt;
    private Instant accessEndAt;
    private Boolean accesoVitalicio;

    @PositiveOrZero
    private Integer progresoPct;
    private Set<String> leccionesCompletadas;
    private String moduloActualId;
    private String leccionActualId;
    private Instant lastAccessAt;

    @Indexed
    private String idPago;
    private List<String> pagoIds;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal precioLista;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal descuento;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal impuestos;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal totalPagado;

    @Pattern(regexp = "^[A-Z]{3}$", message = "Moneda debe ser ISO-4217 en mayúsculas (p.ej., USD)")
    private String moneda;

    private String cupon;
    private String origen;

    private String certificadoId;
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal notaFinal;
    private Boolean aprobadoFinal;

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;
    private Instant completadaAt;
    private Instant canceladaAt;

    @Indexed(unique = true, sparse = true)
    private String idempotencyKey;

    private Map<String, String> metadata;

    @Version
    private Long version;
}
