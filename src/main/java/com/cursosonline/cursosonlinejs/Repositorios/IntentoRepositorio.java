package com.cursosonline.cursosonlinejs.Repositorios;

import com.cursosonline.cursosonlinejs.Entidades.Intento;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface IntentoRepositorio extends MongoRepository<Intento, String> {

    boolean existsByIdEvaluacionAndIdEstudianteAndEstado(
            String idEvaluacion,
            String idEstudiante,
            Intento.EstadoIntento estado
    );

    List<Intento> findByIdEvaluacionAndIdEstudianteOrderByEnviadoEnDesc(
            String idEvaluacion,
            String idEstudiante
    );

    Optional<Intento> findTopByIdEvaluacionAndIdEstudianteOrderByNroIntentoDesc(
            String idEvaluacion,
            String idEstudiante
    );
    Optional<Intento> findByIdAndIdEstudiante(String id, String idEstudiante);
    List<Intento> findByIdEvaluacionOrderByCreatedAtDesc(String idEvaluacion);

    List<Intento> findByIdEvaluacionAndEstadoOrderByCreatedAtDesc(
            String idEvaluacion,
            Intento.EstadoIntento estado
    );
}
