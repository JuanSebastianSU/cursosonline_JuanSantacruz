package com.cursosonline.cursosonlinejs.Entidades;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

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
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

@Document(collection = "calificaciones")
@Getter
@Setter
@CompoundIndexes({
    @CompoundIndex(name = "eval_estudiante_fecha_idx",
            def = "{'idEvaluacion': 1, 'idEstudiante': 1, 'createdAt': -1}")
})
public class Calificacion {

    @Id
    private String id;

    @Indexed(unique = true)
    @NotBlank
    private String idIntento;

    @Indexed
    private String idEvaluacion;

    @Indexed
    private String idEstudiante;

    @NotNull
    private EstadoCalificacion estado = EstadoCalificacion.PENDIENTE;

    public enum EstadoCalificacion {
        PENDIENTE, EN_REVISION, PUBLICADA, ANULADA
    }

    private Instant calificadoAt;

    @Field(targetType = FieldType.DECIMAL128)
    @PositiveOrZero
    private BigDecimal puntaje;

    @Field(targetType = FieldType.DECIMAL128)
    @PositiveOrZero
    private BigDecimal puntajeMaximo;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal porcentaje;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal notaCorte;

    private Boolean aprobado;

    private String feedback;

    @Indexed
    private String calificadoPor;

    private List<ItemRubrica> rubrica;

    @Getter
    @Setter
    public static class ItemRubrica {
        private String criterio;
        @Field(targetType = FieldType.DECIMAL128)
        private BigDecimal maximo;
        @Field(targetType = FieldType.DECIMAL128)
        private BigDecimal puntaje;
        private String comentario;
    }

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @Version
    private Long version;
}
