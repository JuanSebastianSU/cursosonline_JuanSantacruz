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

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

@Document(collection = "intentos")
@Getter
@Setter
@CompoundIndexes({
    @CompoundIndex(name = "eval_estudiante_nro_uq",
                   def = "{'idEvaluacion': 1, 'idEstudiante': 1, 'nroIntento': 1}",
                   unique = true, sparse = true),
    @CompoundIndex(name = "eval_estado_fecha_idx",
                   def = "{'idEvaluacion': 1, 'estado': 1, 'createdAt': -1}")
})
public class Intento {

    @Id
    private String id;

    @Indexed
    private String idEvaluacion;

    @Indexed
    private String idEstudiante;

    @Positive
    private Integer nroIntento;

    @NotNull
    private EstadoIntento estado = EstadoIntento.EN_PROGRESO;
    public enum EstadoIntento { EN_PROGRESO, ENVIADO, CALIFICADO, EXPIRADO, ANULADO }

    @CreatedDate
    private Instant createdAt;
    private Instant enviadoEn;
    private Instant calificadoAt;
    @LastModifiedDate
    private Instant updatedAt;

    @PositiveOrZero
    private Integer timeLimitSeconds;
    @PositiveOrZero
    private Integer usedTimeSeconds;

    @Field(targetType = FieldType.DECIMAL128)
    @PositiveOrZero
    private BigDecimal puntaje;

    @Field(targetType = FieldType.DECIMAL128)
    @PositiveOrZero
    private BigDecimal puntajeMaximo;

    private List<Respuesta> respuestas;

    @Getter
    @Setter
    public static class Respuesta {
        private String idPregunta;
        private List<String> opciones;
        private String textoLibre;
        @Field(targetType = FieldType.DECIMAL128)
        private BigDecimal puntaje;
        @PositiveOrZero
        private Integer tiempoSegundos;
    }

    @Version
    private Long version;

    private String idCalificacion;
}
