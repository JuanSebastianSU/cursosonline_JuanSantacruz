// src/main/java/com/cursosonline/cursosonlinejs/Servicios/IntentoServicio.java
package com.cursosonline.cursosonlinejs.Servicios;

import com.cursosonline.cursosonlinejs.Entidades.Intento;
import com.cursosonline.cursosonlinejs.Repositorios.IntentoRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.UsuarioRepositorio;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class IntentoServicio {

    private final IntentoRepositorio intentoRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;

    public IntentoServicio(IntentoRepositorio intentoRepositorio,
                           UsuarioRepositorio usuarioRepositorio) {
        this.intentoRepositorio = intentoRepositorio;
        this.usuarioRepositorio = usuarioRepositorio;
    }

    public Optional<String> obtenerIdEstudianteActual() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return Optional.empty();
        return usuarioRepositorio.findByEmail(auth.getName()).map(u -> u.getId());
    }

    public boolean tieneIntentoEnProgreso(String idEvaluacion, String idEstudiante) {
        return intentoRepositorio.existsByIdEvaluacionAndIdEstudianteAndEstado(
                idEvaluacion, idEstudiante, Intento.EstadoIntento.EN_PROGRESO
        );
    }

    private int siguienteNro(String idEvaluacion, String idEstudiante) {
        return intentoRepositorio
                .findTopByIdEvaluacionAndIdEstudianteOrderByNroIntentoDesc(idEvaluacion, idEstudiante)
                .map(x -> (x.getNroIntento() == null ? 1 : x.getNroIntento() + 1))
                .orElse(1);
    }

    /* === Crear === */
    public Intento crearEnProgreso(String idEvaluacion, String idEstudiante,
                                   Integer timeLimitSeconds, BigDecimal puntajeMaximo) {
        Intento i = new Intento();
        i.setIdEvaluacion(idEvaluacion);
        i.setIdEstudiante(idEstudiante);
        i.setEstado(Intento.EstadoIntento.EN_PROGRESO);
        i.setNroIntento(siguienteNro(idEvaluacion, idEstudiante));
        i.setPuntaje(BigDecimal.ZERO);
        i.setUsedTimeSeconds(0);
        i.setTimeLimitSeconds(timeLimitSeconds == null ? 0 : timeLimitSeconds);
        i.setPuntajeMaximo(puntajeMaximo);
        return intentoRepositorio.save(i);
    }

    /* === Obtener/Listar === */
    public Optional<Intento> obtener(String idIntento) {
        return intentoRepositorio.findById(idIntento);
    }

    public List<Intento> listarPorEvaluacionYEstudiante(String idEvaluacion, String idEstudiante) {
        return intentoRepositorio.findByIdEvaluacionAndIdEstudianteOrderByEnviadoEnDesc(idEvaluacion, idEstudiante);
    }

    /* === Actualizar (PUT/PATCH) solo EN_PROGRESO === */
    public Optional<Intento> actualizarCompleto(String idIntento, String idEstudiante,
                                                List<Intento.Respuesta> respuestas,
                                                Integer usedTimeSeconds) {
        return intentoRepositorio.findByIdAndIdEstudiante(idIntento, idEstudiante).map(i -> {
            if (i.getEstado() != Intento.EstadoIntento.EN_PROGRESO) {
                throw new IllegalStateException("Solo se puede modificar un intento EN_PROGRESO.");
            }
            i.setRespuestas(respuestas);
            if (usedTimeSeconds != null && usedTimeSeconds >= 0) {
                i.setUsedTimeSeconds(usedTimeSeconds);
                validarTiempo(i);
            }
            return intentoRepositorio.save(i);
        });
    }

    public Optional<Intento> patchParcial(String idIntento, String idEstudiante,
                                          List<Intento.Respuesta> respuestas,
                                          Integer usedTimeSeconds) {
        return intentoRepositorio.findByIdAndIdEstudiante(idIntento, idEstudiante).map(i -> {
            if (i.getEstado() != Intento.EstadoIntento.EN_PROGRESO) {
                throw new IllegalStateException("Solo se puede modificar un intento EN_PROGRESO.");
            }
            if (respuestas != null) i.setRespuestas(respuestas);
            if (usedTimeSeconds != null && usedTimeSeconds >= 0) {
                i.setUsedTimeSeconds(usedTimeSeconds);
                validarTiempo(i);
            }
            return intentoRepositorio.save(i);
        });
    }

    /* === Entregar === */
    public Intento entregar(String idIntento, String idEstudiante,
                            List<Intento.Respuesta> respuestas, Integer tiempoSegundos, Instant ahora) {
        Intento i = intentoRepositorio.findByIdAndIdEstudiante(idIntento, idEstudiante)
                .orElseThrow(() -> new NoSuchElementException("Intento no encontrado"));

        if (i.getEstado() != Intento.EstadoIntento.EN_PROGRESO) {
            throw new IllegalStateException("El intento no está en progreso o ya fue entregado.");
        }

        if (tiempoSegundos != null && tiempoSegundos >= 0) {
            i.setUsedTimeSeconds(tiempoSegundos);
        }
        validarTiempo(i);

        if (respuestas != null) {
            i.setRespuestas(respuestas);
        }

        i.setEstado(Intento.EstadoIntento.ENVIADO);
        i.setEnviadoEn(ahora);

        return intentoRepositorio.save(i);
    }

    /* === Delete (propio y EN_PROGRESO) === */
    public boolean eliminarSiPropioYEnProgreso(String idIntento, String idEstudiante) {
        var opt = intentoRepositorio.findByIdAndIdEstudiante(idIntento, idEstudiante);
        if (opt.isEmpty()) return false;
        var i = opt.get();
        if (i.getEstado() != Intento.EstadoIntento.EN_PROGRESO) {
            throw new IllegalStateException("Solo se puede eliminar un intento EN_PROGRESO.");
        }
        intentoRepositorio.deleteById(idIntento);
        return true;
    }

        /* === Listar TODOS los intentos de una evaluación (ADMIN/INSTRUCTOR) === */
    public List<Intento> listarTodosPorEvaluacion(String idEvaluacion, String estadoRaw) {
        if (estadoRaw == null || estadoRaw.isBlank()) {
            return intentoRepositorio.findByIdEvaluacionOrderByCreatedAtDesc(idEvaluacion);
        }
        Intento.EstadoIntento estado;
        try {
            estado = Intento.EstadoIntento.valueOf(estadoRaw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            // Si mandan un estado inválido, devuelve lista vacía para no romper UX
            return List.of();
        }
        return intentoRepositorio.findByIdEvaluacionAndEstadoOrderByCreatedAtDesc(idEvaluacion, estado);
    }
    /* === Helpers === */
    private void validarTiempo(Intento i) {
        if (i.getTimeLimitSeconds() != null && i.getTimeLimitSeconds() > 0 &&
            i.getUsedTimeSeconds() != null && i.getUsedTimeSeconds() > i.getTimeLimitSeconds()) {
            throw new IllegalArgumentException("El tiempo usado excede el límite configurado.");
        }
    }

    
}
