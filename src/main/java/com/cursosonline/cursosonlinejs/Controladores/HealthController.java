package com.cursosonline.cursosonlinejs.Controladores;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.Map;

// Swagger / OpenAPI
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1")
@Tag(
        name = "Health",
        description = "Endpoint de verificación de estado de la API."
)
public class HealthController {

    @Operation(
            summary = "Comprobar estado de la API",
            description = "Devuelve un objeto sencillo indicando que el servicio está operativo."
    )
    @ApiResponse(
            responseCode = "200",
            description = "La API está funcionando correctamente"
    )
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }
}
