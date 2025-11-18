package com.cursosonline.cursosonlinejs.Entidades;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OpcionPregunta {

    private String id;        // identificador de la opción (UUID simple)
    private String texto;     // texto visible al alumno
    private boolean correcta; // true si esta opción es correcta
    private String retroalimentacion; // opcional, texto que se muestra al revisar
}
