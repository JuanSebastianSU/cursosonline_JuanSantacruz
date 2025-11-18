package com.cursosonline.cursosonlinejs.Entidades;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Pregunta {

    private String id;                     // UUID interno
    private String enunciado;             // texto de la pregunta

    private TipoPregunta tipo;            // OPCION_UNICA, OPCION_MULTIPLE, VF, NUMERICA, ABIERTA

    private Integer puntaje;              // puntos que aporta esta pregunta

    /**
     * true  -> la plataforma puede autocorregirla
     * false -> requiere revisión manual del instructor
     */
    private boolean autoCalificable = true;

    // Para opción única / múltiple / verdadero-falso
    private List<OpcionPregunta> opciones = new ArrayList<>();

    // Para pregunta numérica
    private Double respuestaNumericaCorrecta;

    // Para pregunta abierta (guía para el docente)
    private String respuestaTextoGuia;
}
