// src/main/java/com/cursosonline/cursosonlinejs/Entidades/Intento.java
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
@Getter @Setter
@CompoundIndexes({
    // Evita duplicar el mismo intento N de un estudiante en una evaluación
    @CompoundIndex(name = "eval_estudiante_nro_uq",
                   def = "{'idEvaluacion': 1, 'idEstudiante': 1, 'nroIntento': 1}",
                   unique = true, sparse = true),
    // Consultas comunes
    @CompoundIndex(name = "eval_estado_fecha_idx",
                   def = "{'idEvaluacion': 1, 'estado': 1, 'createdAt': -1}")
})
public class Intento {

    @Id
    private String id;

    @Indexed
    private String idEvaluacion;

    @Indexed
    private String idEstudiante; // usuario (estudiante dueño del intento)

    /** Número de intento (1..N) */
    @Positive
    private Integer nroIntento;

    /** Estado del intento */
    @NotNull
    private EstadoIntento estado = EstadoIntento.EN_PROGRESO;
    public enum EstadoIntento { EN_PROGRESO, ENVIADO, CALIFICADO, EXPIRADO, ANULADO }

    /** Tiempos */
    @CreatedDate
    private Instant createdAt;     // inicio
    private Instant enviadoEn;     // envío
    private Instant calificadoAt;  // calificación
    @LastModifiedDate
    private Instant updatedAt;

    /** Tiempo límite y usado (snapshot de la Evaluación) */
    @PositiveOrZero
    private Integer timeLimitSeconds; // 0 o null = sin límite
    @PositiveOrZero
    private Integer usedTimeSeconds;  // acumulado por el alumno

    /** Calificación total */
    @Field(targetType = FieldType.DECIMAL128)
    @PositiveOrZero
    private BigDecimal puntaje;        // obtenido

    @Field(targetType = FieldType.DECIMAL128)
    @PositiveOrZero
    private BigDecimal puntajeMaximo;  // snapshot de la evaluación

    /** Detalle por pregunta (simplificado) */
    private List<Respuesta> respuestas;

    @Getter @Setter
    public static class Respuesta {
        private String idPregunta;
        private List<String> opciones;   // multiselección
        private String textoLibre;       // abierta
        @Field(targetType = FieldType.DECIMAL128)
        private BigDecimal puntaje;      // puntaje en esa pregunta
        @PositiveOrZero
        private Integer tiempoSegundos;  // tiempo en esa pregunta
    }

    @Version
    private Long version; // optimistic locking
    // referencia a la calificación (si existe)
private String idCalificacion;

}
