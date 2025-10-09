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
@Getter @Setter
@CompoundIndexes({
  // Evita emitir más de un certificado por curso y estudiante
  @CompoundIndex(name = "curso_estudiante_uq", def = "{'idCurso': 1, 'idEstudiante': 1}", unique = true, sparse = true),
  // Búsqueda/validación por código
  @CompoundIndex(name = "codigo_uq", def = "{'codigoVerificacion': 1}", unique = true, sparse = true)
})
public class Certificado {

  @Id
  private String id;

  /** Relaciones */
  @Indexed @NotBlank
  private String idCurso;

  @Indexed @NotBlank
  private String idEstudiante;

  /** Estado */
  private Estado estado = Estado.EMITIDO; // EMITIDO, REVOCADO
  public enum Estado { EMITIDO, REVOCADO }

  /** Fechas */
  private Instant emitidoEn;         // antes: emitidoEn (String)
  private Instant revocadoAt;

  /** Verificación pública */
  @NotBlank
  @Indexed(unique = true)
  private String codigoVerificacion; // ej: base62 de 10-16 chars

  // Opcional: almacenar solo hash y mostrar el código una vez al crear
  private String codigoHash;         // SHA-256/… si no guardas el plano

  private String publicUrl;          // URL pública p/validación QR
  private String qrData;             // datos para generar QR (si lo usas)

  /** Snapshots (para que no cambien si curso/usuario cambian) */
  @NotBlank
  private String cursoTitulo;
  private String instructorNombre;
  @NotBlank
  private String estudianteNombre;

  @Pattern(regexp = "^[A-Z]{3}$")
  private String moneda;             // si muestras precio/valor (opcional)

  @Field(targetType = FieldType.DECIMAL128)
  private BigDecimal notaFinal;      // si el curso tiene nota

  @PositiveOrZero
  private Integer horas;             // horas totales del curso

  /** Plantilla/render */
  private String templateId;         // ID de plantilla usada
  private String pdfUrl;             // URL del PDF generado (S3, etc.)
  private String backgroundUrl;      // imagen de fondo (opcional)
  private String firmaUrl;           // firma digital/imagen (opcional)
  private String selloUrl;           // sello/logo (opcional)

  /** Auditoría / extras */
  @CreatedDate
  private Instant createdAt;

  @LastModifiedDate
  private Instant updatedAt;

  private Map<String, String> metadata;

  @Version
  private Long version;
}
