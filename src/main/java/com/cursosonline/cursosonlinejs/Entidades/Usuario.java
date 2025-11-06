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

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonProperty.Access;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Document(collection = "usuarios")
@Getter
@Setter
@ToString(exclude = "password")
@CompoundIndexes({
    @CompoundIndex(name = "estado_rol_fecha_idx", def = "{'estado': 1, 'rol': 1, 'fechaRegistro': -1}")
})
public class Usuario {

    @Id
    private String id;

    @NotBlank
    @Size(min = 3, max = 200)
    private String nombre;

    @Email
    @NotBlank
    @Indexed(unique = true)
    private String email;

    @NotBlank
    private String rol;

    @NotBlank
    private String estado;

    private boolean emailVerified;
    private Instant lastLoginAt;
    private Integer failedLoginAttempts;
    private Instant lockedUntil;
    private Instant passwordUpdatedAt;
    private boolean mfaEnabled;

    @NotBlank
    @JsonProperty(access = Access.WRITE_ONLY)
    private String password;

    private String fotoUrl;
    
    @CreatedDate
    private Instant fechaRegistro;

    @LastModifiedDate
    private Instant updatedAt;

    @Version
    private Long version;

    private List<CursoResumen> cursos;

    @Getter
    @Setter
    public static class CursoResumen {
        private String id;
        private String titulo;
    }
}
