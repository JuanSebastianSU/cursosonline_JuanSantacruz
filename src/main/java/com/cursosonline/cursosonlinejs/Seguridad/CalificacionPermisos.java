package com.cursosonline.cursosonlinejs.Seguridad;

import com.cursosonline.cursosonlinejs.Repositorios.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("calPermisos")
public class CalificacionPermisos {

    private final UsuarioRepositorio usuarioRepo;
    private final IntentoRepositorio intentoRepo;
    private final EvaluacionRepositorio evaluacionRepo;
    private final LeccionRepositorio leccionRepo;
    private final ModuloRepositorio moduloRepo;
    private final CursoRepositorio cursoRepo;
    private final CalificacionRepositorio calificacionRepo;

    public CalificacionPermisos(UsuarioRepositorio usuarioRepo,
                                IntentoRepositorio intentoRepo,
                                EvaluacionRepositorio evaluacionRepo,
                                LeccionRepositorio leccionRepo,
                                ModuloRepositorio moduloRepo,
                                CursoRepositorio cursoRepo,
                                CalificacionRepositorio calificacionRepo) {
        this.usuarioRepo = usuarioRepo;
        this.intentoRepo = intentoRepo;
        this.evaluacionRepo = evaluacionRepo;
        this.leccionRepo = leccionRepo;
        this.moduloRepo = moduloRepo;
        this.cursoRepo = cursoRepo;
        this.calificacionRepo = calificacionRepo;
    }

    private String getUserIdOrNull() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return null;
        return usuarioRepo.findByEmail(auth.getName()).map(u -> u.getId()).orElse(null);
    }

    public boolean esDuenoDeIntento(String idIntento) {
        var uid = getUserIdOrNull();
        if (uid == null) return false;
        var intento = intentoRepo.findById(idIntento).orElse(null);
        return intento != null && uid.equals(intento.getIdEstudiante());
    }

    public boolean esInstructorDeIntento(String idIntento) {
        var intento = intentoRepo.findById(idIntento).orElse(null);
        if (intento == null) return false;
        return esInstructorDeEvaluacion(intento.getIdEvaluacion());
    }

    public boolean esInstructorDeEvaluacion(String idEvaluacion) {
        var uid = getUserIdOrNull();
        if (uid == null) return false;
        var eval = evaluacionRepo.findById(idEvaluacion).orElse(null);
        if (eval == null) return false;

        var leccion = leccionRepo.findById(eval.getIdLeccion()).orElse(null);
        if (leccion == null) return false;

        var modulo = moduloRepo.findById(leccion.getIdModulo()).orElse(null);
        if (modulo == null) return false;

        var curso = cursoRepo.findById(modulo.getIdCurso()).orElse(null);
        return curso != null && uid.equals(curso.getIdInstructor());
    }

    public boolean esDuenoDeCalificacion(String idCalificacion) {
        var uid = getUserIdOrNull();
        if (uid == null) return false;
        var cal = calificacionRepo.findById(idCalificacion).orElse(null);
        if (cal == null) return false;
        var intento = intentoRepo.findById(cal.getIdIntento()).orElse(null);
        return intento != null && uid.equals(intento.getIdEstudiante());
    }

    public boolean esInstructorDeCalificacion(String idCalificacion) {
        var cal = calificacionRepo.findById(idCalificacion).orElse(null);
        if (cal == null) return false;
        return esInstructorDeEvaluacion(cal.getIdEvaluacion());
    }
}
