// src/main/java/com/cursosonline/cursosonlinejs/Repositorios/CursoRepositorio.java
package com.cursosonline.cursosonlinejs.Repositorios;

import com.cursosonline.cursosonlinejs.Entidades.Curso;
import com.cursosonline.cursosonlinejs.Entidades.Curso.EstadoCurso;
import com.cursosonline.cursosonlinejs.Entidades.Curso.Nivel;
import com.cursosonline.cursosonlinejs.Entidades.Inscripcion;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface CursoRepositorio extends MongoRepository<Curso, String> {

    Optional<Curso> findByIdAndEstado(String id, String estado);
    Optional<Curso> findByIdAndEstado(String id, EstadoCurso estado);

    Page<Curso> findByIdInstructor(String idInstructor, Pageable pageable);

    // === NUEVO: listado completo del instructor (sin paginar) ===
    List<Curso> findByIdInstructorOrderByCreatedAtAsc(String idInstructor);

    Page<Curso> findByEstado(String estado, Pageable pageable);
    Page<Curso> findByEstado(EstadoCurso estado, Pageable pageable);

    Page<Curso> findByCategoriaAndEstado(String categoria, String estado, Pageable pageable);
    Page<Curso> findByCategoriaAndEstado(String categoria, EstadoCurso estado, Pageable pageable);

    Page<Curso> findByNivelAndEstado(String nivel, String estado, Pageable pageable);
    Page<Curso> findByNivelAndEstado(Nivel nivel, EstadoCurso estado, Pageable pageable);

    Page<Curso> findByIdiomaAndEstado(String idioma, String estado, Pageable pageable);
    Page<Curso> findByIdiomaAndEstado(String idioma, EstadoCurso estado, Pageable pageable);

    Page<Curso> findByCategoriaInAndEstado(List<String> categorias, String estado, Pageable pageable);
    Page<Curso> findByCategoriaInAndEstado(List<String> categorias, EstadoCurso estado, Pageable pageable);

    Page<Curso> findByPrecioBetweenAndEstado(double min, double max, String estado, Pageable pageable);
    Page<Curso> findByPrecioBetweenAndEstado(BigDecimal min, BigDecimal max, EstadoCurso estado, Pageable pageable);

    long countByIdInstructor(String idInstructor);

    boolean existsByIdInstructorAndTituloIgnoreCase(String idInstructor, String titulo);

    @Query("{ '$and': [ { '$or': [ { 'titulo': { '$regex': ?0, '$options':'i' } }, { 'descripcion': { '$regex': ?0, '$options':'i' } } ] }, { 'estado': ?1 } ] }")
    Page<Curso> buscarTextoYEstado(String q, String estado, Pageable pageable);

    @Query("{ '$or': [ { 'titulo': { '$regex': ?0, '$options':'i' } }, { 'descripcion': { '$regex': ?0, '$options':'i' } } ] }")
    Page<Curso> buscarTexto(String q, Pageable pageable);

}
