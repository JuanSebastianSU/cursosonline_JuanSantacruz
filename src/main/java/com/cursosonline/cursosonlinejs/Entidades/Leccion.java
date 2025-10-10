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
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Document(collection = "lecciones")
@Getter
@Setter
@CompoundIndexes({
    @CompoundIndex(name = "modulo_titulo_uq", def = "{'idModulo': 1, 'titulo': 1}", unique = true, sparse = true),
    @CompoundIndex(name = "modulo_orden_uq", def = "{'idModulo': 1, 'orden': 1}", unique = true, sparse = true)
})
public class Leccion {

    @Id
    private String id;

    @Indexed
    private String idCurso;

    @Indexed
    private String idModulo;

    @NotBlank(message = "El título es obligatorio")
    @Size(min = 3, max = 200)
    private String titulo;

    @Indexed
    private String slug;

    @NotNull
    private TipoLeccion tipo;

    private String urlContenido;
    private String contenidoTexto;
    private VideoMeta video;
    private List<Recurso> recursos;

    @PositiveOrZero
    private Integer duracion;
    @PositiveOrZero
    private Integer orden;

    private EstadoPublicacion estado = EstadoPublicacion.BORRADOR;
    @Indexed
    private Instant publishedAt;
    private boolean preview;

    private List<String> evaluaciones;

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;
    @Version
    private Long version;

    public enum TipoLeccion { VIDEO, ARTICULO, QUIZ }
    public enum EstadoPublicacion { BORRADOR, PUBLICADO, ARCHIVADO }

    @Getter
    @Setter
    public static class VideoMeta {
        private String proveedor;
        private String videoId;
        private String thumbnailUrl;
        private String captionsUrl;
        private Integer resolucionMax;
    }

    @Getter
    @Setter
    public static class Recurso {
        @NotBlank
        private String tipo;
        @NotBlank
        private String titulo;
        private String url;
    }
}
