// src/main/java/com/cursosonline/cursosonlinejs/Seguridad/IntentoPermisos.java
package com.cursosonline.cursosonlinejs.Seguridad;

import java.util.List;
import java.util.Optional;

import com.cursosonline.cursosonlinejs.Entidades.Curso;
import com.cursosonline.cursosonlinejs.Entidades.Evaluacion;
import com.cursosonline.cursosonlinejs.Entidades.Leccion;
import com.cursosonline.cursosonlinejs.Entidades.Modulo;
import com.cursosonline.cursosonlinejs.Entidades.Inscripcion;
import com.cursosonline.cursosonlinejs.Repositorios.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("intPermisos")
public class IntentoPermisos {

    private final UsuarioRepositorio usuarioRepo;
    private final EvaluacionRepositorio evaluacionRepo;
    private final LeccionRepositorio leccionRepo;
    private final ModuloRepositorio moduloRepo;
    private final CursoRepositorio cursoRepo;
    private final InscripcionRepositorio inscripcionRepo;
    private final IntentoRepositorio intentoRepo;

    private static final List<Inscripcion.EstadoInscripcion> ESTADOS_CON_ACCESO =
            List.of(Inscripcion.EstadoInscripcion.ACTIVA);

    public IntentoPermisos(UsuarioRepositorio usuarioRepo,
                           EvaluacionRepositorio evaluacionRepo,
                           LeccionRepositorio leccionRepo,
                           ModuloRepositorio moduloRepo,
                           CursoRepositorio cursoRepo,
                           InscripcionRepositorio inscripcionRepo,
                           IntentoRepositorio intentoRepo) {
        this.usuarioRepo = usuarioRepo;
        this.evaluacionRepo = evaluacionRepo;
        this.leccionRepo = leccionRepo;
        this.moduloRepo = moduloRepo;
        this.cursoRepo = cursoRepo;
        this.inscripcionRepo = inscripcionRepo;
        this.intentoRepo = intentoRepo;
    }

    private Optional<String> getUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return Optional.empty();
        return usuarioRepo.findByEmail(auth.getName()).map(u -> u.getId());
    }

    /* ========= VISIBILIDAD / INTERACCIÓN =========
       Reglas para ESTUDIANTES:
       - Curso:        NO ARCHIVADO
       - Módulo:       NO ARCHIVADO
       - Lección:      NO ARCHIVADA
       - Evaluación:   PUBLICADA (no ARCHIVADA)
       Además: debe estar inscrito con acceso (ACTIVA)
    */

    private boolean evaluacionVisibleParaUsuarios(String idEvaluacion) {
        var eval = evaluacionRepo.findById(idEvaluacion).orElse(null);
        if (eval == null) return false;

        // Evaluación debe estar PUBLICADA
        if (eval.getEstado() != Evaluacion.EstadoPublicacion.PUBLICADA) return false;

        // Lección no ARCHIVADA
        Leccion leccion = leccionRepo.findById(eval.getIdLeccion()).orElse(null);
        if (leccion == null || leccion.getEstado() == Leccion.EstadoPublicacion.ARCHIVADO) return false;

        // Módulo no ARCHIVADO
        Modulo modulo = moduloRepo.findById(leccion.getIdModulo()).orElse(null);
        if (modulo == null || modulo.getEstado() == Modulo.EstadoModulo.ARCHIVADO) return false;

        // Curso no ARCHIVADO
        Curso curso = cursoRepo.findById(modulo.getIdCurso()).orElse(null);
        if (curso == null || curso.getEstado() == Curso.EstadoCurso.ARCHIVADO) return false;

        return true;
    }

    /** Instructor del curso al que pertenece la evaluación */
    public boolean esInstructorDeEvaluacion(String idEvaluacion) {
        var uid = getUserId().orElse(null);
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

    /** Estudiante inscrito con acceso + recurso visible (no archivado en la cadena, evaluación publicada) */
    public boolean estudiantePuedeInteractuar(String idEvaluacion) {
        var uid = getUserId().orElse(null);
        if (uid == null) return false;

        var eval = evaluacionRepo.findById(idEvaluacion).orElse(null);
        if (eval == null) return false;

        // visibilidad en cascada
        if (!evaluacionVisibleParaUsuarios(idEvaluacion)) return false;

        // inscripción con acceso
        var leccion = leccionRepo.findById(eval.getIdLeccion()).orElse(null);
        if (leccion == null) return false;
        var modulo = moduloRepo.findById(leccion.getIdModulo()).orElse(null);
        if (modulo == null) return false;
        String cursoId = modulo.getIdCurso();

        return inscripcionRepo.existsByIdCursoAndIdEstudianteAndEstadoIn(cursoId, uid, ESTADOS_CON_ACCESO);
    }

    /** Dueño del intento (estudiante) + visibilidad del recurso de la evaluación del intento */
    public boolean esDuenoDeIntentoConVisibilidad(String idIntento) {
        var uid = getUserId().orElse(null);
        if (uid == null) return false;
        var intento = intentoRepo.findById(idIntento).orElse(null);
        if (intento == null || !uid.equals(intento.getIdEstudiante())) return false;
        // si el recurso ya no es visible (p.ej., archivado), no puede interactuar
        return evaluacionVisibleParaUsuarios(intento.getIdEvaluacion());
    }

    /** Dueño (estudiante) del intento (sin chequear visibilidad) — se usa donde corresponda solo identidad */
    public boolean esDuenoDeIntento(String idIntento) {
        var uid = getUserId().orElse(null);
        if (uid == null) return false;
        var intento = intentoRepo.findById(idIntento).orElse(null);
        return intento != null && uid.equals(intento.getIdEstudiante());
    }

    /** Instructor del curso del intento */
    public boolean esInstructorDeIntento(String idIntento) {
        var intento = intentoRepo.findById(idIntento).orElse(null);
        if (intento == null) return false;
        return esInstructorDeEvaluacion(intento.getIdEvaluacion());
    }
}
