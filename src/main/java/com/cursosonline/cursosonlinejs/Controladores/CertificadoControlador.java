package com.cursosonline.cursosonlinejs.Controladores;

import com.cursosonline.cursosonlinejs.Entidades.Certificado;
import com.cursosonline.cursosonlinejs.Servicios.CertificadoServicio;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.parameters.P;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "http://localhost:9090", allowCredentials = "true")
public class CertificadoControlador {

    private final CertificadoServicio certificadoServicio;

    public CertificadoControlador(CertificadoServicio certificadoServicio) {
        this.certificadoServicio = certificadoServicio;
    }

    @PostMapping("/cursos/{idCurso}/certificados")
    @PreAuthorize("hasRole('ADMIN') or @certPermisos.esInstructorDelCurso(#idCurso)")
    public ResponseEntity<?> emitir(@PathVariable("idCurso") @P("idCurso") String idCurso,
                                    @Valid @RequestBody EmitirCertificadoRequest body) {
        try {
            var creado = certificadoServicio.emitir(idCurso, body.idEstudiante());
            if (creado.isEmpty()) {
                return ResponseEntity.status(409).body(Map.of("message", "Ya existe certificado para este curso y estudiante."));
            }
            var c = creado.get();
            return ResponseEntity.created(URI.create("/api/v1/certificados/" + c.getId())).body(c);
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @GetMapping("/certificados/{id}")
    @PreAuthorize("hasRole('ADMIN') or @certPermisos.puedeVerCertificado(#id)")
    public ResponseEntity<?> obtener(@PathVariable String id) {
        return certificadoServicio.buscarPorId(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/certificados/verificar/{codigo}")
    public ResponseEntity<?> verificar(@PathVariable String codigo) {
        return certificadoServicio.buscarPorCodigo(codigo)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/cursos/{idCurso}/certificados")
    @PreAuthorize("hasRole('ADMIN') or @certPermisos.esInstructorDelCurso(#idCurso)")
    public ResponseEntity<?> listarPorCurso(@PathVariable String idCurso) {
        List<Certificado> lista = certificadoServicio.listarPorCurso(idCurso);
        return lista.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(lista);
    }

    @GetMapping("/estudiantes/{idEstudiante}/certificados")
    @PreAuthorize("hasRole('ADMIN') or @certPermisos.esMismoEstudiante(#idEstudiante)")
    public ResponseEntity<?> listarPorEstudiante(@PathVariable String idEstudiante) {
        List<Certificado> lista = certificadoServicio.listarPorEstudiante(idEstudiante);
        return lista.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(lista);
    }

    @PatchMapping("/certificados/{id}/revocar")
    @PreAuthorize("hasRole('ADMIN') or @certPermisos.esInstructorDeCertificado(#id)")
    public ResponseEntity<?> revocar(@PathVariable String id) {
        return certificadoServicio.revocar(id)
                .<ResponseEntity<?>>map(c -> ResponseEntity.ok(Map.of(
                        "message", "Certificado revocado.",
                        "certificado", c
                )))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/certificados/{id}")
    @PreAuthorize("hasRole('ADMIN') or @certPermisos.esInstructorDeCertificado(#id)")
    public ResponseEntity<?> eliminar(@PathVariable String id) {
        var opt = certificadoServicio.buscarPorId(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        certificadoServicio.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    public static class EmitirCertificadoRequest {
        @NotBlank
        private String idEstudiante;
        public String idEstudiante() { return idEstudiante; }
        public void setIdEstudiante(String idEstudiante) { this.idEstudiante = idEstudiante; }
    }
}
