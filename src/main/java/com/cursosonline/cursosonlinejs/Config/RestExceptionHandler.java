package com.cursosonline.cursosonlinejs.Config;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestControllerAdvice
public class RestExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> onIllegalArgument(IllegalArgumentException ex) {
        String code = ex.getMessage();
        String message = switch (code) {
            case "ROL_UPDATE_NOT_ALLOWED" -> "No está permitido cambiar el tipo de usuario.";
            default -> "Solicitud inválida.";
        };
        return ResponseEntity.badRequest().body(Map.of(
                "error", code == null ? "INVALID_ARGUMENT" : code,
                "message", message
        ));
    }
}
