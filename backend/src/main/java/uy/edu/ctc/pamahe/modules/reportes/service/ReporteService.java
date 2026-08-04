package uy.edu.ctc.pamahe.modules.reportes.service;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import uy.edu.ctc.pamahe.modules.clientes.repository.ClienteRepository;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.DashboardResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.repository.VehiculoRepository;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;

/**
 * Compone indicadores gerenciales a partir de datos ya validados por los módulos operativos.
 * Por el momento solo prioriza métricas simples y verificables antes de incorporar agregaciones avanzadas.
 */
@Service
public class ReporteService {
    private final VehiculoRepository vehiculoRepository;
    private final ClienteRepository clienteRepository;
    private final VentaRepository ventaRepository;

    public ReporteService(VehiculoRepository vehiculoRepository, ClienteRepository clienteRepository, VentaRepository ventaRepository) {
        this.vehiculoRepository = vehiculoRepository;
        this.clienteRepository = clienteRepository;
        this.ventaRepository = ventaRepository;
    }

    public DashboardResponse dashboard() {
        var vehiculos = this.vehiculoRepository.findByActivoTrueOrderByCreadoEnDesc();
        var ventas = this.ventaRepository.findByActivoTrueOrderByFechaVentaDesc();
        Map<String, Long> porEstado = Arrays.stream(EstadoVehiculo.values())
                .collect(Collectors.toMap(Enum::name, estado -> vehiculos.stream().filter(v -> v.getEstado() == estado).count()));
        // Se utilizan los valores históricos de cada venta, no costos dinámicos del vehículo.
        BigDecimal ingresos = ventas.stream().map(v -> v.getPrecioFinal()).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal rentabilidad = ventas.stream().map(v -> v.getRentabilidadCalculada()).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new DashboardResponse(
                vehiculos.size(),
                vehiculos.stream().filter(v -> v.getEstado() == EstadoVehiculo.EN_TALLER).count(),
                vehiculos.stream().filter(v -> v.getEstado() == EstadoVehiculo.DISPONIBLE).count(),
                vehiculos.stream().filter(v -> v.getEstado() == EstadoVehiculo.VENDIDO).count(),
                this.clienteRepository.findByActivoTrueOrderByNombreAsc().size(),
                ventas.size(),
                ingresos,
                rentabilidad,
                porEstado
        );
    }
}
