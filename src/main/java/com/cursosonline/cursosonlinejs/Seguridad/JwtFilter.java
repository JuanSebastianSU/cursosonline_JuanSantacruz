package com.cursosonline.cursosonlinejs.Seguridad;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.cursosonline.cursosonlinejs.Servicios.CustomUserDetailServicio;
import com.cursosonline.cursosonlinejs.Servicios.JWTService;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JWTService jwtService;
    private final CustomUserDetailServicio userDetailsService;

    public JwtFilter(JWTService jwtService, CustomUserDetailServicio userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String p = request.getServletPath();
        return
                // 🔓 Endpoints de autenticación
                p.startsWith("/api/auth/") ||

                // 🔓 Swagger / OpenAPI
                p.startsWith("/v3/api-docs") ||
                p.startsWith("/swagger-ui") ||
                "/swagger-ui.html".equals(p) ||

                // 🔓 Preflight CORS
                "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {

        final String auth = req.getHeader("Authorization");

        // Si no hay token Bearer, dejar seguir y que Spring Security decida
        if (!StringUtils.hasText(auth) || !auth.startsWith("Bearer ")) {
            chain.doFilter(req, res);
            return;
        }

        final String token = auth.substring(7);

        try {
            final String username = jwtService.extractSubject(token);
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails ud = userDetailsService.loadUserByUsername(username);
                if (jwtService.validarToken(token, ud.getUsername())) {
                    var at = new UsernamePasswordAuthenticationToken(ud, null, ud.getAuthorities());
                    at.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                    SecurityContextHolder.getContext().setAuthentication(at);
                }
            }
        } catch (io.jsonwebtoken.JwtException e) {
            // puedes loguear si quieres
        } catch (UsernameNotFoundException e) {
            // idem
        }

        chain.doFilter(req, res);
    }
}
