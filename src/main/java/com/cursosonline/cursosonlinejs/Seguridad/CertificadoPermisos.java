package com.cursosonline.cursosonlinejs.Seguridad;

import com.cursosonline.cursosonlinejs.Entidades.Certificado;
import com.cursosonline.cursosonlinejs.Repositorios.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("certPermisos")
public class CertificadoPermisos {

    private final UsuarioRepositorio usuarioRepo;
    private final CursoRepositorio cursoRepo;
    private final CertificadoRepositorio certRepo;

    public CertificadoPermisos(UsuarioRepositorio usuarioRepo,
                               CursoRepositorio cursoRepo,
                               CertificadoRepositorio certRepo) {
        this.usuarioRepo = usuarioRepo;
        this.cursoRepo = cursoRepo;
        this.certRepo = certRepo;
    }

    private String currentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return null;
        return usuarioRepo.findByEmail(auth.getName()).map(u -> u.getId()).orElse(null);
    }

    private boolean esAdmin(String userId) {
        return usuarioRepo.findById(userId)
                .map(u -> "ADMIN".equalsIgnoreCase(u.getRol()))
                .orElse(false);
    }

    private boolean esInstructor(String userId) {
        return usuarioRepo.findById(userId)
                .map(u -> "INSTRUCTOR".equalsIgnoreCase(u.getRol()))
                .orElse(false);
    }

    public boolean esInstructorDelCurso(String idCurso) {
        String uid = currentUserId();
        if (uid == null || !esInstructor(uid)) return false;
        return cursoRepo.findById(idCurso)
                .map(c -> uid.equals(c.getIdInstructor()))
                .orElse(false);
    }

    public boolean puedeVerCertificado(String idCertificado) {
        String uid = currentUserId();
        if (uid == null) return false;

        var opt = certRepo.findById(idCertificado);
        if (opt.isEmpty()) return false;
        Certificado c = opt.get();

        if (esAdmin(uid)) return true;
        if (uid.equals(c.getIdEstudiante())) return true;

        return cursoRepo.findById(c.getIdCurso())
                .map(cur -> uid.equals(cur.getIdInstructor()))
                .orElse(false);
    }

    public boolean esInstructorDeCertificado(String idCertificado) {
        String uid = currentUserId();
        if (uid == null || !esInstructor(uid)) return false;

        return certRepo.findById(idCertificado).flatMap(c ->
                cursoRepo.findById(c.getIdCurso()).map(cur -> uid.equals(cur.getIdInstructor()))
        ).orElse(false);
    }

    public boolean esMismoEstudiante(String idEstudiante) {
        String uid = currentUserId();
        return uid != null && uid.equals(idEstudiante);
    }

    public boolean esAdminActual() {
        String uid = currentUserId();
        return uid != null && esAdmin(uid);
    }
}
