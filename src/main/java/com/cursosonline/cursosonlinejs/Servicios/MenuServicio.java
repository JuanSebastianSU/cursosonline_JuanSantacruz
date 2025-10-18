package com.cursosonline.cursosonlinejs.Servicios;

import com.cursosonline.cursosonlinejs.Entidades.Menu;
import com.cursosonline.cursosonlinejs.Repositorios.MenuRepositorio;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MenuServicio {

    private final MenuRepositorio repo;

    public MenuServicio(MenuRepositorio repo) {
        this.repo = repo;
    }

    /** Lista ordenada por 'orden' si hay; si no, lista todo. */
    public List<Menu> listar() {
        List<Menu> all = repo.findAllByOrderByOrdenAsc();
        return all.isEmpty() ? repo.findAll() : all;
    }

    /** Crea un item (orden por defecto = 999 para ir al final). */
    public Menu crear(Menu item) {
        if (item.getOrden() == null) item.setOrden(999);
        return repo.save(item);
    }

    /** Actualiza campos puntuales si vienen no-nulos. */
    public Menu actualizar(String id, Menu changes) {
        Menu actual = repo.findById(id).orElseThrow();
        if (changes.getNombre() != null) actual.setNombre(changes.getNombre());
        if (changes.getUrl() != null)    actual.setUrl(changes.getUrl());
        if (changes.getOrden() != null)  actual.setOrden(changes.getOrden());
        return repo.save(actual);
    }

    /** Elimina por id. */
    public void eliminar(String id) {
        repo.deleteById(id);
    }
}
