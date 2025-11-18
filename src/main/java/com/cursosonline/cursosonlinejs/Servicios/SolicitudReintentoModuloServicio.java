package com.cursosonline.cursosonlinejs.Servicios;

import com.cursosonline.cursosonlinejs.Entidades.SolicitudReintentoModulo;
import com.cursosonline.cursosonlinejs.Repositorios.SolicitudReintentoModuloRepositorio;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SolicitudReintentoModuloServicio {

    private final SolicitudReintentoModuloRepositorio repo;

    public SolicitudReintentoModuloServicio(SolicitudReintentoModuloRepositorio repo) {
        this.repo = repo;
    }

    /**
     * Crea una nueva solicitud de reintento para un módulo.
     * Lanza IllegalStateException si ya existe una solicitud PENDIENTE
     * para ese curso/módulo/estudiante.
     */
    public SolicitudReintentoModulo crearSolicitud(
            String idCurso,
            String idModulo,
            String idEstudiante,
            String motivo
    ) {
        boolean yaPendiente = repo.existsByIdCursoAndIdModuloAndIdEstudianteAndEstado(
                idCurso,
                idModulo,
                idEstudiante,
                SolicitudReintentoModulo.Estado.PENDIENTE
        );
        if (yaPendiente) {
            throw new IllegalStateException(
                    "Ya tienes una solicitud de reintento pendiente para este módulo."
            );
        }

        SolicitudReintentoModulo s = new SolicitudReintentoModulo();
        s.setIdCurso(idCurso);
        s.setIdModulo(idModulo);
        s.setIdEstudiante(idEstudiante);
        s.setEstado(SolicitudReintentoModulo.Estado.PENDIENTE);
        if (motivo != null && !motivo.isBlank()) {
            s.setMotivo(motivo.trim());
        }

        return repo.save(s);
    }

    public List<SolicitudReintentoModulo> listarPorEstudiante(String idEstudiante) {
        return repo.findByIdEstudianteOrderByCreatedAtDesc(idEstudiante);
    }

    public List<SolicitudReintentoModulo> listarPorCurso(String idCurso) {
        return repo.findByIdCursoOrderByCreatedAtDesc(idCurso);
    }
}
