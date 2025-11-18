package com.cursosonline.cursosonlinejs.DTO;

import java.util.List;

public class IntentoEnvioDTO {

    public static class RespuestaDTO {
        public String idPregunta;
        public List<String> opcionesSeleccionadasIds;
        public String respuestaTexto;
        public Double respuestaNumerica;
    }

    public List<RespuestaDTO> respuestas;
}
