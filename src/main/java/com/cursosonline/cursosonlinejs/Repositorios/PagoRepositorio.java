package com.cursosonline.cursosonlinejs.Repositorios;

import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.cursosonline.cursosonlinejs.Entidades.Pago;

public interface PagoRepositorio extends MongoRepository<Pago, String> {

    List<Pago> findByIdInscripcion(String idInscripcion);

    boolean existsByIdInscripcionAndEstado(String idInscripcion, Pago.EstadoPago estado);
    Optional<Pago> findByReferencia(String referencia);
    Optional<Pago> findByIdAndIdInscripcion(String id, String idInscripcion);
    
}
