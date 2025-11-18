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
    private final InscripcionServicio inscripcionServicio;

    private final SecureRandom rnd = new SecureRandom();
    private final HexFormat hex = HexFormat.of().withUpperCase();

    public CertificadoServicio(CertificadoRepositorio repo,
                               InscripcionRepositorio inscRepo,
                               CursoRepositorio cursoRepo,
                               UsuarioRepositorio usuarioRepo,
                               InscripcionServicio inscripcionServicio) {
        this.repo = repo;
        this.inscRepo = inscRepo;
        this.cursoRepo = cursoRepo;
        this.usuarioRepo = usuarioRepo;
        this.inscripcionServicio = inscripcionServicio;
    }

    /**
     * Regla actual de elegibilidad:
     * - Inscripción COMPLETADA o aprobadoFinal = true.
     * Más adelante aquí podemos enganchar la lógica de módulos/lecciones.
     */
    public boolean esElegible(String idCurso, String idEstudiante) {
        return inscRepo.findByIdCursoAndIdEstudiante(idCurso, idEstudiante)
                .map(i -> i.getEstado() == Inscripcion.EstadoInscripcion.COMPLETADA
                        || Boolean.TRUE.equals(i.getAprobadoFinal()))
                .orElse(false);
    }

    /**
     * Emisión normal (automática), con validación de elegibilidad.
     * Úsalo para:
     * - Emisión cuando el sistema detecta que el curso está aprobado.
     * - Emisión cuando el instructor pulsa un botón "Emitir certificado" normal.
     */
    public Optional<Certificado> emitir(String idCurso, String idEstudiante) {
        if (!esElegible(idCurso, idEstudiante)) {
            throw new IllegalStateException("El estudiante no es elegible para certificado en este curso.");
        }
        if (repo.existsByIdCursoAndIdEstudiante(idCurso, idEstudiante)) {
            return Optional.empty();
        }

        Certificado c = crearCertificadoBasico(idCurso, idEstudiante);
        Certificado guardado = repo.save(c);

        // Vincular en la inscripción
        inscripcionServicio.vincularCertificado(idCurso, idEstudiante, guardado.getId());

        return Optional.of(guardado);
    }

    /**
     * Emisión manual (sin comprobar elegibilidad).
     * Úsalo para:
     * - Casos especiales donde el ADMIN / INSTRUCTOR decide otorgar el certificado
     *   aunque el sistema no marque al estudiante como elegible.
     */
    public Optional<Certificado> emitirManual(String idCurso, String idEstudiante) {
        if (repo.existsByIdCursoAndIdEstudiante(idCurso, idEstudiante)) {
            return Optional.empty();
        }

        Certificado c = crearCertificadoBasico(idCurso, idEstudiante);
        Certificado guardado = repo.save(c);

        // También lo vinculamos a la inscripción para mantener coherencia
        inscripcionServicio.vincularCertificado(idCurso, idEstudiante, guardado.getId());

        return Optional.of(guardado);
    }

    // ----------------- CONSULTAS / GESTIÓN -----------------

    public Optional<Certificado> buscarPorId(String id) {
        return repo.findById(id);
    }

    public Optional<Certificado> buscarPorCodigo(String codigo) {
        return repo.findByCodigoVerificacion(codigo);
    }

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

    public void eliminar(String id) {
        repo.deleteById(id);
    }

    // ----------------- HELPERS PRIVADOS -----------------

    private Certificado crearCertificadoBasico(String idCurso, String idEstudiante) {
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

        return c;
    }

    private String generarCodigoUnico() {
        for (int i = 0; i < 5; i++) {
            byte[] buf = new byte[16];
            rnd.nextBytes(buf);
            String code = hex.formatHex(buf);
            if (repo.findByCodigoVerificacion(code).isEmpty()) return code;
        }
        return hex.formatHex((Instant.now().toString() + rnd.nextLong()).getBytes());
    }

    private String obtenerNombreVisible(Usuario u) {
        if (u == null) return null;
        if (u.getNombre() != null && !u.getNombre().isBlank()) return u.getNombre().trim();
        if (u.getEmail() != null && !u.getEmail().isBlank()) return u.getEmail().trim();
        return "Usuario " + u.getId();
    }
}
