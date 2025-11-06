package com.cursosonline.cursosonlinejs.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Expone la carpeta local "uploads" para que los archivos sean accesibles por HTTP.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Mapea las peticiones /uploads/** hacia el directorio físico "uploads/"
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/") // <-- importante, "file:" indica ruta local
                .setCachePeriod(3600); // cache 1h opcional
    }
}
