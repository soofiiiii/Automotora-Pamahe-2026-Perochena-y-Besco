package uy.edu.ctc.pamahe.modules.imagenes.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import uy.edu.ctc.pamahe.modules.imagenes.model.ImagenVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;

public interface ImagenVehiculoRepository extends JpaRepository<ImagenVehiculo, Long> {
    List<ImagenVehiculo> findByVehiculoAndActivoTrueOrderByPrincipalDescIdAsc(Vehiculo vehiculo);
    List<ImagenVehiculo> findByVehiculoAndActivoTrueAndPublicaTrueOrderByPrincipalDescIdAsc(Vehiculo vehiculo);
    List<ImagenVehiculo> findByVehiculoInAndActivoTrueAndPublicaTrueOrderByPrincipalDescIdAsc(List<Vehiculo> vehiculos);

    // La selección de una principal desmarca las demás dentro de la misma transacción.
    @Modifying(flushAutomatically = true)
    @Query("update ImagenVehiculo i set i.principal = false where i.vehiculo = :vehiculo and i.activo = true and i.id <> :imagenId")
    int quitarPrincipalDeOtras(@Param("vehiculo") Vehiculo vehiculo, @Param("imagenId") Long imagenId);
}

