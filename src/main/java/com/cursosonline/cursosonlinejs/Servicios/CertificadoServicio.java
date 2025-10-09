// src/main/java/com/cursosonline/cursosonlinejs/Servicios/CertificadoServicio.java
package com.cursosonline.cursosonlinejs.Servicios;

import com.cursosonline.cursosonlinejs.Entidades.Certificado;
import com.cursosonline.cursosonlinejs.Entidades.Curso;
import com.cursosonline.cursosonlinejs.Entidades.Inscripcion;
import com.cursosonline.cursosonlinejs.Entidades.Usuario;
import com.cursosonline.cursosonlinejs.Repositorios.CertificadoRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.CursoRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.InscripcionRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.UsuarioRepositorio;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Service
public class CertificadoServicio {

    private final CertificadoRepositorio repo;
    private final InscripcionRepositorio inscRepo;
    private final CursoRepositorio cursoRepo;
    private final UsuarioRepositorio usuarioRepo;
    private final InscripcionServicio inscripcionServicio; // <-- NUEVO

    private final SecureRandom rnd = new SecureRandom();
    private final HexFormat hex = HexFormat.of().withUpperCase();

    public CertificadoServicio(CertificadoRepositorio repo,
                               InscripcionRepositorio inscRepo,
                               CursoRepositorio cursoRepo,
                               UsuarioRepositorio usuarioRepo,
                               InscripcionServicio inscripcionServicio) { // <-- NUEVO
        this.repo = repo;
        this.inscRepo = inscRepo;
        this.cursoRepo = cursoRepo;
        this.usuarioRepo = usuarioRepo;
        this.inscripcionServicio = inscripcionServicio; // <-- NUEVO
    }
    

    /** Elegible: inscripción COMPLETADA o aprobadoFinal = true */
    public boolean esElegible(String idCurso, String idEstudiante) {
        return inscRepo.findByIdCursoAndIdEstudiante(idCurso, idEstudiante)
                .map(i -> i.getEstado() == Inscripcion.EstadoInscripcion.COMPLETADA
                        || Boolean.TRUE.equals(i.getAprobadoFinal()))
                .orElse(false);
    }

   /** Emite certificado con snapshots y enlaza en la inscripción. */
    public Optional<Certificado> emitir(String idCurso, String idEstudiante) {
        if (!esElegible(idCurso, idEstudiante)) {
            throw new IllegalStateException("El estudiante no es elegible para certificado en este curso.");
        }
        if (repo.existsByIdCursoAndIdEstudiante(idCurso, idEstudiante)) {
            return Optional.empty();
        }

        Certificado c = new Certificado();
        c.setIdCurso(idCurso);
        c.setIdEstudiante(idEstudiante);
        c.setEstado(Certificado.Estado.EMITIDO);
        c.setEmitidoEn(Instant.now());
        c.setCodigoVerificacion(generarCodigoUnico());

        cursoRepo.findById(idCurso).ifPresent(cur -> {
            c.setCursoTitulo(cur.getTitulo());
            if (cur.getIdInstructor() != null) {
                usuarioRepo.findById(cur.getIdInstructor())
                        .ifPresent(instr -> c.setInstructorNombre(obtenerNombreVisible(instr)));
            }
        });
        usuarioRepo.findById(idEstudiante)
                .ifPresent(est -> c.setEstudianteNombre(obtenerNombreVisible(est)));

        Certificado guardado = repo.save(c);

        // === enlace en inscripción ===
        inscripcionServicio.vincularCertificado(idCurso, idEstudiante, guardado.getId());

        return Optional.of(guardado);
    }

    public Optional<Certificado> buscarPorId(String id) { return repo.findById(id); }
    public Optional<Certificado> buscarPorCodigo(String codigo) { return repo.findByCodigoVerificacion(codigo); }

    public List<Certificado> listarPorCurso(String idCurso) {
        return repo.findByIdCursoOrderByCreatedAtDesc(idCurso);
    }

    public List<Certificado> listarPorEstudiante(String idEstudiante) {
        return repo.findByIdEstudianteOrderByCreatedAtDesc(idEstudiante);
    }

    public Optional<Certificado> revocar(String id) {
        return repo.findById(id).map(c -> {
            c.setEstado(Certificado.Estado.REVOCADO);
            c.setRevocadoAt(Instant.now());
            return repo.save(c);
        });
    }

    public void eliminar(String id) { repo.deleteById(id); }

    private String generarCodigoUnico() {
        for (int i = 0; i < 5; i++) {
            byte[] buf = new byte[16];
            rnd.nextBytes(buf);
            String code = hex.formatHex(buf);
            if (repo.findByCodigoVerificacion(code).isEmpty()) return code;
        }
        return hex.formatHex((Instant.now().toString() + rnd.nextLong()).getBytes());
    }

    /** Helper para formatear nombre visible (prioriza nombre completo) */
    private String obtenerNombreVisible(Usuario u) {
        if (u == null) return null;
        if (u.getNombre() != null && !u.getNombre().isBlank()) return u.getNombre().trim();
        if (u.getNombre() != null && !u.getNombre().isBlank()) return u.getNombre().trim();
        if (u.getEmail() != null && !u.getEmail().isBlank()) return u.getEmail().trim();
        return "Usuario " + u.getId();
    }
}
