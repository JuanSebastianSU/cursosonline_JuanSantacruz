package com.cursosonline.cursosonlinejs.Servicios;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.cursosonline.cursosonlinejs.Entidades.Curso;
import com.cursosonline.cursosonlinejs.Entidades.Usuario;
import com.cursosonline.cursosonlinejs.Repositorios.CursoRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.UsuarioRepositorio;

@Service
public class UsuarioServicio {

    private final UsuarioRepositorio usuarioRepositorio;
    private final PasswordEncoder passwordEncoder;
    private final CursoRepositorio cursoRepositorio;

    public UsuarioServicio(UsuarioRepositorio usuarioRepositorio,
                           PasswordEncoder passwordEncoder,
                           CursoRepositorio cursoRepositorio) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.passwordEncoder = passwordEncoder;
        this.cursoRepositorio = cursoRepositorio;
    }

    public Usuario guardar(Usuario usuario) {
        if (usuario.getEstado() == null || usuario.getEstado().isBlank()) {
            usuario.setEstado("ACTIVO");
        }
        return usuarioRepositorio.save(usuario);
    }

    public List<Usuario> listarTodos() { 
        return usuarioRepositorio.findAll(); 
    }

    public Optional<Usuario> obtenerPorId(String id) { 
        return usuarioRepositorio.findById(id); 
    }

    public Optional<Usuario> actualizar(String id, Usuario cambios) {
        if (cambios.getRol() != null) throw new IllegalArgumentException("ROL_UPDATE_NOT_ALLOWED");
        return usuarioRepositorio.findById(id).map(actual -> {
            if (cambios.getNombre() != null && !cambios.getNombre().isBlank()) {
                actual.setNombre(cambios.getNombre().trim());
            }
            if (cambios.getEstado() != null && !cambios.getEstado().isBlank()) {
                actual.setEstado(cambios.getEstado().trim());
            }
            if (cambios.getPassword() != null && !cambios.getPassword().isBlank()) {
                actual.setPassword(passwordEncoder.encode(cambios.getPassword()));
                actual.setPasswordUpdatedAt(Instant.now());
            }
            if (actual.getEstado() == null || actual.getEstado().isBlank()) {
                actual.setEstado("ACTIVO");
            }
            return usuarioRepositorio.save(actual);
        });
    }

    public Optional<Usuario> patch(String id, Usuario cambios) {
        if (cambios.getRol() != null) throw new IllegalArgumentException("ROL_UPDATE_NOT_ALLOWED");
        return usuarioRepositorio.findById(id).map(actual -> {
            if (cambios.getNombre() != null) {
                actual.setNombre(cambios.getNombre() == null ? null : cambios.getNombre().trim());
            }
            if (cambios.getEstado() != null) {
                String est = cambios.getEstado() == null ? null : cambios.getEstado().trim();
                if (est != null && !est.isBlank()) actual.setEstado(est);
            }
            if (cambios.getPassword() != null && !cambios.getPassword().isBlank()) {
                actual.setPassword(passwordEncoder.encode(cambios.getPassword()));
                actual.setPasswordUpdatedAt(Instant.now());
            }
            if (actual.getEstado() == null || actual.getEstado().isBlank()) {
                actual.setEstado("ACTIVO");
            }
            return usuarioRepositorio.save(actual);
        });
    }

    public boolean cambiarEstado(String id, String nuevoEstado) {
        if (nuevoEstado == null || nuevoEstado.isBlank()) return false;
        String val = nuevoEstado.trim().toUpperCase();
        if (!val.equals("ACTIVO") && !val.equals("INACTIVO") && !val.equals("SUSPENDIDO")) {
            throw new IllegalArgumentException("INVALID_ESTADO");
        }
        return usuarioRepositorio.findById(id).map(u -> {
            u.setEstado(val);
            usuarioRepositorio.save(u);
            return true;
        }).orElse(false);
    }

    public boolean actualizarPassword(String id, String plainPassword) {
        if (plainPassword == null || plainPassword.isBlank()) {
            throw new IllegalArgumentException("PASSWORD_REQUIRED");
        }
        return usuarioRepositorio.findById(id).map(u -> {
            u.setPassword(passwordEncoder.encode(plainPassword));
            u.setPasswordUpdatedAt(Instant.now());
            usuarioRepositorio.save(u);
            return true;
        }).orElse(false);
    }

    public boolean eliminar(String id) {
        if (!usuarioRepositorio.existsById(id)) return false;
        usuarioRepositorio.deleteById(id);
        return true;
    }

    public void syncCursosDelInstructor(String userId) {
        var cursos = cursoRepositorio.findByIdInstructorOrderByCreatedAtAsc(userId);
        var resumen = cursos.stream().map(this::toResumen).collect(Collectors.toList());
        usuarioRepositorio.findById(userId).ifPresent(u -> {
            u.setCursos(resumen);
            usuarioRepositorio.save(u);
        });
    }

    public void reflejarCambioTituloCurso(String cursoId) {
        cursoRepositorio.findById(cursoId).ifPresent(curso -> {
            var ownerId = curso.getIdInstructor();
            if (ownerId == null) return;
            usuarioRepositorio.findById(ownerId).ifPresent(u -> {
                if (u.getCursos() == null) return;
                boolean changed = false;
                for (var ref : u.getCursos()) {
                    if (cursoId.equals(ref.getId())) {
                        ref.setTitulo(curso.getTitulo());
                        changed = true;
                        break;
                    }
                }
                if (changed) usuarioRepositorio.save(u);
            });
        });
    }

    public void reflejarEliminacionCurso(String cursoId) {
        cursoRepositorio.findById(cursoId).ifPresent(curso -> {
            var ownerId = curso.getIdInstructor();
            if (ownerId == null) return;
            usuarioRepositorio.findById(ownerId).ifPresent(u -> {
                if (u.getCursos() == null) return;
                var nueva = u.getCursos().stream()
                        .filter(ref -> !cursoId.equals(ref.getId()))
                        .collect(Collectors.toList());
                u.setCursos(nueva);
                usuarioRepositorio.save(u);
            });
        });
    }

    private Usuario.CursoResumen toResumen(Curso c) {
        var r = new Usuario.CursoResumen();
        r.setId(c.getId());
        r.setTitulo(c.getTitulo());
        return r;
    }
}
