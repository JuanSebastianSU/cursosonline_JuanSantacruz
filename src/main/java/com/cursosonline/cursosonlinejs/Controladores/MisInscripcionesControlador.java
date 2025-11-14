package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.Entidades.Inscripcion;
import com.cursosonline.cursosonlinejs.Servicios.InscripcionServicio;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/mi/inscripciones")

public class MisInscripcionesControlador {

    private final InscripcionServicio inscripcionServicio;

    public MisInscripcionesControlador(InscripcionServicio inscripcionServicio) {
        this.inscripcionServicio = inscripcionServicio;
    }

    @GetMapping(produces = "application/json")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> listar(@RequestParam(required = false) String estado) {
        var me = inscripcionServicio.obtenerIdEstudianteActual();
        if (me.isEmpty()) return ResponseEntity.status(401).body(Map.of("message","No autenticado."));
        List<Inscripcion> data = (estado == null || estado.isBlank())
                ? inscripcionServicio.listarPorEstudiante(me.get())
                : inscripcionServicio.listarPorEstudianteYEstado(me.get(), estado.trim().toLowerCase());
        return ResponseEntity.ok(data);
    }

    @GetMapping(value = "/curso/{idCurso}", produces = "application/json")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> miInscripcionEnCurso(@PathVariable String idCurso) {
        var me = inscripcionServicio.obtenerIdEstudianteActual();
        if (me.isEmpty()) return ResponseEntity.status(401).body(Map.of("message","No autenticado."));
        return inscripcionServicio.obtenerPorCursoYEstudiante(idCurso, me.get())
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
