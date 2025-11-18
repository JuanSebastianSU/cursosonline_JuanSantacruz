package com.cursosonline.cursosonlinejs.Config;

import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.OpenAPI;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI apiCursosOnline() {
        return new OpenAPI()
                .info(new Info()
                        .title("API - Plataforma CursosOnlineJS")
                        .description("API REST para la gestión de cursos, módulos, lecciones, usuarios e inscripciones.")
                        .version("v1.0")
                        .contact(new Contact()
                                .name("Juan Santacruz")
                                .email("jsebastiansantacruzurgilez2005@gmail.com")
                        )
                );
    }
}
