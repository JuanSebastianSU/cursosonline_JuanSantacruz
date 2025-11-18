package com.cursosonline.cursosonlinejs.DTO;

import java.math.BigDecimal;

public record LeccionProgresoDTO(
        String idLeccion,
        String titulo,
        BigDecimal nota,     // 0–100 (porcentaje) o null si no tiene intentos
        boolean aprobada
) {}
