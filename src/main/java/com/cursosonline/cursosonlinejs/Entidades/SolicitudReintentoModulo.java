package com.cursosonline.cursosonlinejs.Entidades;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "solicitudes_reintento_modulo")
@Getter
@Setter
public class SolicitudReintentoModulo {

    @Id
    private String id;

    @Indexed
    @NotBlank
    private String idCurso;

    @Indexed
    @NotBlank
    private String idModulo;

    @Indexed
    @NotBlank
    private String idEstudiante;

    public enum Estado { PENDIENTE, APROBADA, RECHAZADA, CANCELADA }

    private Estado estado = Estado.PENDIENTE;

    // Opcional: motivo que escribe el alumno
    private String motivo;

    // Quién resolvió (instructor/admin) y comentario
    private String resueltoPorUsuarioId;
    private String comentarioResolucion;

    private Instant resueltoAt;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
