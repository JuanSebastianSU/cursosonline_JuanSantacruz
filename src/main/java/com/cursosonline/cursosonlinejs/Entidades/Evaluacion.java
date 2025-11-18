package com.cursosonline.cursosonlinejs.Entidades;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
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
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Document(collection = "evaluaciones")
@Getter
@Setter
@CompoundIndexes({
    @CompoundIndex(name = "leccion_titulo_uq", def = "{'idLeccion': 1, 'titulo': 1}", unique = true, sparse = true),
    @CompoundIndex(name = "leccion_estado_fecha_idx", def = "{'idLeccion': 1, 'estado': 1, 'createdAt': -1}"),
    @CompoundIndex(name = "disponible_hasta_idx", def = "{'disponibleHasta': 1}")
})
public class Evaluacion {

    @Id
    private String id;

    @Indexed
    private String idLeccion;
    @Indexed
    private String idModulo;
    @Indexed
    private String idCurso;

    @NotBlank(message = "El título es obligatorio")
    @Size(min = 3, max = 200)
    private String titulo;

    @Size(max = 2000)
    private String descripcion;

    @NotNull
    private TipoEvaluacion tipo = TipoEvaluacion.QUIZ;
    public enum TipoEvaluacion { QUIZ, TAREA, EXAMEN }

    @NotNull
    private EstadoPublicacion estado = EstadoPublicacion.BORRADOR;
    public enum EstadoPublicacion { BORRADOR, PUBLICADA, ARCHIVADA }

    @Indexed
    private Instant publishedAt;

    @Field(targetType = FieldType.DECIMAL128)
    @Positive
    private BigDecimal puntajeMaximo;

    @Field(targetType = FieldType.DECIMAL128)
    @Positive
    private BigDecimal notaAprobatoria;

    @PositiveOrZero
    private Integer maxIntentos;
    @PositiveOrZero
    private Integer minSegundosEntreIntentos;

    @PositiveOrZero
    private Integer timeLimitSeconds;

    private Instant disponibleDesde;
    private Instant disponibleHasta;
    private Instant dueAt;
    private Boolean permitirEntregaTardia;
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal penalizacionTardiaPct;

    // Opcional: si algún día usas bancos globales
    private String bancoPreguntasId;

    @PositiveOrZero
    private Integer totalPreguntas;

    private Boolean barajarPreguntas;
    private Boolean barajarOpciones;

    @NotNull
    private PoliticaResultado politicaResultado = PoliticaResultado.SOLO_PUNTAJE;
    public enum PoliticaResultado {
        NUNCA,
        SOLO_PUNTAJE,
        PUNTAJE_Y_RESPUESTAS,
        DESPUES_DE_CIERRE
    }

    /**
     * Si todas las preguntas son autoCalificable=true y de tipo soportado
     * (OPCION_UNICA, OPCION_MULTIPLE, VERDADERO_FALSO, NUMERICA),
     * entonces esta evaluación se puede calificar totalmente sola.
     */
    private Boolean autoCalificable;

    /**
     * true si hay al menos una pregunta ABIERTA o marcada como no autoCalificable.
     */
    private Boolean requiereRevisionManual;

    /**
     * NUEVO: lista de preguntas embebidas en la evaluación.
     */
    private List<Pregunta> preguntas = new ArrayList<>();

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;
    @Version
    private Long version;
}
