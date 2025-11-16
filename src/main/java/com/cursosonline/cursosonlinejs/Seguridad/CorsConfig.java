// src/main/java/com/cursosonline/cursosonlinejs/Seguridad/CorsConfig.java
package com.cursosonline.cursosonlinejs.Seguridad;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        // 👇 Orígenes permitidos
                        .allowedOriginPatterns(
                                "http://localhost:3000",
                                "http://localhost:8080",
                                // tu dominio principal de Vercel (producción)
                                "https://cursosonline-juan-santacruz.vercel.app",
                                // los previews de Vercel (git-main-..., otras ramas, etc.)
                                "https://*.vercel.app"
                        )
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .exposedHeaders("Authorization")
                        // NO usamos cookies, solo JWT por header → false sin problema
                        .allowCredentials(false);
            }
        };
    }
}
