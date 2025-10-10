package com.cursosonline.cursosonlinejs.Repositorios;

import com.cursosonline.cursosonlinejs.Entidades.Leccion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeccionRepositorio extends MongoRepository<Leccion, String> {
       
    List<Leccion> findByIdModuloOrderByOrdenAsc(String idModulo);
    Optional<Leccion> findTopByIdModuloOrderByOrdenDesc(String idModulo);
    boolean existsByIdModuloAndOrden(String idModulo, int orden);
    boolean existsByIdModuloAndOrdenAndIdNot(String idModulo, int orden, String idExcluido);
    Optional<Leccion> findByIdModuloAndOrden(String idModulo, int orden);
    List<Leccion> findByIdIn(List<String> idsEnOrden);
    long countByIdCurso(String idCurso);
    long countByIdCursoAndEstado(String idCurso, Leccion.EstadoPublicacion estado);
    List<Leccion> findByIdModuloAndEstadoOrderByOrdenAsc(String idModulo, Leccion.EstadoPublicacion estado);

}
