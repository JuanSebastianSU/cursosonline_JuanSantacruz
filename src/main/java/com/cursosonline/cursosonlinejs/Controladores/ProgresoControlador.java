package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.DTO.CursoProgresoDTO;
import com.cursosonline.cursosonlinejs.Repositorios.UsuarioRepositorio;
import com.cursosonline.cursosonlinejs.Servicios.ProgresoCursoServicio;
import com.cursosonline.cursosonlinejs.Servicios.InscripcionServicio;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
public class ProgresoControlador {

    private final ProgresoCursoServicio progresoCursoServicio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final InscripcionServicio inscripcionServicio;

    public ProgresoControlador(ProgresoCursoServicio progresoCursoServicio,
                               UsuarioRepositorio usuarioRepositorio,
                               InscripcionServicio inscripcionServicio) {
        this.progresoCursoServicio = progresoCursoServicio;
        this.usuarioRepositorio = usuarioRepositorio;
        this.inscripcionServicio = inscripcionServicio;
    }

    private String currentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return null;
        return usuarioRepositorio.findByEmail(auth.getName())
                .map(u -> u.getId())
                .orElse(null);
    }

    /**
     * Progreso del estudiante logueado en un curso.
     * Recalcula y actualiza la inscripción.
     */
    @GetMapping("/cursos/{idCurso}/mi-progreso")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> miProgreso(@PathVariable String idCurso) {
        String userId = currentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body("No autenticado.");
        }

        // Validamos que tenga inscripción en ese curso
        var inscOpt = inscripcionServicio.obtenerPorCursoYEstudiante(idCurso, userId);
        if (inscOpt.isEmpty()) {
            return ResponseEntity.status(403).body("No estás inscrito en este curso.");
        }

        CursoProgresoDTO dto = progresoCursoServicio
                .calcularProgresoCurso(idCurso, userId, true);

        return ResponseEntity.ok(dto);
    }

    /**
     * Permite a ADMIN / INSTRUCTOR ver el progreso de un estudiante específico
     * sin modificar la inscripción (sólo consulta).
     */
    @GetMapping("/cursos/{idCurso}/estudiantes/{idEstudiante}/progreso")
    @PreAuthorize("hasRole('ADMIN') or @cursoPermisos.esInstructorDelCurso(#idCurso)")
    public ResponseEntity<?> progresoDeEstudiante(@PathVariable String idCurso,
                                                  @PathVariable String idEstudiante) {

        CursoProgresoDTO dto = progresoCursoServicio
                .calcularProgresoCurso(idCurso, idEstudiante, false);

        return ResponseEntity.ok(dto);
    }
}
