package com.cursosonline.cursosonlinejs.Repositorios;

import com.cursosonline.cursosonlinejs.Entidades.Menu;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuRepositorio extends MongoRepository<Menu, String> {
    List<Menu> findAllByOrderByOrdenAsc();
}
