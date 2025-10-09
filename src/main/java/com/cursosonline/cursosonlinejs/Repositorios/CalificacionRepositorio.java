package com.cursosonline.cursosonlinejs.Repositorios;

import com.cursosonline.cursosonlinejs.Entidades.Calificacion;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface CalificacionRepositorio extends MongoRepository<Calificacion, String> {
    Optional<Calificacion> findByIdIntento(String idIntento);
    boolean existsByIdIntento(String idIntento);
    List<Calificacion> findByIdEvaluacionOrderByCreatedAtDesc(String idEvaluacion);
}
