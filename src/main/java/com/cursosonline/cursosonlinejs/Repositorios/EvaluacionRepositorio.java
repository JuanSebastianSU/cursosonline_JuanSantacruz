// src/main/java/com/cursosonline/cursosonlinejs/Repositorios/EvaluacionRepositorio.java
package com.cursosonline.cursosonlinejs.Repositorios;

import com.cursosonline.cursosonlinejs.Entidades.Evaluacion;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface EvaluacionRepositorio extends MongoRepository<Evaluacion, String> {
    List<Evaluacion> findByIdLeccionOrderByTituloAsc(String idLeccion);
    Optional<Evaluacion> findByIdAndIdLeccion(String id, String idLeccion);
    void deleteByIdAndIdLeccion(String id, String idLeccion);
    // NUEVO: listar solo PUBLICADAS de una lección (ordena como prefieras)
    List<Evaluacion> findByIdLeccionAndEstadoOrderByTituloAsc(String idLeccion, Evaluacion.EstadoPublicacion estado);

}
