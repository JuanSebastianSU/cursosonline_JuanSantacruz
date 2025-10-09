package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.DTO.LoginRequest;
import com.cursosonline.cursosonlinejs.DTO.RegistroRequest;
import com.cursosonline.cursosonlinejs.DTO.JwtResponse;
import com.cursosonline.cursosonlinejs.Entidades.TipoUsuario;
import com.cursosonline.cursosonlinejs.Entidades.Usuario;
import com.cursosonline.cursosonlinejs.Repositorios.UsuarioRepositorio;
import com.cursosonline.cursosonlinejs.Servicios.JWTService;
import com.cursosonline.cursosonlinejs.Servicios.TipoUsuarioServicio;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:9090")
public class AuthControlador {

    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioRepositorio usuarioRepositorio;
    private final JWTService jwtService;
    private final TipoUsuarioServicio tipoUsuarioServicio;

    public AuthControlador(AuthenticationManager authenticationManager,
                           PasswordEncoder passwordEncoder,
                           UsuarioRepositorio usuarioRepositorio,
                           JWTService jwtService,
                           TipoUsuarioServicio tipoUsuarioServicio) {
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
        this.usuarioRepositorio = usuarioRepositorio;
        this.jwtService = jwtService;
        this.tipoUsuarioServicio = tipoUsuarioServicio;
    }

    // --- Configurables por properties (con valores por defecto) ---
    @Value("${security.auth.max-failed-attempts:5}")
    private int maxFailedAttempts;

    @Value("${security.auth.lock-minutes:15}")
    private long lockMinutes;

    // ---------- REGISTER (PÚBLICO) ----------
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid RegistroRequest req) {
        String email = normalizeEmail(req.email());

        // 1) evitar duplicados
        if (usuarioRepositorio.findByEmail(email).isPresent()) {
            return ResponseEntity.status(409).body(Map.of(
                    "error", "EMAIL_IN_USE",
                    "message", "Ya existe un usuario con ese email"
            ));
        }

        // 2) determinar el tipo por defecto desde Mongo
        String rolPorDefecto = tipoUsuarioServicio.getDefault()
                .map(TipoUsuario::getNombre)
                .orElseGet(() -> tipoUsuarioServicio.findByNombreIgnoreCase("Usuario")
                        .map(TipoUsuario::getNombre)
                        .orElse("USUARIO"));

        // 3) crear usuario
        var u = new Usuario();
        u.setNombre(req.nombre().trim());
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(req.password()));
        u.setRol(rolPorDefecto);            // ← guarda el nombre exacto del TipoUsuario
        u.setEstado("ACTIVO");
        u.setEmailVerified(false);
        u.setFailedLoginAttempts(0);

        usuarioRepositorio.save(u);

        // 4) devolver token igual que /login
        String token = jwtService.generateToken(u);
        JwtResponse resp = new JwtResponse(
                token,
                "Bearer",
                u.getNombre(),
                u.getId(),
                List.of(asAuthority(u.getRol())),   // ["ROLE_USUARIO"] por ejemplo
                jwtService.getAccessTokenTtlSeconds()
        );
        return ResponseEntity.created(URI.create("/api/users/" + u.getId()))
                .body(resp);
    }

    // ---------- LOGIN (PÚBLICO) ----------
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid LoginRequest request) {
        final String emailNorm = normalizeEmail(request.getEmail());
        final Instant now = Instant.now();

        // Buscamos usuario
        Usuario u = usuarioRepositorio.findByEmail(emailNorm).orElse(null);

        // Si está bloqueado y aún no expira, responder 423
        if (u != null && u.getLockedUntil() != null && u.getLockedUntil().isAfter(now)) {
            long secs = Duration.between(now, u.getLockedUntil()).toSeconds();
            return ResponseEntity.status(HttpStatus.LOCKED)
                    .body(Map.of(
                            "error", "ACCOUNT_LOCKED",
                            "message", "Cuenta bloqueada temporalmente. Intenta más tarde.",
                            "retryAfterSeconds", secs
                    ));
        }

        // Si el bloqueo expiró, limpiar bloqueo y contador
        if (u != null && u.getLockedUntil() != null && !u.getLockedUntil().isAfter(now)) {
            u.setLockedUntil(null);
            u.setFailedLoginAttempts(0);
            usuarioRepositorio.save(u);
        }

        try {
            // Autenticar usando email normalizado
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(emailNorm, request.getPassword())
            );

            if (u == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "UNAUTHORIZED", "message", "Credenciales inválidas"));
            }
            if (!"ACTIVO".equalsIgnoreCase(u.getEstado())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "ACCOUNT_INACTIVE", "message", "La cuenta no está activa"));
            }

            // Actualiza metadatos de acceso
            u.setLastLoginAt(now);
            u.setFailedLoginAttempts(0);
            u.setLockedUntil(null);
            usuarioRepositorio.save(u);

            String token = jwtService.generateToken(u);
            JwtResponse resp = new JwtResponse(
                    token,
                    "Bearer",
                    u.getNombre(),
                    u.getId(),
                    List.of(asAuthority(u.getRol())),   // ["ROLE_ADMIN"] | ["ROLE_INSTRUCTOR"] | ["ROLE_USUARIO"]
                    jwtService.getAccessTokenTtlSeconds()
            );
            return ResponseEntity.ok(resp);

        } catch (BadCredentialsException e) {
            // Credenciales inválidas: incrementa contador y bloquea si supera umbral
            if (u != null) {
                int attempts = (u.getFailedLoginAttempts() == null ? 0 : u.getFailedLoginAttempts()) + 1;
                u.setFailedLoginAttempts(attempts);
                if (attempts >= maxFailedAttempts) {
                    u.setLockedUntil(now.plus(Duration.ofMinutes(lockMinutes)));
                }
                usuarioRepositorio.save(u);
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "UNAUTHORIZED", "message", "Credenciales inválidas"));

        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "UNAUTHORIZED", "message", "No se pudo autenticar"));
        }
    }

    /* ================== helpers ================== */
    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    /** Convierte "Usuario" -> "ROLE_USUARIO", "Instructor" -> "ROLE_INSTRUCTOR", "ADMIN" -> "ROLE_ADMIN" */
    private String asAuthority(String rolNombre) {
        String base = (rolNombre == null || rolNombre.isBlank()) ? "USUARIO" : rolNombre.trim();
        return "ROLE_" + base.toUpperCase().replace(' ', '_');
    }
}
