package com.cursosonline.cursosonlinejs.Seguridad;

import com.cursosonline.cursosonlinejs.Repositorios.CursoRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.InscripcionRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.UsuarioRepositorio;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("inscPermisos")
public class InscPermisos {

    private final UsuarioRepositorio usuarioRepo;
    private final CursoRepositorio cursoRepo;
    private final InscripcionRepositorio inscripcionRepo;

    public InscPermisos(UsuarioRepositorio usuarioRepo,
                        CursoRepositorio cursoRepo,
                        InscripcionRepositorio inscripcionRepo) {
        this.usuarioRepo = usuarioRepo;
        this.cursoRepo = cursoRepo;
        this.inscripcionRepo = inscripcionRepo;
    }

    public boolean esInstructorDelCurso(String idCurso) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return false;

        var user = usuarioRepo.findByEmail(auth.getName()).orElse(null);
        if (user == null) return false;

        return cursoRepo.findById(idCurso)
                .map(c -> user.getId().equals(c.getIdInstructor()))
                .orElse(false);
    }

    public boolean esInscripcionPropia(String idInscripcion) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return false;

        var user = usuarioRepo.findByEmail(auth.getName()).orElse(null);
        if (user == null) return false;

        return inscripcionRepo.findById(idInscripcion)
                .map(i -> user.getId().equals(i.getIdEstudiante()))
                .orElse(false);
    }
}
