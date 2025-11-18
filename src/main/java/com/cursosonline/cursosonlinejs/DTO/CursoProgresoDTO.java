package com.cursosonline.cursosonlinejs.DTO;

import java.math.BigDecimal;
import java.util.List;

public record CursoProgresoDTO(
        String idCurso,
        String idInscripcion,
        BigDecimal notaFinal,   // promedio 0–100 de módulos
        boolean aprobadoFinal,
        List<ModuloProgresoDTO> modulos
) {}
