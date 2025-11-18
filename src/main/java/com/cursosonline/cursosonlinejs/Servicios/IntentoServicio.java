package com.cursosonline.cursosonlinejs.Servicios;

import com.cursosonline.cursosonlinejs.Entidades.Evaluacion;
import com.cursosonline.cursosonlinejs.Entidades.Intento;
import com.cursosonline.cursosonlinejs.Entidades.OpcionPregunta;
import com.cursosonline.cursosonlinejs.Entidades.Pregunta;
import com.cursosonline.cursosonlinejs.Repositorios.EvaluacionRepositorio;
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
    private final EvaluacionRepositorio evaluacionRepositorio;

    public IntentoServicio(IntentoRepositorio intentoRepositorio,
                           UsuarioRepositorio usuarioRepositorio,
                           EvaluacionRepositorio evaluacionRepositorio) {
        this.intentoRepositorio = intentoRepositorio;
        this.usuarioRepositorio = usuarioRepositorio;
        this.evaluacionRepositorio = evaluacionRepositorio;
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

    public Optional<Intento> obtener(String idIntento) {
        return intentoRepositorio.findById(idIntento);
    }

    public List<Intento> listarPorEvaluacionYEstudiante(String idEvaluacion, String idEstudiante) {
        return intentoRepositorio.findByIdEvaluacionAndIdEstudianteOrderByEnviadoEnDesc(idEvaluacion, idEstudiante);
    }

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

        i = intentoRepositorio.save(i);

        // Intentar auto-calificar (si todas o algunas preguntas lo permiten)
        i = aplicarAutoCalificacion(i);

        return i;
    }

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

    public List<Intento> listarTodosPorEvaluacion(String idEvaluacion, String estadoRaw) {
        if (estadoRaw == null || estadoRaw.isBlank()) {
            return intentoRepositorio.findByIdEvaluacionOrderByCreatedAtDesc(idEvaluacion);
        }
        Intento.EstadoIntento estado;
        try {
            estado = Intento.EstadoIntento.valueOf(estadoRaw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return List.of();
        }
        return intentoRepositorio.findByIdEvaluacionAndEstadoOrderByCreatedAtDesc(idEvaluacion, estado);
    }

    private void validarTiempo(Intento i) {
        if (i.getTimeLimitSeconds() != null && i.getTimeLimitSeconds() > 0 &&
            i.getUsedTimeSeconds() != null && i.getUsedTimeSeconds() > i.getTimeLimitSeconds()) {
            throw new IllegalArgumentException("El tiempo usado excede el límite configurado.");
        }
    }

    // =========================================================
    // =============== LÓGICA DE AUTO-CALIFICACIÓN =============
    // =========================================================

    private Intento aplicarAutoCalificacion(Intento intento) {
        if (intento == null || intento.getIdEvaluacion() == null) {
            return intento;
        }

        var optEval = evaluacionRepositorio.findById(intento.getIdEvaluacion());
        if (optEval.isEmpty()) return intento;

        Evaluacion eval = optEval.get();
        List<Pregunta> preguntas = eval.getPreguntas();
        if (preguntas == null || preguntas.isEmpty()) {
            return intento;
        }

        List<Intento.Respuesta> respuestas = intento.getRespuestas();
        if (respuestas == null) {
            respuestas = List.of();
        }

        BigDecimal totalPuntaje = BigDecimal.ZERO;
        BigDecimal totalMax = BigDecimal.ZERO;
        boolean hayNoAuto = false;

        for (Pregunta p : preguntas) {
            if (p == null) continue;

            int puntosPregunta = (p.getPuntaje() == null) ? 0 : p.getPuntaje();
            BigDecimal puntajePregunta = BigDecimal.valueOf(puntosPregunta);
            totalMax = totalMax.add(puntajePregunta);

            if (!p.isAutoCalificable()) {
                hayNoAuto = true;
                continue;
            }

            Intento.Respuesta r = respuestas.stream()
                    .filter(resp -> p.getId() != null && p.getId().equals(resp.getIdPregunta()))
                    .findFirst()
                    .orElse(null);

            BigDecimal obtenido = BigDecimal.ZERO;

            if (r != null && p.getTipo() != null) {
                switch (p.getTipo()) {
                    case VERDADERO_FALSO:
                        obtenido = calificarOpcionUnica(p, r, puntajePregunta);
                        break;

                    case OPCION_MULTIPLE:
                        obtenido = calificarOpcionMultiple(p, r, puntajePregunta);
                        break;

                    case NUMERICA:
                        obtenido = calificarNumerica(p, r, puntajePregunta);
                        break;

                    case ABIERTA:
                    default:
                        // Pregunta abierta o tipo no auto-corregible
                        hayNoAuto = true;
                        break;
                }
            }


            if (r != null) {
                r.setPuntaje(obtenido);
            }
            totalPuntaje = totalPuntaje.add(obtenido);
        }

        intento.setPuntajeMaximo(totalMax);
        intento.setPuntaje(totalPuntaje);

        // Si NO hay preguntas no auto-calificables, marcamos como CALIFICADO
        if (!hayNoAuto) {
            intento.setEstado(Intento.EstadoIntento.CALIFICADO);
            intento.setCalificadoAt(Instant.now());
        }

        return intentoRepositorio.save(intento);
    }

    private BigDecimal calificarOpcionUnica(Pregunta p, Intento.Respuesta r, BigDecimal puntajePregunta) {
    if (r == null) return BigDecimal.ZERO;

    if (r.getOpciones() == null || r.getOpciones().isEmpty()) {
        r.setEstado(Intento.EstadoRespuesta.SIN_RESPONDER);
        return BigDecimal.ZERO;
    }

    String seleccion = r.getOpciones().get(0);

    if (p.getOpciones() == null || p.getOpciones().isEmpty()) {
        // No hay claves configuradas => no podemos corregir
        r.setEstado(Intento.EstadoRespuesta.SIN_CORREGIR);
        return BigDecimal.ZERO;
    }

    boolean esCorrecta = p.getOpciones().stream()
            .filter(OpcionPregunta::isCorrecta)
            .anyMatch(op -> op.getId() != null && op.getId().equals(seleccion));

    if (esCorrecta) {
        r.setEstado(Intento.EstadoRespuesta.CORRECTA);
        return puntajePregunta;
    } else {
        r.setEstado(Intento.EstadoRespuesta.INCORRECTA);
        return BigDecimal.ZERO;
    }
}


    private BigDecimal calificarOpcionMultiple(Pregunta p, Intento.Respuesta r, BigDecimal puntajePregunta) {
    if (r == null) return BigDecimal.ZERO;

    if (p.getOpciones() == null || p.getOpciones().isEmpty()) {
        r.setEstado(Intento.EstadoRespuesta.SIN_CORREGIR);
        return BigDecimal.ZERO;
    }
    if (r.getOpciones() == null || r.getOpciones().isEmpty()) {
        r.setEstado(Intento.EstadoRespuesta.SIN_RESPONDER);
        return BigDecimal.ZERO;
    }

    var correctas = p.getOpciones().stream()
            .filter(OpcionPregunta::isCorrecta)
            .map(OpcionPregunta::getId)
            .filter(id -> id != null)
            .sorted()
            .toList();

    var marcadas = r.getOpciones().stream()
            .filter(id -> id != null)
            .sorted()
            .toList();

    if (correctas.isEmpty()) {
        r.setEstado(Intento.EstadoRespuesta.SIN_CORREGIR);
        return BigDecimal.ZERO;
    }

    boolean coincide = correctas.equals(marcadas);

    if (coincide) {
        r.setEstado(Intento.EstadoRespuesta.CORRECTA);
        return puntajePregunta;
    } else {
        r.setEstado(Intento.EstadoRespuesta.INCORRECTA);
        return BigDecimal.ZERO;
    }
}


    private BigDecimal calificarNumerica(Pregunta p, Intento.Respuesta r, BigDecimal puntajePregunta) {
    if (r == null) return BigDecimal.ZERO;

    if (p.getRespuestaNumericaCorrecta() == null) {
        r.setEstado(Intento.EstadoRespuesta.SIN_CORREGIR);
        return BigDecimal.ZERO;
    }

    String txt = r.getTextoLibre();
    if (txt == null || txt.isBlank()) {
        r.setEstado(Intento.EstadoRespuesta.SIN_RESPONDER);
        return BigDecimal.ZERO;
    }

    try {
        double esperado = p.getRespuestaNumericaCorrecta();
        double obtenido = Double.parseDouble(txt.trim());
        double diff = Math.abs(esperado - obtenido);

        double tolerancia = 1e-6;
        if (diff <= tolerancia) {
            r.setEstado(Intento.EstadoRespuesta.CORRECTA);
            return puntajePregunta;
        } else {
            r.setEstado(Intento.EstadoRespuesta.INCORRECTA);
            return BigDecimal.ZERO;
        }
    } catch (NumberFormatException ex) {
        r.setEstado(Intento.EstadoRespuesta.INCORRECTA);
        return BigDecimal.ZERO;
    }
}

}
