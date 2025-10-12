package com.cursosonline.cursosonlinejs.Servicios;

import com.cursosonline.cursosonlinejs.Entidades.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Collections;
import java.util.Date;
import java.util.UUID;
import java.util.function.Function;

@Service
public class JWTService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.issuer:cursosonline-api}")
    private String issuer;

    @Value("${jwt.access.ttl.seconds:1800}")
    private long accessTtlSeconds;

    public String generateToken(Usuario u) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(u.getEmail())
                .setId(UUID.randomUUID().toString())
                .setIssuer(issuer)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(accessTtlSeconds)))
                .claim("uid", u.getId())
                .claim("roles", Collections.singletonList(normalizeRole(u.getRol())))
                .signWith(signingKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public long getAccessTokenTtlSeconds() {
        return accessTtlSeconds;
    }

    public String extractSubject(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parser()
                .setSigningKey(signingKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return resolver.apply(claims);
    }

    public boolean validarToken(String token, String expectedEmail) {
        try {
            Claims c = Jwts.parser()
                    .setSigningKey(signingKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            Date exp = c.getExpiration();
            if (exp == null || exp.before(new Date())) return false;

            String sub = c.getSubject();
            return expectedEmail == null || (sub != null && sub.equalsIgnoreCase(expectedEmail));
        } catch (Exception e) {
            return false;
        }
    }

    private Key signingKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private String normalizeRole(String rol) {
        if (rol == null || rol.isBlank()) return "ROLE_USER";
        String r = rol.trim().toUpperCase();
        return r.startsWith("ROLE_") ? r : "ROLE_" + r;
    }
}
