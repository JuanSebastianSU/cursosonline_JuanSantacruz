package com.cursosonline.cursosonlinejs.Entidades;

import java.math.BigDecimal;
import java.time.Instant;

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
@Getter @Setter
@CompoundIndexes({
    // Un título no se repite dentro de la misma lección
    @CompoundIndex(name = "leccion_titulo_uq", def = "{'idLeccion': 1, 'titulo': 1}", unique = true, sparse = true),
    // Consultas típicas: por lección, estado y fecha de creación
    @CompoundIndex(name = "leccion_estado_fecha_idx", def = "{'idLeccion': 1, 'estado': 1, 'createdAt': -1}"),
    // Para encontrar evaluaciones que cierran o expiran pronto
    @CompoundIndex(name = "disponible_hasta_idx", def = "{'disponibleHasta': 1}")
})
public class Evaluacion {

    @Id
    private String id;

    /** Relación con lección (y opcionalmente curso/módulo para acelerar consultas) */
    @Indexed
    private String idLeccion;
    @Indexed
    private String idModulo;   // opcional (desnormalización útil)
    @Indexed
    private String idCurso;    // opcional (desnormalización útil)

    /** Título y metadatos */
    @NotBlank(message = "El título es obligatorio")
    @Size(min = 3, max = 200)
    private String titulo;

    @Size(max = 2000)
    private String descripcion;

    /** Tipo y publicación */
    @NotNull
    private TipoEvaluacion tipo = TipoEvaluacion.QUIZ; // QUIZ, TAREA, EXAMEN
    public enum TipoEvaluacion { QUIZ, TAREA, EXAMEN }

    @NotNull
    private EstadoPublicacion estado = EstadoPublicacion.BORRADOR; // BORRADOR, PUBLICADA, ARCHIVADA
    public enum EstadoPublicacion { BORRADOR, PUBLICADA, ARCHIVADA }

    @Indexed
    private Instant publishedAt; // cuándo se publica

    /** Puntuación (usa DECIMAL128 para evitar problemas de precisión) */
    @Field(targetType = FieldType.DECIMAL128)
    @Positive
    private BigDecimal puntajeMaximo;

    @Field(targetType = FieldType.DECIMAL128)
    @Positive
    private BigDecimal notaAprobatoria; // punto de corte (ej. 60/100)

    /** Intentos y tiempo */
    @PositiveOrZero
    private Integer maxIntentos;            // null = sin límite
    @PositiveOrZero
    private Integer minSegundosEntreIntentos; // anti-spam

    @PositiveOrZero
    private Integer timeLimitSeconds;       // 0/null = sin límite

    /** Ventana de disponibilidad */
    private Instant disponibleDesde;        // null = desde ya
    private Instant disponibleHasta;        // null = sin cierre
    private Instant dueAt;                  // fecha de entrega (para TAREA)
    private Boolean permitirEntregaTardia;  // si se permite entrega tardía
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal penalizacionTardiaPct; // 0..100

    /** Aleatorización / banco de preguntas (si aplicas) */
    private String bancoPreguntasId;        // colección/banco externo
    @PositiveOrZero
    private Integer totalPreguntas;         // cuántas seleccionar del banco
    private Boolean barajarPreguntas;
    private Boolean barajarOpciones;

    /** Política de resultados para estudiante */
    @NotNull
    private PoliticaResultado politicaResultado = PoliticaResultado.SOLO_PUNTAJE;
    public enum PoliticaResultado {
        NUNCA,               // no muestra nada
        SOLO_PUNTAJE,        // muestra score sin soluciones
        PUNTAJE_Y_RESPUESTAS,// muestra score + cuáles acertó/falló
        DESPUES_DE_CIERRE    // lo anterior pero solo tras dueAt/disponibleHasta
    }

    private Boolean autoCalificable;        // true si todo es auto-corrección
    private Boolean requiereRevisionManual; // true si hay abiertas

    /** Auditoría / concurrencia */
    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;
    @Version
    private Long version;
}
