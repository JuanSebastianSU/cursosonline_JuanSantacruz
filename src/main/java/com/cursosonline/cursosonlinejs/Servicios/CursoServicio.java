package com.cursosonline.cursosonlinejs.Servicios;

import com.cursosonline.cursosonlinejs.Entidades.Curso;
import com.cursosonline.cursosonlinejs.Entidades.Curso.EstadoCurso;
import com.cursosonline.cursosonlinejs.Entidades.Curso.Nivel;
import com.cursosonline.cursosonlinejs.Entidades.Inscripcion;
import com.cursosonline.cursosonlinejs.Entidades.Leccion;
import com.cursosonline.cursosonlinejs.Entidades.Modulo;
import com.cursosonline.cursosonlinejs.Repositorios.CursoRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.InscripcionRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.LeccionRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.ModuloRepositorio;
import com.cursosonline.cursosonlinejs.Repositorios.UsuarioRepositorio;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CursoServicio {

    private final CursoRepositorio cursoRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final MongoTemplate mongoTemplate;
    private final TipoUsuarioServicio tipoUsuarioServicio;
    private final ModuloRepositorio moduloRepositorio;
    private final UsuarioServicio usuarioServicio;
    private final LeccionRepositorio leccionRepositorio;
    private final InscripcionRepositorio inscripcionRepositorio;

    private static final List<Inscripcion.EstadoInscripcion> ESTADOS_OCUPAN_CUPO =
            List.of(Inscripcion.EstadoInscripcion.PENDIENTE_PAGO,
                    Inscripcion.EstadoInscripcion.ACTIVA);

    public CursoServicio(CursoRepositorio cursoRepositorio,
                         UsuarioRepositorio usuarioRepositorio,
                         MongoTemplate mongoTemplate,
                         TipoUsuarioServicio tipoUsuarioServicio,
                         ModuloRepositorio moduloRepositorio,
                         LeccionRepositorio leccionRepositorio,
                         InscripcionRepositorio inscripcionRepositorio,
                         UsuarioServicio usuarioServicio) {
        this.cursoRepositorio = cursoRepositorio;
        this.usuarioRepositorio = usuarioRepositorio;
        this.mongoTemplate = mongoTemplate;
        this.tipoUsuarioServicio = tipoUsuarioServicio;
        this.moduloRepositorio = moduloRepositorio;
        this.leccionRepositorio = leccionRepositorio;
        this.inscripcionRepositorio = inscripcionRepositorio;
        this.usuarioServicio = usuarioServicio;
    }

    public boolean puedeInscribirse(String idCurso) {
        return cursoRepositorio.findById(idCurso).map(c -> {
            if (c.getEstado() != Curso.EstadoCurso.PUBLICADO) return false;
            Instant now = Instant.now();
            if (c.getEnrollmentOpenAt() != null && now.isBefore(c.getEnrollmentOpenAt())) return false;
            if (c.getEnrollmentCloseAt() != null && now.isAfter(c.getEnrollmentCloseAt())) return false;
            return true;
        }).orElse(false);
    }

    public boolean cupoDisponible(String idCurso) {
        return cursoRepositorio.findById(idCurso).map(c -> {
            Integer cupo = c.getCupoMaximo();
            if (cupo == null || cupo <= 0) return true;
            long ocupados = inscripcionRepositorio.countByIdCursoAndEstadoIn(idCurso, ESTADOS_OCUPAN_CUPO);
            return ocupados < cupo;
        }).orElse(false);
    }

    public void reconstruirLeccionesCount(String idCurso) {
        var cursoOpt = cursoRepositorio.findById(idCurso);
        if (cursoOpt.isEmpty()) return;

        long count = leccionRepositorio.countByIdCursoAndEstado(
                idCurso, Leccion.EstadoPublicacion.PUBLICADO
        );

        var c = cursoOpt.get();
        c.setLeccionesCount((int) count);
        cursoRepositorio.save(c);
    }

    public void reconstruirInscritosCount(String idCurso) {
        long total = inscripcionRepositorio.countByIdCursoAndEstado(
                idCurso, com.cursosonline.cursosonlinejs.Entidades.Inscripcion.EstadoInscripcion.ACTIVA
        );
        cursoRepositorio.findById(idCurso).ifPresent(c -> {
            c.setInscritosCount(total);
            cursoRepositorio.save(c);
        });
    }

    public void incInscritosCount(String idCurso, long delta) {
        Query q = new Query(Criteria.where("_id").is(idCurso));
        Update u = new Update().inc("inscritosCount", delta);
        mongoTemplate.updateFirst(q, u, Curso.class, "cursos");
    }

    public void validarParaPublicar(Curso c) {
        if (c.getEnrollmentOpenAt() != null && c.getEnrollmentCloseAt() != null) {
            if (c.getEnrollmentCloseAt().isBefore(c.getEnrollmentOpenAt())) {
                throw new IllegalArgumentException("La ventana de matrícula es inválida: cierre antes que apertura.");
            }
        }
        if (c.getCupoMaximo() != null && c.getCupoMaximo() < 0) {
            throw new IllegalArgumentException("cupoMaximo no puede ser negativo.");
        }
    }

    public Optional<Curso> publicar(String idCurso) {
        return cursoRepositorio.findById(idCurso).map(c -> {
            if (c.getEstado() == Curso.EstadoCurso.PUBLICADO) return c;
            validarParaPublicar(c);
            c.setEstado(Curso.EstadoCurso.PUBLICADO);
            c.setPublishedAt(Instant.now());
            return cursoRepositorio.save(c);
        });
    }

    public Optional<Curso> archivar(String idCurso) {
        return cursoRepositorio.findById(idCurso).map(c -> {
            c.setEstado(Curso.EstadoCurso.ARCHIVADO);
            return cursoRepositorio.save(c);
        });
    }

    public boolean cursoEditable(String idCurso) {
        return cursoRepositorio.findById(idCurso)
                .map(c -> c.getEstado() != Curso.EstadoCurso.PUBLICADO)
                .orElse(false);
    }

    public Curso guardar(Curso curso) {
        normalizarTexto(curso);
        if (curso.getCreatedAt() == null) curso.setCreatedAt(Instant.now());
        if (curso.getEstado() == null) curso.setEstado(EstadoCurso.BORRADOR);
        if (curso.getNivel() == null)  curso.setNivel(Nivel.PRINCIPIANTE);
        if (curso.getPrecio() == null) curso.setPrecio(BigDecimal.ZERO);
        if (curso.getInscritosCount() == null) curso.setInscritosCount(0L);
        if (curso.getLeccionesCount() == null) curso.setLeccionesCount(0);

        Curso saved = cursoRepositorio.save(curso);

        if (saved.getIdInstructor() != null) {
            usuarioServicio.syncCursosDelInstructor(saved.getIdInstructor());
        }
        return saved;
    }

    public List<Curso> listaAll() { return cursoRepositorio.findAll(); }

    public Curso listaCurso(String id) { return cursoRepositorio.findById(id).orElse(null); }

    public void eliminar(String id) {
        cursoRepositorio.deleteById(id);
    }

    public void reconstruirModulosSnapshot(String idCurso) {
        var cursoOpt = cursoRepositorio.findById(idCurso);
        if (cursoOpt.isEmpty()) return;

        List<Modulo> todos = moduloRepositorio.findByIdCursoOrderByOrdenAsc(idCurso);
        List<Modulo> modulos = todos.stream()
                .filter(m -> m.getEstado() == Modulo.EstadoModulo.PUBLICADO)
                .collect(java.util.stream.Collectors.toList());

        List<String> snapshot = modulos.stream()
                .map(m -> (m.getTitulo() == null ? "" : m.getTitulo().trim()) + " | " + m.getId())
                .collect(java.util.stream.Collectors.toList());

        Curso curso = cursoOpt.get();
        curso.setModulos(snapshot);
        curso.setModulosCount(modulos.size());
        cursoRepositorio.save(curso);

        reconstruirLeccionesCount(idCurso);
    }

    public void onModuloChanged(String idCurso) {
        reconstruirModulosSnapshot(idCurso);
    }

    public void onLeccionChanged(String idCurso) {
        reconstruirLeccionesCount(idCurso);
    }

    public Curso crearCursoDesdeDto(Object dtoGenerico) {
    Map<String, Object> m = toMap(dtoGenerico);

    Curso c = new Curso();
    c.setTitulo(reqStr(m, "titulo"));
    c.setDescripcion(optStr(m, "descripcion"));
    c.setCategoria(reqStr(m, "categoria"));
    c.setNivel(parseNivel(optStr(m, "nivel")));
    c.setIdioma(reqStr(m, "idioma"));
    c.setPrecio(optBigDecimal(m, "precio", BigDecimal.ZERO));
    c.setImagenPortadaUrl(optStr(m, "imagenPortadaUrl")); // ✅ <---- esta línea soluciona el problema
    c.setEstado(EstadoCurso.BORRADOR);
    c.setCreatedAt(Instant.now());
    c.setIdInstructor(usuarioActualId());

    normalizarTexto(c);
    Curso guardado = cursoRepositorio.save(c);

    asegurarRolInstructorPorNombre(c.getIdInstructor());
    usuarioServicio.syncCursosDelInstructor(c.getIdInstructor());

    return guardado;
}


    private void asegurarRolInstructorPorNombre(String userId) {
        usuarioRepositorio.findById(userId).ifPresent(u -> {
            tipoUsuarioServicio.findByNombreIgnoreCase("Instructor").ifPresent(ti -> {
                String nombreTipo = ti.getNombre();
                if (u.getRol() == null || !u.getRol().equalsIgnoreCase(nombreTipo)) {
                    u.setRol(nombreTipo);
                    usuarioRepositorio.save(u);
                }
            });
        });
    }

    public Page<Curso> buscar(String categoria, String nivel, String estado, String q,
                              int page, int size, String sort) {
        Query query = new Query();
        List<Criteria> ands = new ArrayList<>();

        if (isNotBlank(categoria)) ands.add(Criteria.where("categoria").is(categoria.trim()));
        if (isNotBlank(nivel))     ands.add(Criteria.where("nivel").is(parseNivel(nivel)));
        if (isNotBlank(estado))    ands.add(Criteria.where("estado").is(parseEstado(estado)));
        if (isNotBlank(q)) {
            String regex = ".*" + escapeRegex(q.trim()) + ".*";
            ands.add(new Criteria().orOperator(
                    Criteria.where("titulo").regex(regex, "i"),
                    Criteria.where("descripcion").regex(regex, "i")
            ));
        }
        if (!ands.isEmpty()) query.addCriteria(new Criteria().andOperator(ands.toArray(new Criteria[0])));

        Sort sortSpec = parseSort(sort, "createdAt", Sort.Direction.DESC);
        query.with(sortSpec);
        query.skip((long) page * size).limit(size);

        List<Curso> content = mongoTemplate.find(query, Curso.class, "cursos");
        long total = mongoTemplate.count(Query.of(query).limit(-1).skip(-1), Curso.class, "cursos");

        return new PageImpl<>(content,
                org.springframework.data.domain.PageRequest.of(page, size, sortSpec),
                total);
    }

    public Optional<Curso> obtenerPorId(String id) { return cursoRepositorio.findById(id); }

    public Optional<Curso> actualizarDesdeDto(String id, Object dtoGenerico) {
    Map<String, Object> m = toMap(dtoGenerico);

    return cursoRepositorio.findById(id).map(actual -> {
        // 🚫 Bloquear si está PUBLICADO
        if (actual.getEstado() == Curso.EstadoCurso.PUBLICADO) {
            throw new IllegalStateException("No se puede modificar un curso publicado. Archívalo antes de editarlo.");
        }

        String titulo = reqStr(m, "titulo");
        String categoria = reqStr(m, "categoria");
        String idioma = reqStr(m, "idioma");

        actual.setTitulo(titulo);
        actual.setDescripcion(optStr(m, "descripcion"));
        actual.setCategoria(categoria);
        actual.setNivel(parseNivel(optStr(m, "nivel")));
        actual.setIdioma(idioma);
        actual.setPrecio(optBigDecimal(m, "precio", BigDecimal.ZERO));

        // ✅ Imagen portada (opcional)
        if (m.containsKey("imagenPortadaUrl")) {
            String nuevaUrl = optStr(m, "imagenPortadaUrl");
            if (nuevaUrl != null && !nuevaUrl.isBlank()) {
                actual.setImagenPortadaUrl(nuevaUrl.trim());
            }
        }

        normalizarTexto(actual);
        Curso saved = cursoRepositorio.save(actual);
        usuarioServicio.reflejarCambioTituloCurso(saved.getId());
        return saved;
    });
}

    public Optional<Curso> cambiarEstado(String id, String nuevoEstado) {
        if (!isNotBlank(nuevoEstado)) return Optional.empty();
        EstadoCurso e = parseEstado(nuevoEstado);
        return cursoRepositorio.findById(id).map(actual -> {
            actual.setEstado(e);
            return cursoRepositorio.save(actual);
        });
    }

    public boolean eliminarPorId(String id) {
        var ownerId = cursoRepositorio.findById(id).map(Curso::getIdInstructor).orElse(null);
        if (!cursoRepositorio.existsById(id)) return false;
        cursoRepositorio.deleteById(id);
        if (ownerId != null) {
            usuarioServicio.reflejarEliminacionCurso(id);
        }
        return true;
    }

    private void normalizarTexto(Curso c) {
        if (c.getTitulo() != null)    c.setTitulo(c.getTitulo().trim());
        if (c.getCategoria() != null) c.setCategoria(c.getCategoria().trim());
        if (c.getIdioma() != null)    c.setIdioma(c.getIdioma().trim());
    }

    private String usuarioActualId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !isNotBlank(auth.getName()))
            throw new IllegalStateException("No hay usuario autenticado en el contexto.");
        String email = auth.getName();
        return usuarioRepositorio.findByEmail(email)
                .map(u -> u.getId())
                .orElseThrow(() -> new IllegalStateException("Usuario no encontrado para email: " + email));
    }

    private static boolean isNotBlank(String s) { return s != null && !s.isBlank(); }

    private static String escapeRegex(String s) {
        return s.replaceAll("([\\\\.*+?\\[^\\]$(){}=!<>|:\\-])", "\\\\$1");
    }

    private static Sort parseSort(String sort, String defField, Sort.Direction defDir) {
        if (sort == null || sort.isBlank()) return Sort.by(defDir, defField);
        String[] parts = sort.split(",");
        String field = parts[0].trim();
        if ("fechaCreacion".equalsIgnoreCase(field)) field = "createdAt";
        Sort.Direction dir = (parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim()))
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(dir, field);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> toMap(Object dto) {
        if (dto == null) return java.util.Map.of();
        if (dto instanceof Map<?, ?> m) {
            Map<String, Object> out = new HashMap<>();
            m.forEach((k, v) -> out.put(String.valueOf(k), v));
            return out;
        }
        Map<String, Object> out = new HashMap<>();
        Class<?> clazz = dto.getClass();
        try {
            if (clazz.isRecord()) {
                for (var comp : clazz.getRecordComponents()) {
                    try { out.put(comp.getName(), comp.getAccessor().invoke(dto)); } catch (Exception ignored) {}
                }
                return out;
            }
        } catch (Throwable ignored) {}
        for (var mtd : clazz.getMethods()) {
            if (mtd.getParameterCount() != 0) continue;
            String name = null, mn = mtd.getName();
            if (mn.startsWith("get") && mn.length() > 3 && !"getClass".equals(mn)) {
                name = Character.toLowerCase(mn.charAt(3)) + mn.substring(4);
            } else if (mn.startsWith("is") && mn.length() > 2) {
                name = Character.toLowerCase(mn.charAt(2)) + mn.substring(3);
            } else {
                if (!"getClass".equals(mn)) name = mn;
            }
            if (name != null) {
                try { out.put(name, mtd.invoke(dto)); } catch (Exception ignored) {}
            }
        }
        return out;
    }

    private static String reqStr(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v == null || v.toString().isBlank())
            throw new IllegalArgumentException("El campo '" + key + "' es obligatorio");
        return v.toString();
    }

    private static String optStr(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return (v == null) ? null : v.toString();
    }

    private static BigDecimal optBigDecimal(Map<String, Object> m, String key, BigDecimal def) {
        Object v = m.get(key);
        if (v == null) return def;
        if (v instanceof BigDecimal bd) return bd;
        if (v instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        try { return new BigDecimal(v.toString()); } catch (Exception e) { return def; }
    }

    private static Nivel parseNivel(String raw) {
        if (raw == null) return Nivel.PRINCIPIANTE;
        switch (raw.trim().toLowerCase()) {
            case "principiante":
            case "basico":
            case "básico": return Nivel.PRINCIPIANTE;
            case "intermedio": return Nivel.INTERMEDIO;
            case "avanzado": return Nivel.AVANZADO;
            default: throw new IllegalArgumentException("Nivel inválido: " + raw);
        }
    }

    private static EstadoCurso parseEstado(String raw) {
    String v = raw.trim().toLowerCase();
    switch (v) {
        case "publicado": return EstadoCurso.PUBLICADO;
        case "borrador":  return EstadoCurso.BORRADOR;
        case "oculto":    return EstadoCurso.OCULTO;
        case "archivado": return EstadoCurso.ARCHIVADO; // ✅ <--- agrega esto
        default: throw new IllegalArgumentException("Estado inválido: " + raw);
    }
}


    public Page<Curso> buscarAvanzado(
        String id,
        String idInstructor,
        String categoria,
        String q,
        String idioma,
        String nivel,
        String estado,
        java.math.BigDecimal minPrecio,
        java.math.BigDecimal maxPrecio,
        Boolean destacado,
        Boolean gratuito,
        java.util.List<String> tags,
        int page,
        int size,
        String sort
) {
    Query query = new Query();
    List<Criteria> ands = new ArrayList<>();

    // ✅ Comprobaciones seguras contra nulos y vacíos
    if (id != null && !id.isBlank()) {
        ands.add(Criteria.where("_id").is(id.trim()));
    }
    if (idInstructor != null && !idInstructor.isBlank()) {
        ands.add(Criteria.where("idInstructor").is(idInstructor.trim()));
    }
    if (categoria != null && !categoria.isBlank()) {
        ands.add(Criteria.where("categoria").is(categoria.trim()));
    }

    if (q != null && !q.isBlank()) {
        String regex = ".*" + escapeRegex(q.trim()) + ".*";
        ands.add(new Criteria().orOperator(
                Criteria.where("titulo").regex(regex, "i"),
                Criteria.where("descripcion").regex(regex, "i")
        ));
    }

    if (idioma != null && !idioma.isBlank()) {
        ands.add(Criteria.where("idioma").is(idioma.trim()));
    }

    if (nivel != null && !nivel.isBlank()) {
        ands.add(Criteria.where("nivel").is(parseNivel(nivel)));
    }

    if (estado != null && !estado.isBlank()) {
        ands.add(Criteria.where("estado").is(parseEstado(estado)));
    }

    if (minPrecio != null || maxPrecio != null) {
        Criteria c = Criteria.where("precio");
        if (minPrecio != null && maxPrecio != null)
            ands.add(c.gte(minPrecio).lte(maxPrecio));
        else if (minPrecio != null)
            ands.add(c.gte(minPrecio));
        else
            ands.add(c.lte(maxPrecio));
    }

    if (destacado != null) {
        ands.add(Criteria.where("destacado").is(destacado));
    }

    if (gratuito != null) {
        if (gratuito) {
            ands.add(new Criteria().orOperator(
                    Criteria.where("gratuito").is(true),
                    Criteria.where("precio").is(java.math.BigDecimal.ZERO)
            ));
        } else {
            ands.add(new Criteria().orOperator(
                    Criteria.where("gratuito").is(false),
                    Criteria.where("precio").gt(java.math.BigDecimal.ZERO)
            ));
        }
    }

    if (tags != null && !tags.isEmpty()) {
        ands.add(Criteria.where("etiquetas").all(tags));
    }

    if (!ands.isEmpty()) {
        query.addCriteria(new Criteria().andOperator(ands.toArray(new Criteria[0])));
    }

    Sort sortSpec = parseSort(sort, "createdAt", Sort.Direction.DESC);
    query.with(sortSpec);
    query.skip((long) page * size).limit(size);

    List<Curso> content = mongoTemplate.find(query, Curso.class, "cursos");
    long total = mongoTemplate.count(Query.of(query).limit(-1).skip(-1), Curso.class, "cursos");

    return new PageImpl<>(content,
            org.springframework.data.domain.PageRequest.of(page, size, sortSpec),
            total);
}

}
