package com.cursosonline.cursosonlinejs.Entidades;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Document(collection = "tipos_usuario")
@Getter @Setter
public class TipoUsuario {

    @Id
    private String id;

    @NotBlank(message = "El nombre del tipo de usuario es obligatorio")
    @Indexed(unique = true)
    private String nombre; // p.ej. "ADMIN", "Instructor", "Usuario"

    private String descripcion;

    /** true si este tipo es propio del sistema y no debería borrarse (p.ej. ADMIN) */
    private boolean system;

    /** true si este tipo debe asignarse por defecto a nuevos usuarios (máximo 1) */
    private boolean isDefault;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
