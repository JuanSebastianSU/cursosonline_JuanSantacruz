package com.cursosonline.cursosonlinejs.Repositorios;

import com.cursosonline.cursosonlinejs.Entidades.Certificado;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface CertificadoRepositorio extends MongoRepository<Certificado, String> {
    Optional<Certificado> findByCodigoVerificacion(String codigoVerificacion);
    boolean existsByIdCursoAndIdEstudiante(String idCurso, String idEstudiante);

    List<Certificado> findByIdCursoOrderByCreatedAtDesc(String idCurso);
    List<Certificado> findByIdEstudianteOrderByCreatedAtDesc(String idEstudiante);
}
