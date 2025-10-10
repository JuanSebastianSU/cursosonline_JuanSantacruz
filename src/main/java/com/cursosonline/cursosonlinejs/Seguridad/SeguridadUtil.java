package com.cursosonline.cursosonlinejs.Seguridad;

import com.cursosonline.cursosonlinejs.Repositorios.UsuarioRepositorio;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("seguridadUtil")
public class SeguridadUtil {

    private final UsuarioRepositorio usuarioRepositorio;

    public SeguridadUtil(UsuarioRepositorio usuarioRepositorio) {
        this.usuarioRepositorio = usuarioRepositorio;
    }

    public boolean esMismoUsuario(String idUsuario) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return false;
        String email = auth.getName();
        return usuarioRepositorio.findById(idUsuario)
                .map(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(email))
                .orElse(false);
    }
}
