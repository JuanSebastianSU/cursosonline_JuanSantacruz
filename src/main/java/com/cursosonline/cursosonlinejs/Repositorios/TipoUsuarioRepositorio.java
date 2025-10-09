package com.cursosonline.cursosonlinejs.Repositorios;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.cursosonline.cursosonlinejs.Entidades.TipoUsuario;

public interface TipoUsuarioRepositorio extends MongoRepository<TipoUsuario, String> {
    boolean existsByNombreIgnoreCase(String nombre);
    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, String id);

    Optional<TipoUsuario> findByNombreIgnoreCase(String nombre);
    Optional<TipoUsuario> findFirstByIsDefaultTrueOrderByNombreAsc();

    Page<TipoUsuario> findByNombreRegexIgnoreCase(String regex, Pageable pageable);
}
