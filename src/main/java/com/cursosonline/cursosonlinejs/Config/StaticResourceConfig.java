package com.cursosonline.cursosonlinejs.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Carpeta local donde guardas las fotos
        Path uploadDir = Paths.get("uploads/fotos");
        String uploadPath = uploadDir.toFile().getAbsolutePath();

        // Permite acceder a las imágenes desde el navegador
        registry.addResourceHandler("/uploads/fotos/**")
                .addResourceLocations("file:" + uploadPath + "/");
    }
}
