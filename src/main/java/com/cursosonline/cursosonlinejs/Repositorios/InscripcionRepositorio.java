// src/main/java/com/cursosonline/cursosonlinejs/Repositorios/InscripcionRepositorio.java
package com.cursosonline.cursosonlinejs.Repositorios;

import com.cursosonline.cursosonlinejs.Entidades.Inscripcion;
import com.cursosonline.cursosonlinejs.Entidades.Inscripcion.EstadoInscripcion;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface InscripcionRepositorio extends MongoRepository<Inscripcion, String> {

    boolean existsByIdCursoAndIdEstudianteAndEstadoIn(String idCurso, String idEstudiante, List<EstadoInscripcion> estados);

    List<Inscripcion> findByIdCursoOrderByCreatedAtDesc(String idCurso);
    List<Inscripcion> findByIdCursoAndEstadoOrderByCreatedAtDesc(String idCurso, EstadoInscripcion estado);
    Optional<Inscripcion> findByIdAndIdCurso(String id, String idCurso);

    // YA TENÍAS este (para varios estados)
    long countByIdCursoAndEstadoIn(String idCurso, List<Inscripcion.EstadoInscripcion> estados);

    // NUEVO: por un solo estado (útil si cuentas solo ACTIVA)
    long countByIdCursoAndEstado(String idCurso, EstadoInscripcion estado);

    List<Inscripcion> findByIdEstudianteOrderByCreatedAtDesc(String idEstudiante);
    List<Inscripcion> findByIdEstudianteAndEstadoOrderByCreatedAtDesc(String idEstudiante, EstadoInscripcion estado);
    Optional<Inscripcion> findByIdCursoAndIdEstudiante(String idCurso, String idEstudiante);
}
