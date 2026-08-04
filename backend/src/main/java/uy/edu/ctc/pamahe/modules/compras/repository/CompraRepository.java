package uy.edu.ctc.pamahe.modules.compras.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import uy.edu.ctc.pamahe.modules.compras.model.Compra;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;

public interface CompraRepository extends JpaRepository<Compra, Long> {
    boolean existsByVehiculo(Vehiculo vehiculo);
    boolean existsByVehiculoAndActivoTrue(Vehiculo vehiculo);
    Optional<Compra> findByVehiculo(Vehiculo vehiculo);
    Optional<Compra> findByVehiculoAndActivoTrue(Vehiculo vehiculo);
    List<Compra> findByActivoTrueOrderByFechaCompraDesc();
}
