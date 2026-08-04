package uy.edu.ctc.pamahe.modules.vehiculos.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

import uy.edu.ctc.pamahe.modules.vehiculos.model.*;

public interface VehiculoRepository extends JpaRepository<Vehiculo, Long> {

    List<Vehiculo> findByActivoTrueOrderByCreadoEnDesc();

    List<Vehiculo> findByActivoTrueAndPublicadoTrueAndEstadoOrderByCreadoEnDesc(EstadoVehiculo estado);

    // Serializa decisiones concurrentes sobre estado, compra, venta o taller de la misma unidad.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from Vehiculo v where v.id = :id")
    Optional<Vehiculo> findByIdForUpdate(@Param("id") Long id);
}
