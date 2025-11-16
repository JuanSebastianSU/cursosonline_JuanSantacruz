// package com.cursosonline.cursosonlinejs.Seguridad;

// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.web.servlet.config.annotation.CorsRegistry;
// import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// @Configuration
// public class CorsConfig {
//   @Bean
//   public WebMvcConfigurer corsConfigurer() {
//     return new WebMvcConfigurer() {
//       @Override
//       public void addCorsMappings(CorsRegistry registry) {
//         registry.addMapping("/api/v1/**")
//                 .allowedOriginPatterns("http://localhost:9090", "http://localhost:3000")
//                 .allowedMethods("GET","POST","PUT","DELETE","PATCH","OPTIONS")
//                 .allowedHeaders("Authorization","Content-Type")
//                 .exposedHeaders("Authorization")
//                 .allowCredentials(true);
//       }
//     };
//   }
// }
// CorsConfig.java
package com.cursosonline.cursosonlinejs.Seguridad;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// CorsConfig.java
@Configuration
public class CorsConfig {
  @Bean
  public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
      @Override
      public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOriginPatterns(
                "http://localhost:3000",
                "http://localhost:8080",
                "https://cursosonline-juan-santacruz.vercel.app"
            )
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true); // o false, si no usas cookies
      }
    };
  }
}
