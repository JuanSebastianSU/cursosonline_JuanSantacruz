package com.cursosonline.cursosonlinejs.Servicios;

import com.cursosonline.cursosonlinejs.Entidades.Usuario;
import com.cursosonline.cursosonlinejs.Repositorios.UsuarioRepositorio;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Set;

@Service
public class CustomUserDetailServicio implements UserDetailsService {

    private final UsuarioRepositorio usuarioRepositorio;

    public CustomUserDetailServicio(UsuarioRepositorio usuarioRepositorio) {
        this.usuarioRepositorio = usuarioRepositorio;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String rawEmail) throws UsernameNotFoundException {
        String email = (rawEmail == null) ? "" : rawEmail.trim().toLowerCase();
        Usuario u = usuarioRepositorio.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + email));

        boolean enabled = u.getEstado() == null || !"SUSPENDIDO".equalsIgnoreCase(u.getEstado());
        boolean accountNonLocked = true;
        boolean accountNonExpired = true;
        boolean credentialsNonExpired = true;

        Collection<? extends GrantedAuthority> authorities = mapearAuthorities(u);

        return new org.springframework.security.core.userdetails.User(
                u.getEmail(),
                u.getPassword(),
                enabled,
                accountNonExpired,
                credentialsNonExpired,
                accountNonLocked,
                authorities
        );
    }

    private Collection<? extends GrantedAuthority> mapearAuthorities(Usuario u) {
        Set<String> roles = new java.util.HashSet<>();
        if (u.getRol() != null && !u.getRol().isBlank()) {
            roles.add(u.getRol()); // guardas "Usuario", "Instructor" o "ADMIN"
        }

        if (roles.isEmpty()) roles.add("Usuario"); // fallback seguro

        return roles.stream()
                .filter(r -> r != null && !r.isBlank())
                .map(r -> r.trim().toUpperCase().replace(' ', '_')) // "Mi Tipo" -> "MI_TIPO"
                .map(r -> r.startsWith("ROLE_") ? r : "ROLE_" + r)   // ROLE_MI_TIPO
                .distinct()
                .map(SimpleGrantedAuthority::new)
                .toList();
    }
}
