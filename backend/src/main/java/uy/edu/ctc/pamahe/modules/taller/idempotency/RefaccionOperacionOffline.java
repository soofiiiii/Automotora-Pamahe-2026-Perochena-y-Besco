package uy.edu.ctc.pamahe.modules.taller.idempotency;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Control de concurrencia mediante reserva de clave de idempotencia para evitar refacciones duplicadas. */
@Entity
@Table(name = "refaccion_operaciones_offline")
public class RefaccionOperacionOffline {

    @Id
    @Column(name = "id_operacion", nullable = false, length = 100)
    private String idOperacion;

    @Column(name = "request_hash", nullable = false, length = 64)
    private String requestHash;

    @Column(name = "refaccion_id", unique = true)
    private Long refaccionId;

    @Column(name = "creado_en", nullable = false, insertable = false, updatable = false)
    private LocalDateTime creadoEn;

    @Column(name = "actualizado_en", nullable = false, insertable = false, updatable = false)
    private LocalDateTime actualizadoEn;

    public String getIdOperacion() {
        return this.idOperacion;
    }

    public void setIdOperacion(String idOperacion) {
        this.idOperacion = idOperacion;
    }

    public String getRequestHash() {
        return this.requestHash;
    }

    public void setRequestHash(String requestHash) {
        this.requestHash = requestHash;
    }

    public Long getRefaccionId() {
        return this.refaccionId;
    }

    public void setRefaccionId(Long refaccionId) {
        this.refaccionId = refaccionId;
    }

    public LocalDateTime getCreadoEn() {
        return this.creadoEn;
    }

    public LocalDateTime getActualizadoEn() {
        return this.actualizadoEn;
    }
}
