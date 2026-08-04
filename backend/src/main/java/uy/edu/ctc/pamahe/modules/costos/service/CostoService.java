package uy.edu.ctc.pamahe.modules.costos.service;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.modules.compras.model.Compra;
import uy.edu.ctc.pamahe.modules.compras.repository.CompraRepository;
import uy.edu.ctc.pamahe.modules.costos.dto.response.CostoVehiculoResponse;
import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.model.Refaccion;
import uy.edu.ctc.pamahe.modules.taller.repository.RefaccionRepository;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.service.VehiculoService;
import uy.edu.ctc.pamahe.modules.ventas.model.Venta;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;

/**
 * Centraliza la fórmula económica usada por ventas, consultas y reportes.
 * Antes de vender calcula sobre datos vigentes; después de vender devuelve la fotografía histórica
 * guardada en la venta para que cambios posteriores no alteren el resultado cerrado.
 */
@Service
public class CostoService {
    private final VehiculoService vehiculoService;
    private final CompraRepository compraRepository;
    private final RefaccionRepository refaccionRepository;
    private final VentaRepository ventaRepository;

    public CostoService(VehiculoService vehiculoService,
                        CompraRepository compraRepository,
                        RefaccionRepository refaccionRepository,
                        VentaRepository ventaRepository) {
        this.vehiculoService = vehiculoService;
        this.compraRepository = compraRepository;
        this.refaccionRepository = refaccionRepository;
        this.ventaRepository = ventaRepository;
    }

    @Transactional(readOnly = true)
    public CostoVehiculoResponse calcular(Long vehiculoId) {
        Vehiculo vehiculo = this.vehiculoService.buscarActivoPorId(vehiculoId);
        // Una venta cerrada prevalece sobre el cálculo dinámico para conservar el valor conocido al vender.
        return this.ventaRepository.findByVehiculoAndActivoTrue(vehiculo)
                .map(this::respuestaHistorica)
                .orElseGet(() -> {
                    CostoSnapshot snapshot = this.calcularActualParaVenta(vehiculo);
                    return new CostoVehiculoResponse(
                            vehiculoId,
                            snapshot.costoCompra(),
                            snapshot.costoRefacciones(),
                            snapshot.costoTotal(),
                            null,
                            null,
                            false
                    );
                });
    }

    @Transactional(readOnly = true)
    public CostoSnapshot calcularActualParaVenta(Vehiculo vehiculo) {
        Compra compra = this.compraRepository.findByVehiculoAndActivoTrue(vehiculo)
                .orElseThrow(() -> new BusinessException("El vehículo no posee una compra activa registrada."));
        BigDecimal costoRefacciones = this.refaccionRepository
                // Las tareas canceladas no representan inversión efectiva y se excluyen del costo acumulado.
                .findByVehiculoAndActivoTrueAndEstadoTareaNotOrderByFechaDesc(
                        vehiculo,
                        EstadoTarea.CANCELADA)
                .stream()
                .map(Refaccion::costoTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal costoCompra = compra.getCostoAdquisicion();
        return new CostoSnapshot(costoCompra, costoRefacciones, costoCompra.add(costoRefacciones));
    }

    private CostoVehiculoResponse respuestaHistorica(Venta venta) {
        return new CostoVehiculoResponse(
                venta.getVehiculo().getId(),
                venta.getCostoCompraAlVender(),
                venta.getCostoRefaccionesAlVender(),
                venta.getCostoTotalAlVender(),
                venta.getPrecioFinal(),
                venta.getRentabilidadCalculada(),
                true
        );
    }

    public record CostoSnapshot(
            BigDecimal costoCompra,
            BigDecimal costoRefacciones,
            BigDecimal costoTotal
    ) {
    }
}

