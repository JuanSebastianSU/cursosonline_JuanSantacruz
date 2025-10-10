package com.cursosonline.cursosonlinejs.Seguridad;

import com.cursosonline.cursosonlinejs.Entidades.Inscripcion;
import com.cursosonline.cursosonlinejs.Repositorios.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component("evalPermisos")
public class EvaluacionPermisos {

    private final UsuarioRepositorio usuarioRepo;
    private final LeccionRepositorio leccionRepo;
    private final ModuloRepositorio moduloRepo;
    private final CursoRepositorio cursoRepo;
    private final InscripcionRepositorio inscripcionRepo;

    private static final List<Inscripcion.EstadoInscripcion> ESTADOS_CON_ACCESO =
            List.of(Inscripcion.EstadoInscripcion.ACTIVA);

    public EvaluacionPermisos(UsuarioRepositorio usuarioRepo,
                              LeccionRepositorio leccionRepo,
                              ModuloRepositorio moduloRepo,
                              CursoRepositorio cursoRepo,
                              InscripcionRepositorio inscripcionRepo) {
        this.usuarioRepo = usuarioRepo;
        this.leccionRepo = leccionRepo;
        this.moduloRepo = moduloRepo;
        this.cursoRepo = cursoRepo;
        this.inscripcionRepo = inscripcionRepo;
    }

    public boolean esInstructorDeLeccion(String idLeccion) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return false;

        var optUser = usuarioRepo.findByEmail(auth.getName());
        if (optUser.isEmpty()) return false;
        var user = optUser.get();

        var optLeccion = leccionRepo.findById(idLeccion);
        if (optLeccion.isEmpty()) return false;

        var optModulo = moduloRepo.findById(optLeccion.get().getIdModulo());
        if (optModulo.isEmpty()) return false;

        var optCurso = cursoRepo.findById(optModulo.get().getIdCurso());
        return optCurso.map(c -> user.getId().equals(c.getIdInstructor())).orElse(false);
    }

    public boolean estaInscritoEnCursoDeLeccion(String idLeccion) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return false;

        var optUser = usuarioRepo.findByEmail(auth.getName());
        if (optUser.isEmpty()) return false;
        var user = optUser.get();

        var optLeccion = leccionRepo.findById(idLeccion);
        if (optLeccion.isEmpty()) return false;

        var optModulo = moduloRepo.findById(optLeccion.get().getIdModulo());
        if (optModulo.isEmpty()) return false;

        String idCurso = optModulo.get().getIdCurso();
        return inscripcionRepo.existsByIdCursoAndIdEstudianteAndEstadoIn(
                idCurso, user.getId(), ESTADOS_CON_ACCESO
        );
    }
}
