// src/main/java/com/cursosonline/cursosonlinejs/Seguridad/CursoPermisos.java
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

    /** ¿El auth es el instructor y el curso NO está PUBLICADO? */
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

    /** ¿El auth es el dueño (instructor) del curso? */
    public boolean esDueno(String idCurso) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return false;

        var u = usuarioRepo.findByEmail(auth.getName()).orElse(null);
        if (u == null) return false;

        var c = cursoRepo.findById(idCurso).orElse(null);
        if (c == null) return false;

        return u.getId().equals(c.getIdInstructor());
    }

    /** Variante para operaciones que reciben idModulo */
    public boolean cursoEditablePorAutorDesdeModulo(String idModulo) {
        var m = moduloRepo.findById(idModulo).orElse(null);
        if (m == null) return false;
        return cursoEditablePorAutor(m.getIdCurso());
    }

    /** Variante para operaciones que reciben idLeccion */
    public boolean cursoEditablePorAutorDesdeLeccion(String idLeccion) {
        var l = leccionRepo.findById(idLeccion).orElse(null);
        if (l == null) return false;
        return cursoEditablePorAutor(l.getIdCurso());
    }
}
