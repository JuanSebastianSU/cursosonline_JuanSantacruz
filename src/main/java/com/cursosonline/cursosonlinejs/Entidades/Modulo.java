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
@Getter
@Setter
@CompoundIndexes({
    @CompoundIndex(name = "curso_titulo_uq", def = "{'idCurso': 1, 'titulo': 1}", unique = true, sparse = true),
    @CompoundIndex(name = "curso_orden_uq", def = "{'idCurso': 1, 'orden': 1}", unique = true, sparse = true)
})
public class Modulo {

    @Id
    private String id;

    @Indexed
    private String idCurso;

    @NotBlank(message = "El título es obligatorio")
    @Size(min = 3, max = 200)
    private String titulo;

    @Indexed
    private String slug;

    @Size(max = 2000)
    private String descripcion;

    @PositiveOrZero
    private int orden;

    private EstadoModulo estado = EstadoModulo.BORRADOR;
    @Indexed
    private Instant publishedAt;

    @PositiveOrZero
    private Integer duracionTotalMinutos;

    private List<String> lecciones;

    private boolean preview;

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
