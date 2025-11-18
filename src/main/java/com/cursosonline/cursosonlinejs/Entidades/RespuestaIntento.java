package com.cursosonline.cursosonlinejs.Entidades;

import java.util.ArrayList;
import java.util.List;

public class RespuestaIntento {

    private String idPregunta;

    // Para opción múltiple / V-F (ids de opciones elegidas)
    private List<String> opcionesSeleccionadasIds = new ArrayList<>();

    // Para pregunta abierta
    private String respuestaTexto;

    // Para numérica
    private Double respuestaNumerica;

    // Resultado de calificación
    private Double puntajeObtenido;
    private EstadoRespuesta estado;

    public RespuestaIntento() {
    }

    public String getIdPregunta() {
        return idPregunta;
    }

    public void setIdPregunta(String idPregunta) {
        this.idPregunta = idPregunta;
    }

    public List<String> getOpcionesSeleccionadasIds() {
        return opcionesSeleccionadasIds;
    }

    public void setOpcionesSeleccionadasIds(List<String> opcionesSeleccionadasIds) {
        this.opcionesSeleccionadasIds = opcionesSeleccionadasIds;
    }

    public String getRespuestaTexto() {
        return respuestaTexto;
    }

    public void setRespuestaTexto(String respuestaTexto) {
        this.respuestaTexto = respuestaTexto;
    }

    public Double getRespuestaNumerica() {
        return respuestaNumerica;
    }

    public void setRespuestaNumerica(Double respuestaNumerica) {
        this.respuestaNumerica = respuestaNumerica;
    }

    public Double getPuntajeObtenido() {
        return puntajeObtenido;
    }

    public void setPuntajeObtenido(Double puntajeObtenido) {
        this.puntajeObtenido = puntajeObtenido;
    }

    public EstadoRespuesta getEstado() {
        return estado;
    }

    public void setEstado(EstadoRespuesta estado) {
        this.estado = estado;
    }
}
