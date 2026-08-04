package uy.edu.ctc.pamahe.modules.ventas.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.ventas.model.Venta;

public interface VentaRepository extends JpaRepository<Venta, Long> {
    boolean existsByVehiculo(Vehiculo vehiculo);
    boolean existsByVehiculoAndActivoTrue(Vehiculo vehiculo);
    Optional<Venta> findByVehiculo(Vehiculo vehiculo);
    Optional<Venta> findByVehiculoAndActivoTrue(Vehiculo vehiculo);
    List<Venta> findByActivoTrueOrderByFechaVentaDesc();
    List<Venta> findByActivoTrueAndFechaVentaBetweenOrderByFechaVentaDesc(LocalDate desde, LocalDate hasta);
}