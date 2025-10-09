package com.cursosonline.cursosonlinejs.Repositorios;

import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.cursosonline.cursosonlinejs.Entidades.Usuario;

public interface UsuarioRepositorio extends MongoRepository<Usuario, String> {

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);
}
