package com.cursosonline.cursosonlinejs.Entidades;

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

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Document(collection = "modulos")
@Getter @Setter
@CompoundIndexes({
    // Un módulo por curso no puede repetir título
    @CompoundIndex(name = "curso_titulo_uq", def = "{'idCurso': 1, 'titulo': 1}", unique = true, sparse = true),
    // Un módulo por curso no puede repetir orden
    @CompoundIndex(name = "curso_orden_uq", def = "{'idCurso': 1, 'orden': 1}", unique = true, sparse = true)
})
public class Modulo {

    @Id
    private String id;

    /** Curso al que pertenece este módulo */
    @Indexed
    private String idCurso;

    /** Título y metadatos */
    @NotBlank(message = "El título es obligatorio")
    @Size(min = 3, max = 200)
    private String titulo;

    /** Slug opcional para URLs legibles (p.ej., "introduccion-a-java") */
    @Indexed
    private String slug;

    @Size(max = 2000)
    private String descripcion;

    /** Orden dentro del curso (0 o 1-based, como decidas) */
    @PositiveOrZero
    private int orden;

    /** Estado de publicación */
    private EstadoModulo estado = EstadoModulo.BORRADOR; // BORRADOR, PUBLICADO, ARCHIVADO
    @Indexed
    private Instant publishedAt; // cuando se publica

    /** Duración total estimada (minutos) para UX / progreso */
    @PositiveOrZero
    private Integer duracionTotalMinutos;

    /** Lecciones en orden. Mantén IDs ordenados según 'orden' de cada lección */
    private List<String> lecciones;

    /** Mostrar como vista previa abierta (marketing) */
    private boolean preview;

    /** Auditoría */
    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;
    @Version
    private Long version;

    public enum EstadoModulo {
        BORRADOR, PUBLICADO, ARCHIVADO
    }
}
