package com.cursosonline.cursosonlinejs.Repositorios;

import com.cursosonline.cursosonlinejs.Entidades.SolicitudReintentoModulo;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SolicitudReintentoModuloRepositorio
        extends MongoRepository<SolicitudReintentoModulo, String> {

    boolean existsByIdCursoAndIdModuloAndIdEstudianteAndEstado(
            String idCurso,
            String idModulo,
            String idEstudiante,
            SolicitudReintentoModulo.Estado estado
    );

    List<SolicitudReintentoModulo> findByIdEstudianteOrderByCreatedAtDesc(String idEstudiante);

    List<SolicitudReintentoModulo> findByIdCursoOrderByCreatedAtDesc(String idCurso);
}
