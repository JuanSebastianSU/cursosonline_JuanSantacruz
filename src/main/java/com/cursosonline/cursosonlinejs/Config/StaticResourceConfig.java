package com.cursosonline.cursosonlinejs.Config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Value("${app.uploads-dir:uploads}")
    private String uploadsDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path path = Paths.get(uploadsDir).toAbsolutePath().normalize();
        String uri = path.toUri().toString(); // p.ej. file:/C:/ruta/absoluta/uploads/
        registry.addResourceHandler("/uploads/**").addResourceLocations(uri);
    }
}
