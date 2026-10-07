package uy.edu.ctc.pamahe.modules.taller.idempotency;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface RefaccionOperacionOfflineRepository extends JpaRepository<RefaccionOperacionOffline, String> {

    /**
     * INSERT IGNORE previene condiciones de carrera serializando
     * la inserción mediante la clave primaria en MySQL. Se usa para el control de concurrencia.
     */
    @Modifying(flushAutomatically = true)
    @Query(value = """
            INSERT IGNORE INTO refaccion_operaciones_offline
                (id_operacion, request_hash, creado_en, actualizado_en)
            VALUES
                (:idOperacion, :requestHash, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6))
            """, nativeQuery = true)
    int reservarSiAusente(@Param("idOperacion") String idOperacion,
            @Param("requestHash") String requestHash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from RefaccionOperacionOffline o where o.idOperacion = :idOperacion")
    Optional<RefaccionOperacionOffline> bloquearPorId(@Param("idOperacion") String idOperacion);
}
