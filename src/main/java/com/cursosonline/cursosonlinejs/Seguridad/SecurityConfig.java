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
            // 1) Recursos estáticos
            .requestMatchers(PathRequest.toStaticResources().atCommonLocations()).permitAll()
            .requestMatchers(
                    "/", "/index.html", "/favicon.ico",
                    "/estilo.css", "/codigo.js",
                    "/uploads/**",        // ✅ carpeta raíz
                    "/uploads/cursos/**", // ✅ subcarpeta de imágenes
                    "/paginas/**"
            ).permitAll()


                // 2) Endpoints públicos
                .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/tipousuario/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/menu").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/cursos").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/certificados/verificar/**").permitAll()

                // 3) Swagger y OPTIONS
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // 4) Todo lo demás requiere JWT
                .anyRequest().authenticated()
            )

            // Desactivar BASIC para que NO salga el popup del navegador
            .httpBasic(AbstractHttpConfigurer::disable)

            // Usar tu UserDetailsService
            .userDetailsService(userDetailsService);

        // Filtro JWT antes del UsernamePasswordAuthenticationFilter
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }
}
