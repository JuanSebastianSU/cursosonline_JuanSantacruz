package com.cursosonline.cursosonlinejs.Seguridad;

import com.cursosonline.cursosonlinejs.Servicios.CustomUserDetailServicio;
import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtAuthFilter;
    private final CustomUserDetailServicio userDetailsService;

    public SecurityConfig(JwtFilter jwtAuthFilter, CustomUserDetailServicio userDetailsService) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .csrf(AbstractHttpConfigurer::disable)
        .cors(Customizer.withDefaults())
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(reg -> reg
    // Archivos estáticos y raíz del dominio
    .requestMatchers(
        "/", "/error",
        "/index.html",
        "/**/*.html",
        "/**/*.css",
        "/**/*.js",
        "/favicon.ico",
        "/**/*.png",
        "/**/*.jpg",
        "/**/*.jpeg",
        "/**/*.svg",
        "/**/*.webp",
        "/uploads/**"
    ).permitAll()

    // Endpoint health
    .requestMatchers(HttpMethod.GET, "/api/v1/health").permitAll()

    // Endpoints públicos
    .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/tipousuario/**").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/menu").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/v1/cursos").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/v1/certificados/verificar/**").permitAll()

    // Swagger y OPTIONS
    .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

    // Todo lo demás con JWT
    .anyRequest().authenticated()
)


        .httpBasic(AbstractHttpConfigurer::disable)
        .userDetailsService(userDetailsService);

    http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
}


    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }
}
