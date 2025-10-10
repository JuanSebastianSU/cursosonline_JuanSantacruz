package com.cursosonline.cursosonlinejs.Entidades;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

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
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

@Document(collection = "certificados")
@Getter
@Setter
@CompoundIndexes({
    @CompoundIndex(name = "curso_estudiante_uq", def = "{'idCurso': 1, 'idEstudiante': 1}", unique = true, sparse = true),
    @CompoundIndex(name = "codigo_uq", def = "{'codigoVerificacion': 1}", unique = true, sparse = true)
})
public class Certificado {

    @Id
    private String id;

    @Indexed
    @NotBlank
    private String idCurso;

    @Indexed
    @NotBlank
    private String idEstudiante;

    private Estado estado = Estado.EMITIDO;
    public enum Estado { EMITIDO, REVOCADO }

    private Instant emitidoEn;
    private Instant revocadoAt;

    @NotBlank
    @Indexed(unique = true)
    private String codigoVerificacion;

    private String codigoHash;
    private String publicUrl;
    private String qrData;

    @NotBlank
    private String cursoTitulo;
    private String instructorNombre;
    @NotBlank
    private String estudianteNombre;

    @Pattern(regexp = "^[A-Z]{3}$")
    private String moneda;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal notaFinal;

    @PositiveOrZero
    private Integer horas;

    private String templateId;
    private String pdfUrl;
    private String backgroundUrl;
    private String firmaUrl;
    private String selloUrl;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    private Map<String, String> metadata;

    @Version
    private Long version;
}
