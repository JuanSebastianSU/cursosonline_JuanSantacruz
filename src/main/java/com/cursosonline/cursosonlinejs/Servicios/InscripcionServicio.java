// src/main/java/com/cursosonline/cursosonlinejs/Servicios/InscripcionServicio.java
package com.cursosonline.cursosonlinejs.Servicios;

import com.cursosonline.cursosonlinejs.Entidades.Curso;
import com.cursosonline.cursosonlinejs.Entidades.Inscripcion;
import com.cursosonline.cursosonlinejs.Entidades.Inscripcion.EstadoInscripcion;
import com.cursosonline.cursosonlinejs.Repositorios.CursoRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.InscripcionRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.UsuarioRepositorio;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class InscripcionServicio {

    private final InscripcionRepositorio inscripcionRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final CursoRepositorio cursoRepositorio;

    private static final Set<EstadoInscripcion> ESTADOS_VALIDOS =
            EnumSet.allOf(EstadoInscripcion.class);

    // Para evitar duplicados "activos" (acceso o reserva de asiento)
    private static final List<EstadoInscripcion> ESTADOS_ACTIVOS =
            List.of(EstadoInscripcion.ACTIVA, EstadoInscripcion.PENDIENTE_PAGO);

    public InscripcionServicio(InscripcionRepositorio inscripcionRepositorio,
                               UsuarioRepositorio usuarioRepositorio,
                               CursoRepositorio cursoRepositorio) {
        this.inscripcionRepositorio = inscripcionRepositorio;
        this.usuarioRepositorio = usuarioRepositorio;
        this.cursoRepositorio = cursoRepositorio;
    }

    /** ¿Se puede inscribir en el curso? (estado, ventana, cupo) */
    public boolean puedeInscribirse(String idCurso) {
        var c = cursoRepositorio.findById(idCurso).orElse(null);
        if (c == null) return false;

        if (c.getEstado() != Curso.EstadoCurso.PUBLICADO) return false;
        var now = java.time.Instant.now();
        if (c.getEnrollmentOpenAt() != null && now.isBefore(c.getEnrollmentOpenAt())) return false;
        if (c.getEnrollmentCloseAt() != null && now.isAfter(c.getEnrollmentCloseAt())) return false;

        if (c.getCupoMaximo() != null && c.getCupoMaximo() > 0) {
            long inscritos = inscripcionRepositorio.countByIdCursoAndEstado(
                    idCurso, EstadoInscripcion.ACTIVA
            );
            if (inscritos >= c.getCupoMaximo()) return false;
        }
        return true;
    }

    public Optional<String> obtenerIdEstudianteActual() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return Optional.empty();
        return usuarioRepositorio.findByEmail(auth.getName()).map(u -> u.getId());
    }

    public boolean estadoPermitido(EstadoInscripcion estado) {
        return estado != null && ESTADOS_VALIDOS.contains(estado);
    }

    /** ¿Ya hay una inscripción “activa” para ese curso/estudiante? */
    public boolean existeActiva(String idCurso, String idEstudiante) {
        return inscripcionRepositorio.existsByIdCursoAndIdEstudianteAndEstadoIn(
                idCurso, idEstudiante, ESTADOS_ACTIVOS
        );
    }

    public Inscripcion guardar(Inscripcion inscripcion) {
        if (inscripcion.getEstado() == null) {
            inscripcion.setEstado(EstadoInscripcion.PENDIENTE_PAGO);
        }
        return inscripcionRepositorio.save(inscripcion);
    }

    /** Pasa la inscripción a ACTIVA si aún está PENDIENTE_PAGO; devuelve idCurso si hubo cambio. */
    public String activarSiPendientePago(String idInscripcion) {
        return inscripcionRepositorio.findById(idInscripcion).map(insc -> {
            if (insc.getEstado() == EstadoInscripcion.PENDIENTE_PAGO) {
                insc.setEstado(EstadoInscripcion.ACTIVA);
                inscripcionRepositorio.save(insc);
                return insc.getIdCurso();
            }
            return null;
        }).orElse(null);
    }

    public List<Inscripcion> listarPorCurso(String idCurso) {
        return inscripcionRepositorio.findByIdCursoOrderByCreatedAtDesc(idCurso);
    }

    public List<Inscripcion> listarPorCursoYEstado(String idCurso, String estado) {
        EstadoInscripcion e = parseEstado(estado);
        return inscripcionRepositorio.findByIdCursoAndEstadoOrderByCreatedAtDesc(idCurso, e);
    }

    public Optional<Inscripcion> obtenerPorIdYCurso(String id, String idCurso) {
        return inscripcionRepositorio.findByIdAndIdCurso(id, idCurso);
    }

    public Inscripcion actualizarEstado(String id, String nuevoEstado) {
        var insc = inscripcionRepositorio.findById(id).orElseThrow();
        insc.setEstado(parseEstado(nuevoEstado));
        return inscripcionRepositorio.save(insc);
    }

    public List<Inscripcion> listaAll() { return inscripcionRepositorio.findAll(); }
    public Inscripcion listaInscripcion(String id) { return inscripcionRepositorio.findById(id).orElse(null); }
    public void eliminar(String id) { inscripcionRepositorio.deleteById(id); }

    /* -------- Helpers -------- */
    private EstadoInscripcion parseEstado(String raw) {
        if (raw == null) throw new IllegalArgumentException("El estado es obligatorio");
        switch (raw.trim().toLowerCase()) {
            case "pendiente_pago": return EstadoInscripcion.PENDIENTE_PAGO;
            case "activa":         return EstadoInscripcion.ACTIVA;
            case "suspendida":     return EstadoInscripcion.SUSPENDIDA;
            case "completada":     return EstadoInscripcion.COMPLETADA;
            case "cancelada":      return EstadoInscripcion.CANCELADA;
            case "expirada":       return EstadoInscripcion.EXPIRADA;
            case "pagada":         return EstadoInscripcion.ACTIVA; // compat
            default:
                throw new IllegalArgumentException("Estado inválido: " + raw);
        }
    }

    /** Contador público alineado con snapshot (solo ACTIVA). */
    public long contarActivasPorCurso(String idCurso) {
        return inscripcionRepositorio.countByIdCursoAndEstado(idCurso, EstadoInscripcion.ACTIVA);
    }

    public List<Inscripcion> listarPorEstudiante(String idEstudiante) {
        return inscripcionRepositorio.findByIdEstudianteOrderByCreatedAtDesc(idEstudiante);
    }

    public List<Inscripcion> listarPorEstudianteYEstado(String idEstudiante, String estado) {
        var e = parseEstado(estado);
        return inscripcionRepositorio.findByIdEstudianteAndEstadoOrderByCreatedAtDesc(idEstudiante, e);
    }

    public Optional<Inscripcion> obtenerPorCursoYEstudiante(String idCurso, String idEstudiante) {
        return inscripcionRepositorio.findByIdCursoAndIdEstudiante(idCurso, idEstudiante);
    }

    public void vincularCertificado(String idCurso, String idEstudiante, String certificadoId) {
        inscripcionRepositorio.findByIdCursoAndIdEstudiante(idCurso, idEstudiante).ifPresent(insc -> {
            insc.setCertificadoId(certificadoId);
            inscripcionRepositorio.save(insc);
        });
    }

    public void anexarPagoAInscripcion(String idInscripcion, String idPago, boolean principal) {
        inscripcionRepositorio.findById(idInscripcion).ifPresent(insc -> {
            List<String> pagos = insc.getPagoIds();
            if (pagos == null) pagos = new ArrayList<>();
            if (!pagos.contains(idPago)) pagos.add(idPago);
            insc.setPagoIds(pagos);
            if (principal) insc.setIdPago(idPago);
            inscripcionRepositorio.save(insc);
        });
    }
}
