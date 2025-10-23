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
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Document(collection = "cursos")
@Getter
@Setter
@CompoundIndexes({
    @CompoundIndex(name = "instructor_titulo_uq", def = "{'idInstructor': 1, 'titulo': 1}", unique = true, sparse = true),
    @CompoundIndex(name = "estado_categoria_pub_idx", def = "{'estado': 1, 'categoria': 1, 'publishedAt': -1}"),
    @CompoundIndex(name = "slug_uq", def = "{'slug': 1}", unique = true, sparse = true)
})
public class Curso {

    @Id
    private String id;

    @NotBlank
    @Size(min = 3, max = 200)
    @TextIndexed
    private String titulo;

    @Indexed
    private String slug;

    @Size(max = 5000)
    @TextIndexed
    private String descripcion;

    @TextIndexed
    private List<String> etiquetas;

    @NotBlank
    private String categoria;

    @NotNull
    private Nivel nivel = Nivel.PRINCIPIANTE;

    @NotBlank
    @Pattern(regexp = "^[a-z]{2}(-[A-Z]{2})?$", message = "Idioma debe ser ISO (p.ej., es o es-EC)")
    private String idioma;

    public enum Nivel { PRINCIPIANTE, INTERMEDIO, AVANZADO }

    @Field(targetType = FieldType.DECIMAL128)
    @PositiveOrZero
    private BigDecimal precio;
    
    @Field(targetType = FieldType.DECIMAL128)
    @PositiveOrZero
    private BigDecimal precioLista;

    @Pattern(regexp = "^[A-Z]{3}$", message = "Moneda ISO-4217 en mayúsculas, p.ej. USD")
    private String moneda = "USD";

    private Boolean gratuito;

    @NotNull
    private EstadoCurso estado = EstadoCurso.BORRADOR;

    public enum EstadoCurso { BORRADOR, PUBLICADO, OCULTO, ARCHIVADO }

    @Indexed
    private Instant publishedAt;

    private Boolean destacado;

    @Indexed
    @NotBlank
    private String idInstructor;

    @PositiveOrZero
    private Integer duracionTotalMinutos = 0;

    @PositiveOrZero
    private Integer modulosCount = 0;

    @PositiveOrZero
    private Integer leccionesCount = 0;

    private List<String> modulos;

    private String imagenPortadaUrl;
    private String promoVideoUrl;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal ratingAvg;

    @PositiveOrZero
    private Long ratingCount;

    @PositiveOrZero
    private Long inscritosCount = 0L;

    private Boolean accesoVitalicio = true;
    @PositiveOrZero
    private Integer accessDays;
    private Instant enrollmentOpenAt;
    private Instant enrollmentCloseAt;
    @PositiveOrZero
    private Integer cupoMaximo;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @Version
    private Long version;
}
