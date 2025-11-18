package com.cursosonline.cursosonlinejs.DTO;

import com.cursosonline.cursosonlinejs.Entidades.TipoCorreccion;
import com.cursosonline.cursosonlinejs.Entidades.TipoPregunta;

import java.util.List;

public class EvaluacionCrearDTO {

    public static class OpcionDTO {
        public String texto;
        public boolean correcta;
    }

    public static class PreguntaDTO {
        public String enunciado;
        public TipoPregunta tipo;
        public Integer puntaje;
        public Boolean autoCalificable; // null => deducir según tipo

        public List<OpcionDTO> opciones;
        public Double respuestaNumericaCorrecta;
        public String respuestaTextoGuia;
    }

    public String titulo;
    public String descripcion;
    public TipoCorreccion tipoCorreccion; // opcional, se puede recalcular
    public Integer tiempoLimiteMin;
    public Boolean aleatorizarPreguntas;

    public List<PreguntaDTO> preguntas;
}
