package com.cursosonline.cursosonlinejs.Servicios;

import java.util.Optional;
import java.util.regex.Pattern;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.cursosonline.cursosonlinejs.Entidades.TipoUsuario;
import com.cursosonline.cursosonlinejs.Repositorios.TipoUsuarioRepositorio;

@Service
public class TipoUsuarioServicio {

    private final TipoUsuarioRepositorio repo;

    public TipoUsuarioServicio(TipoUsuarioRepositorio repo) {
        this.repo = repo;
    }

    private String norm(String s) {
        return s == null ? null : s.trim();
    }

    /* =================== Crear =================== */
    public TipoUsuario guardar(TipoUsuario t) {
        t.setNombre(norm(t.getNombre()));
        if (t.getNombre() == null || t.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre del tipo es obligatorio.");
        }
        if (repo.existsByNombreIgnoreCase(t.getNombre())) {
            throw new IllegalArgumentException("Ya existe un TipoUsuario con ese nombre.");
        }

        // ADMIN siempre system=true y nunca default
        if ("ADMIN".equalsIgnoreCase(t.getNombre())) {
            t.setSystem(true);
            t.setDefault(false);
        }

        // si se marca como default, quitar default del anterior
        if (t.isDefault()) {
            repo.findFirstByIsDefaultTrueOrderByNombreAsc().ifPresent(prev -> {
                prev.setDefault(false);
                repo.save(prev);
            });
        }

        return repo.save(t);
    }

    /* =================== Listar/Buscar =================== */
    public Page<TipoUsuario> listar(Pageable pageable) {
        return repo.findAll(pageable);
    }

    public Page<TipoUsuario> buscarPorNombre(String q, Pageable pageable) {
        String regex = ".*" + Pattern.quote(q) + ".*";
        return repo.findByNombreRegexIgnoreCase(regex, pageable);
    }

    public Optional<TipoUsuario> obtenerPorId(String id) {
        return repo.findById(id);
    }

    /* =================== Actualizar =================== */
    public Optional<TipoUsuario> actualizar(String id, String nombre, String descripcion, boolean isDefault) {
        final String nombreNorm = norm(nombre);

        if (repo.existsByNombreIgnoreCaseAndIdNot(nombreNorm, id)) {
            throw new IllegalArgumentException("Ya existe otro TipoUsuario con ese nombre.");
        }

        return repo.findById(id).map(actual -> {
            // No permitir renombrar/eliminar ADMIN ni marcarlo default
            if (actual.isSystem() && "ADMIN".equalsIgnoreCase(actual.getNombre())) {
                if (!actual.getNombre().equalsIgnoreCase(nombreNorm)) {
                    throw new IllegalStateException("No se puede renombrar ADMIN.");
                }
                if (isDefault) {
                    throw new IllegalStateException("ADMIN no puede ser default.");
                }
            }

            actual.setNombre(nombreNorm);
            actual.setDescripcion(descripcion);

            if (isDefault) {
                repo.findFirstByIsDefaultTrueOrderByNombreAsc().ifPresent(prev -> {
                    if (!prev.getId().equals(actual.getId())) {
                        prev.setDefault(false);
                        repo.save(prev);
                    }
                });
            }
            actual.setDefault(isDefault && !(actual.isSystem() && "ADMIN".equalsIgnoreCase(actual.getNombre())));

            return repo.save(actual);
        });
    }

    /* =================== Eliminar =================== */
    public boolean eliminar(String id) {
        return repo.findById(id).map(t -> {
            if (t.isSystem()) {
                throw new IllegalStateException("No se puede eliminar un tipo del sistema.");
            }
            repo.deleteById(id);
            return true;
        }).orElse(false);
    }

    /* =================== Utilidades =================== */
    public Optional<TipoUsuario> getDefault() {
        return repo.findFirstByIsDefaultTrueOrderByNombreAsc();
    }

    public Optional<TipoUsuario> findByNombreIgnoreCase(String nombre) {
        return repo.findByNombreIgnoreCase(norm(nombre));
    }
}
