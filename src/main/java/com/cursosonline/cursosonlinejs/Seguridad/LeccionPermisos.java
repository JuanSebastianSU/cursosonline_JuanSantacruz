// src/main/java/com/cursosonline/cursosonlinejs/Seguridad/LeccionPermisos.java
package com.cursosonline.cursosonlinejs.Seguridad;

import com.cursosonline.cursosonlinejs.Entidades.Inscripcion;
import com.cursosonline.cursosonlinejs.Repositorios.CursoRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.ModuloRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.UsuarioRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.InscripcionRepositorio;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component("leccionPermisos")
public class LeccionPermisos {

    private final UsuarioRepositorio usuarioRepo;
    private final ModuloRepositorio moduloRepo;
    private final CursoRepositorio cursoRepo;
    private final InscripcionRepositorio inscripcionRepo;

    // Consideramos “con acceso” a los que estén ACTIVA (ajusta si quieres incluir PENDIENTE_PAGO)
    private static final List<Inscripcion.EstadoInscripcion> ESTADOS_CON_ACCESO =
            List.of(Inscripcion.EstadoInscripcion.ACTIVA);

    public LeccionPermisos(UsuarioRepositorio usuarioRepo,
                           ModuloRepositorio moduloRepo,
                           CursoRepositorio cursoRepo,
                           InscripcionRepositorio inscripcionRepo) {
        this.usuarioRepo = usuarioRepo;
        this.moduloRepo = moduloRepo;
        this.cursoRepo = cursoRepo;
        this.inscripcionRepo = inscripcionRepo;
    }

    /** ¿El autenticado es el instructor (dueño) del curso al que pertenece el módulo? */
    public boolean esInstructorDelModulo(String idModulo) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return false;

        var optUser = usuarioRepo.findByEmail(auth.getName());
        if (optUser.isEmpty()) return false;
        var user = optUser.get();

        var optModulo = moduloRepo.findById(idModulo);
        if (optModulo.isEmpty()) return false;
        String idCurso = optModulo.get().getIdCurso();

        return cursoRepo.findById(idCurso)
                .map(curso -> user.getId().equals(curso.getIdInstructor()))
                .orElse(false);
    }

    /** ¿El autenticado está inscrito (con acceso) en el curso al que pertenece el módulo? */
    public boolean estaInscritoEnCursoDelModulo(String idModulo) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return false;

        var optUser = usuarioRepo.findByEmail(auth.getName());
        if (optUser.isEmpty()) return false;
        var user = optUser.get();

        var optModulo = moduloRepo.findById(idModulo);
        if (optModulo.isEmpty()) return false;
        String idCurso = optModulo.get().getIdCurso();

        return inscripcionRepo.existsByIdCursoAndIdEstudianteAndEstadoIn(
                idCurso, user.getId(), ESTADOS_CON_ACCESO
        );
    }
}
