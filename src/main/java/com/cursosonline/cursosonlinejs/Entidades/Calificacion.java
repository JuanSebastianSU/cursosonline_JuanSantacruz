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
@Getter @Setter
@CompoundIndexes({
  @CompoundIndex(name = "eval_estudiante_fecha_idx",
                 def = "{'idEvaluacion': 1, 'idEstudiante': 1, 'createdAt': -1}")
})
public class Calificacion {

  @Id
  private String id;

  /** Relaciones principales */
  @Indexed(unique = true)       // 1 calificación por intento
  @NotBlank
  private String idIntento;

  @Indexed
  private String idEvaluacion;  // snapshot para consultas rápidas

  @Indexed
  private String idEstudiante;  // alumno calificado

  /** Estado y tiempos */
  @NotNull
  private EstadoCalificacion estado = EstadoCalificacion.PENDIENTE;
  public enum EstadoCalificacion { PENDIENTE, EN_REVISION, PUBLICADA, ANULADA }

  private Instant calificadoAt; // momento en que se publica/finaliza

  /** Puntuaciones (precisas) */
  @Field(targetType = FieldType.DECIMAL128)
  @PositiveOrZero
  private BigDecimal puntaje;         // obtenido

  @Field(targetType = FieldType.DECIMAL128)
  @PositiveOrZero
  private BigDecimal puntajeMaximo;   // snapshot de la evaluación

  @Field(targetType = FieldType.DECIMAL128)
  private BigDecimal porcentaje;      // (puntaje/puntajeMaximo)*100

  @Field(targetType = FieldType.DECIMAL128)
  private BigDecimal notaCorte;       // snapshot (p. ej. 60/100)

  private Boolean aprobado;           // true si puntaje >= notaCorte

  /** Feedback */
  private String feedback;            // comentario general

  /** Calificador */
  @Indexed
  private String calificadoPor;       // id de usuario (instructor/TA)

  /** Rúbrica (opcional) */
  private List<ItemRubrica> rubrica;
  @Getter @Setter
  public static class ItemRubrica {
    private String criterio;                        // p.ej., “Contenido”, “Claridad”
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal maximo;                      // puntaje máximo del criterio
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal puntaje;                     // otorgado en el criterio
    private String comentario;                      // feedback específico
  }

  /** Auditoría */
  @CreatedDate
  private Instant createdAt;

  @LastModifiedDate
  private Instant updatedAt;

  @Version
  private Long version;
}
