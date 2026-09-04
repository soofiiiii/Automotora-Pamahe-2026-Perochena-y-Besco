package uy.edu.ctc.pamahe.modules.reportes.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.modules.clientes.repository.ClienteRepository;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.DashboardResponse;
import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.model.Refaccion;
import uy.edu.ctc.pamahe.modules.taller.repository.RefaccionRepository;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.repository.VehiculoRepository;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;

/**
 * Compone indicadores gerenciales a partir de datos ya validados por los
 * módulos operativos.
 * Por el momento solo prioriza métricas simples y verificables antes de
 * incorporar agregaciones avanzadas.
 */
@Service
public class ReporteService {
    private final VehiculoRepository vehiculoRepository;
    private final ClienteRepository clienteRepository;
    private final VentaRepository ventaRepository;
    private final RefaccionRepository refaccionRepository;

    public ReporteService(VehiculoRepository vehiculoRepository,
            ClienteRepository clienteRepository,
            VentaRepository ventaRepository,
            RefaccionRepository refaccionRepository) {
        this.vehiculoRepository = vehiculoRepository;
        this.clienteRepository = clienteRepository;
        this.ventaRepository = ventaRepository;
        this.refaccionRepository = refaccionRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse dashboard(LocalDate desde, LocalDate hasta) {
        LocalDate hoy = LocalDate.now();
        LocalDate inicio = desde == null ? hoy.withDayOfMonth(1) : desde;
        LocalDate fin = hasta == null ? hoy : hasta;
        if (inicio.isAfter(fin))
            throw new BusinessException("La fecha desde no puede ser posterior a la fecha hasta.");

        var vehiculos = this.vehiculoRepository.findByActivoTrueOrderByCreadoEnDesc();
        var ventas = this.ventaRepository.findByActivoTrueOrderByFechaVentaDesc();
        var ventasPeriodo = this.ventaRepository
                .findByActivoTrueAndFechaVentaBetweenOrderByFechaVentaDesc(inicio, fin);

        Map<String, Long> porEstado = Arrays.stream(EstadoVehiculo.values())
                .collect(Collectors.toMap(Enum::name,
                        estado -> vehiculos.stream().filter(v -> v.getEstado() == estado).count()));

        // Se utilizan los valores históricos de cada venta, no costos dinámicos del
        // vehículo.
        BigDecimal ingresos = ventas.stream().map(v -> v.getPrecioFinal()).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal rentabilidad = ventas.stream().map(v -> v.getRentabilidadCalculada()).reduce(BigDecimal.ZERO,
                BigDecimal::add);
        BigDecimal ingresosPeriodo = ventasPeriodo.stream().map(v -> v.getPrecioFinal()).reduce(BigDecimal.ZERO,
                BigDecimal::add);
        BigDecimal rentabilidadPeriodo = ventasPeriodo.stream().map(v -> v.getRentabilidadCalculada())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal inversionActual = this.refaccionRepository.findByActivoTrueOrderByFechaDesc().stream()
                .filter(r -> r.getEstadoTarea() != EstadoTarea.CANCELADA)
                .filter(r -> Boolean.TRUE.equals(r.getVehiculo().getActivo()))
                .filter(r -> r.getVehiculo().getEstado() != EstadoVehiculo.VENDIDO)
                .map(Refaccion::costoTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new DashboardResponse(
                vehiculos.size(),
                porEstado.getOrDefault(EstadoVehiculo.EN_TALLER.name(), 0L),
                porEstado.getOrDefault(EstadoVehiculo.DISPONIBLE.name(), 0L),
                ventas.size(), // fuente histórica: una baja lógica del vehículo no borra la venta
                this.clienteRepository.findByActivoTrueOrderByNombreAsc().size(),
                ventas.size(), ingresos, rentabilidad, porEstado,
                inicio, fin, ventasPeriodo.size(), ingresosPeriodo, rentabilidadPeriodo,
                inversionActual);
    }
}
