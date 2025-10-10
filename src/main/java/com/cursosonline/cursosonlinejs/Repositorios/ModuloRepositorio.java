package com.cursosonline.cursosonlinejs.Repositorios;

import com.cursosonline.cursosonlinejs.Entidades.Modulo;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ModuloRepositorio extends MongoRepository<Modulo, String> {

    List<Modulo> findByIdCursoOrderByOrdenAsc(String idCurso);
    boolean existsByIdCursoAndOrden(String idCurso, int orden);
    boolean existsByIdCursoAndOrdenAndIdNot(String idCurso, int orden, String id);
    Optional<Modulo> findTopByIdCursoOrderByOrdenDesc(String idCurso);
    Optional<Modulo> findByIdCursoAndOrden(String idCurso, int orden);
    List<Modulo> findByIdIn(List<String> ids);
    List<Modulo> findByIdCursoAndEstadoOrderByOrdenAsc(String idCurso, Modulo.EstadoModulo estado);

}
