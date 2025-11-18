package com.cursosonline.cursosonlinejs.DTO;

import java.math.BigDecimal;
import java.util.List;

public record ModuloProgresoDTO(
        String idModulo,
        String titulo,
        BigDecimal nota,     // promedio 0–100 de sus lecciones
        boolean aprobado,
        List<LeccionProgresoDTO> lecciones
) {}
