package com.cursosonline.cursosonlinejs.Seguridad;

import com.cursosonline.cursosonlinejs.Entidades.Curso;
import com.cursosonline.cursosonlinejs.Repositorios.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("cursoPermisos")
public class CursoPermisos {

    private final UsuarioRepositorio usuarioRepo;
    private final CursoRepositorio cursoRepo;
    private final ModuloRepositorio moduloRepo;
    private final LeccionRepositorio leccionRepo;

    public CursoPermisos(UsuarioRepositorio usuarioRepo,
                         CursoRepositorio cursoRepo,
                         ModuloRepositorio moduloRepo,
                         LeccionRepositorio leccionRepo) {
        this.usuarioRepo = usuarioRepo;
        this.cursoRepo = cursoRepo;
        this.moduloRepo = moduloRepo;
        this.leccionRepo = leccionRepo;
    }

    public boolean cursoEditablePorAutor(String idCurso) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return false;

        var u = usuarioRepo.findByEmail(auth.getName()).orElse(null);
        if (u == null) return false;

        var c = cursoRepo.findById(idCurso).orElse(null);
        if (c == null) return false;

        return u.getId().equals(c.getIdInstructor())
                && c.getEstado() != Curso.EstadoCurso.PUBLICADO;
    }

    public boolean esDueno(String idCurso) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return false;

        var u = usuarioRepo.findByEmail(auth.getName()).orElse(null);
        if (u == null) return false;

        var c = cursoRepo.findById(idCurso).orElse(null);
        if (c == null) return false;

        return u.getId().equals(c.getIdInstructor());
    }

    public boolean cursoEditablePorAutorDesdeModulo(String idModulo) {
        var m = moduloRepo.findById(idModulo).orElse(null);
        if (m == null) return false;
        return cursoEditablePorAutor(m.getIdCurso());
    }

    public boolean cursoEditablePorAutorDesdeLeccion(String idLeccion) {
        var l = leccionRepo.findById(idLeccion).orElse(null);
        if (l == null) return false;
        return cursoEditablePorAutor(l.getIdCurso());
    }
}
