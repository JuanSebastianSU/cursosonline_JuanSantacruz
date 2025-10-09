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
@Getter @Setter
@CompoundIndexes({
    // Consultas típicas (por curso/estudiante y por estado/fecha)
    @CompoundIndex(name = "estudiante_curso_fecha_idx", def = "{'idEstudiante': 1, 'idCurso': 1, 'createdAt': -1}"),
    @CompoundIndex(name = "curso_estado_fecha_idx", def = "{'idCurso': 1, 'estado': 1, 'createdAt': -1}"),
    // Para expirar accesos (cron que busca inscripciones que vencen)
    @CompoundIndex(name = "access_end_idx", def = "{'accessEndAt': 1}")
})
public class Inscripcion {

    @Id
    private String id;

    /** Relaciones */
    @NotBlank
    @Indexed
    private String idCurso;

    @NotBlank
    @Indexed
    private String idEstudiante;

    /** Estado del flujo de inscripción */
    @NotNull
    private EstadoInscripcion estado = EstadoInscripcion.ACTIVA;
    public enum EstadoInscripcion { PENDIENTE_PAGO, ACTIVA, SUSPENDIDA, COMPLETADA, CANCELADA, EXPIRADA }

    /** Ventana de acceso (útil para cursos con vencimiento) */
    private Instant accessStartAt;         // desde cuándo tiene acceso
    private Instant accessEndAt;           // hasta cuándo (null = vitalicio)
    private Boolean accesoVitalicio;       // atajo de UX

    /** Progreso (dos enfoques: porcentaje y/o IDs de lecciones completadas) */
    @PositiveOrZero
    private Integer progresoPct;           // 0..100 (cache para no recalcular)
    private Set<String> leccionesCompletadas;   // ids de lecciones completadas
    private String moduloActualId;              // UX: último módulo visto
    private String leccionActualId;             // UX: última lección vista
    private Instant lastAccessAt;               // última vez que abrió contenido

    /** Facturación / pagos */
    @Indexed
    private String idPago;                 // pago principal/último (si lo mantienes)
    private List<String> pagoIds;          // historial de pagos (si aplicas upgrades/renovaciones)

    // Snapshot de precios al momento de la compra (evita depender de precios actuales)
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

    private String cupon;                  // cupón aplicado (si existe)
    private String origen;                 // web, app, beca, invitación...

    /** Certificación / resultado final */
    private String certificadoId;          // si generas certificados
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal notaFinal;          // si manejas nota del curso
    private Boolean aprobadoFinal;         // si superó criterio global

    /** Auditoría */
    @CreatedDate
    private Instant createdAt;             // “fecha” original (reemplaza tu String fecha)
    @LastModifiedDate
    private Instant updatedAt;
    private Instant completadaAt;
    private Instant canceladaAt;

    /** Idempotencia (evitar doble creación por reintentos del cliente) */
    @Indexed(unique = true, sparse = true)
    private String idempotencyKey;

    /** Extras */
    private Map<String, String> metadata;

    @Version
    private Long version;                  // optimistic locking
}
