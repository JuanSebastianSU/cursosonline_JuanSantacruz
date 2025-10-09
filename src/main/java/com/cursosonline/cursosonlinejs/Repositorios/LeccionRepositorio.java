// src/main/java/com/cursosonline/cursosonlinejs/Repositorios/LeccionRepositorio.java
package com.cursosonline.cursosonlinejs.Repositorios;

import com.cursosonline.cursosonlinejs.Entidades.Leccion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeccionRepositorio extends MongoRepository<Leccion, String> {
       
    // ya existentes en tu app (si los tienes)
    List<Leccion> findByIdModuloOrderByOrdenAsc(String idModulo);
    Optional<Leccion> findTopByIdModuloOrderByOrdenDesc(String idModulo);
    boolean existsByIdModuloAndOrden(String idModulo, int orden);
    boolean existsByIdModuloAndOrdenAndIdNot(String idModulo, int orden, String idExcluido);
    Optional<Leccion> findByIdModuloAndOrden(String idModulo, int orden);
    List<Leccion> findByIdIn(List<String> idsEnOrden);
    // NUEVO: conteo rápido de lecciones por curso (tu entidad Leccion ya guarda idCurso)
    long countByIdCurso(String idCurso);
    long countByIdCursoAndEstado(String idCurso, Leccion.EstadoPublicacion estado);
    // NUEVO: listar solo PUBLICADAS de un módulo, en orden
    List<Leccion> findByIdModuloAndEstadoOrderByOrdenAsc(String idModulo, Leccion.EstadoPublicacion estado);

}
