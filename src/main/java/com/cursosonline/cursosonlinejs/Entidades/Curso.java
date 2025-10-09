// src/main/java/com/cursosonline/cursosonlinejs/Entidades/Curso.java
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
@Getter @Setter
@CompoundIndexes({
    // Evita duplicar curso con mismo título por instructor
    @CompoundIndex(name = "instructor_titulo_uq", def = "{'idInstructor': 1, 'titulo': 1}", unique = true, sparse = true),
    // Accesos rápidos por estado/categoría y orden por publicación
    @CompoundIndex(name = "estado_categoria_pub_idx", def = "{'estado': 1, 'categoria': 1, 'publishedAt': -1}"),
    // Slug único para URLs
    @CompoundIndex(name = "slug_uq", def = "{'slug': 1}", unique = true, sparse = true)
})
public class Curso {

    @Id
    private String id;

    /** Identidad / SEO */
    @NotBlank
    @Size(min = 3, max = 200)
    @TextIndexed
    private String titulo;

    @Indexed
    private String slug; // p.ej. "java-desde-cero"

    @Size(max = 5000)
    @TextIndexed
    private String descripcion;

    @TextIndexed
    private List<String> etiquetas; // tags (búsqueda/filtros)

    /** Clasificación */
    @NotBlank
    private String categoria;

    @NotNull
    private Nivel nivel = Nivel.PRINCIPIANTE; // BASICO, INTERMEDIO, AVANZADO

    @NotBlank
    @Pattern(regexp = "^[a-z]{2}(-[A-Z]{2})?$", message = "Idioma debe ser ISO (p.ej., es o es-EC)")
    private String idioma; // "es", "es-EC", "en"

    public enum Nivel { PRINCIPIANTE, INTERMEDIO, AVANZADO }

    /** Precio (DECIMAL128 para precisión) */
    @Field(targetType = FieldType.DECIMAL128)
    @PositiveOrZero
    private BigDecimal precio;              // precio vigente

    @Field(targetType = FieldType.DECIMAL128)
    @PositiveOrZero
    private BigDecimal precioLista;         // precio “tachado”/original (opcional)

    @Pattern(regexp = "^[A-Z]{3}$", message = "Moneda ISO-4217 en mayúsculas, p.ej. USD")
    private String moneda = "USD";

    private Boolean gratuito;               // atajo útil para UX

    /** Publicación */
    @NotNull
    private EstadoCurso estado = EstadoCurso.BORRADOR; // BORRADOR, PUBLICADO, OCULTO, ARCHIVADO

    public enum EstadoCurso { BORRADOR, PUBLICADO, OCULTO, ARCHIVADO }

    @Indexed
    private Instant publishedAt;

    private Boolean destacado;              // featured en el catálogo

    /** Relaciones */
    @Indexed
    @NotBlank
    private String idInstructor;            // usuario instructor

    /** Contenido (cache y navegación) */
    @PositiveOrZero
    private Integer duracionTotalMinutos = 0;   // suma de lecciones (cache)

    @PositiveOrZero
    private Integer modulosCount = 0;           // cache rápido

    @PositiveOrZero
    private Integer leccionesCount = 0;  // <-- evita null

    private List<String> modulos;           // si mantienes lista de IDs

    /** Portada / media */
    private String imagenPortadaUrl;
    private String promoVideoUrl;

    /** Métricas (para ordenar por ranking) */
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal ratingAvg;           // 0..5

    @PositiveOrZero
    private Long ratingCount;

    @PositiveOrZero
    private Long inscritosCount = 0L;       // <-- inicializado para evitar null

    /** Acceso / matrícula */
    private Boolean accesoVitalicio = true;
    @PositiveOrZero
    private Integer accessDays;             // si no es vitalicio
    private Instant enrollmentOpenAt;
    private Instant enrollmentCloseAt;
    @PositiveOrZero
    private Integer cupoMaximo;

    /** Auditoría / concurrencia */
    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @Version
    private Long version;
}
