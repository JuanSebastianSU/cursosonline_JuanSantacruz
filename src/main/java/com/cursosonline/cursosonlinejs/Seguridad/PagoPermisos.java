// src/main/java/com/cursosonline/cursosonlinejs/Seguridad/PagoPermisos.java
package com.cursosonline.cursosonlinejs.Seguridad;

import com.cursosonline.cursosonlinejs.Repositorios.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("pagoPermisos")
public class PagoPermisos {

    private final UsuarioRepositorio usuarioRepo;
    private final InscripcionRepositorio inscripcionRepo;
    private final CursoRepositorio cursoRepo;
    private final PagoRepositorio pagoRepo;

    public PagoPermisos(UsuarioRepositorio usuarioRepo,
                        InscripcionRepositorio inscripcionRepo,
                        CursoRepositorio cursoRepo,
                        PagoRepositorio pagoRepo) {
        this.usuarioRepo = usuarioRepo;
        this.inscripcionRepo = inscripcionRepo;
        this.cursoRepo = cursoRepo;
        this.pagoRepo = pagoRepo;
    }

    private String uid() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return null;
        return usuarioRepo.findByEmail(auth.getName()).map(u -> u.getId()).orElse(null);
    }

    public boolean esDuenoDeInscripcion(String idInscripcion) {
        var me = uid();
        if (me == null) return false;
        return inscripcionRepo.findById(idInscripcion)
                .map(i -> me.equals(i.getIdEstudiante()))
                .orElse(false);
    }

    public boolean esDuenoDePago(String idPago) {
        var me = uid();
        if (me == null) return false;
        var pago = pagoRepo.findById(idPago).orElse(null);
        if (pago == null) return false;
        return inscripcionRepo.findById(pago.getIdInscripcion())
                .map(i -> me.equals(i.getIdEstudiante()))
                .orElse(false);
    }

    public boolean esInstructorDeInscripcion(String idInscripcion) {
        var me = uid();
        if (me == null) return false;
        return inscripcionRepo.findById(idInscripcion).flatMap(i ->
                cursoRepo.findById(i.getIdCurso())
        ).map(c -> me.equals(c.getIdInstructor())).orElse(false);
    }

    public boolean esAdmin() {
        var me = uid();
        if (me == null) return false;
        return usuarioRepo.findById(me)
                .map(u -> "ADMIN".equalsIgnoreCase(u.getRol()))
                .orElse(false);
    }
}
