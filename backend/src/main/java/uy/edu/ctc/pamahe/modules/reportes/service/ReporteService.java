package uy.edu.ctc.pamahe.modules.reportes.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.modules.auditoria.model.Auditoria;
import uy.edu.ctc.pamahe.modules.auditoria.repository.AuditoriaRepository;
import uy.edu.ctc.pamahe.modules.clientes.repository.ClienteRepository;
import uy.edu.ctc.pamahe.modules.compras.model.Compra;
import uy.edu.ctc.pamahe.modules.compras.repository.CompraRepository;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.DashboardResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteCompraItemResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteComprasResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteRefaccionItemResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteRefaccionesResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteRentabilidadResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteStockResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteVehiculoStockItemResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteVentaItemResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteVentasResponse;
import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.model.Refaccion;
import uy.edu.ctc.pamahe.modules.taller.repository.RefaccionRepository;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.repository.VehiculoRepository;
import uy.edu.ctc.pamahe.modules.ventas.model.Venta;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;

/**
 * Capa de consultas gerenciales.
 * Los reportes monetarios usan valores persistidos y snapshots de venta,
 * evitando reconstruir
 * rentabilidades históricas a partir de costos actuales del vehículo.
 */
@Service
public class ReporteService {

        private static final Pattern ESTADO_AUDITORIA_PATTERN = Pattern.compile("(?:^|,\\s*)estado=([A-Z_]+)(?:,|$)");
        private static final Pattern PUBLICADO_AUDITORIA_PATTERN = Pattern
                        .compile("(?:^|,\\s*)publicado=(true|false)(?:,|$)", Pattern.CASE_INSENSITIVE);

        private final AuditoriaRepository auditoriaRepository;
        private final VehiculoRepository vehiculoRepository;
        private final ClienteRepository clienteRepository;
        private final VentaRepository ventaRepository;
        private final CompraRepository compraRepository;
        private final RefaccionRepository refaccionRepository;

        public ReporteService(VehiculoRepository vehiculoRepository,
                        ClienteRepository clienteRepository,
                        VentaRepository ventaRepository,
                        CompraRepository compraRepository,
                        RefaccionRepository refaccionRepository, AuditoriaRepository auditoriaRepository) {
                this.vehiculoRepository = vehiculoRepository;
                this.clienteRepository = clienteRepository;
                this.ventaRepository = ventaRepository;
                this.compraRepository = compraRepository;
                this.refaccionRepository = refaccionRepository;
                this.auditoriaRepository = auditoriaRepository;
        }

        @Transactional(readOnly = true)
        public DashboardResponse dashboard(LocalDate desde, LocalDate hasta) {
                Periodo periodo = resolverPeriodo(desde, hasta);
                var vehiculos = this.vehiculoRepository.findByActivoTrueOrderByCreadoEnDesc();
                var ventas = this.ventaRepository.findByActivoTrueOrderByFechaVentaDesc();
                var ventasPeriodo = this.ventaRepository
                                .findByActivoTrueAndFechaVentaBetweenOrderByFechaVentaDesc(periodo.desde(),
                                                periodo.hasta());

                Map<String, Long> porEstado = Arrays.stream(EstadoVehiculo.values())
                                .collect(Collectors.toMap(
                                                estado -> estado.name(),
                                                estado -> vehiculos.stream().filter(v -> v.getEstado() == estado)
                                                                .count()));

                BigDecimal ingresos = sumar(ventas.stream().map(Venta::getPrecioFinal).toList());
                BigDecimal rentabilidad = sumar(ventas.stream().map(Venta::getRentabilidadCalculada).toList());
                BigDecimal ingresosPeriodo = sumar(ventasPeriodo.stream().map(Venta::getPrecioFinal).toList());
                BigDecimal rentabilidadPeriodo = sumar(
                                ventasPeriodo.stream().map(Venta::getRentabilidadCalculada).toList());

                BigDecimal inversionActual = sumar(
                                this.refaccionRepository.findByActivoTrueOrderByFechaDesc().stream()
                                                .filter(r -> r.getEstadoTarea() != EstadoTarea.CANCELADA)
                                                .filter(r -> Boolean.TRUE.equals(r.getVehiculo().getActivo()))
                                                .filter(r -> r.getVehiculo().getEstado() != EstadoVehiculo.VENDIDO)
                                                .map(Refaccion::costoTotal)
                                                .toList());

                return new DashboardResponse(
                                vehiculos.size(),
                                porEstado.getOrDefault(EstadoVehiculo.EN_TALLER.name(), 0L),
                                porEstado.getOrDefault(EstadoVehiculo.DISPONIBLE.name(), 0L),
                                ventas.size(),
                                this.clienteRepository.findByActivoTrueOrderByNombreAsc().size(),
                                ventas.size(),
                                ingresos,
                                rentabilidad,
                                porEstado,
                                periodo.desde(),
                                periodo.hasta(),
                                ventasPeriodo.size(),
                                ingresosPeriodo,
                                rentabilidadPeriodo,
                                inversionActual);
        }

        @Transactional(readOnly = true)
        public ReporteVentasResponse ventas(LocalDate desde, LocalDate hasta) {
                Periodo periodo = resolverPeriodo(desde, hasta);
                List<Venta> ventas = this.ventaRepository
                                .findByActivoTrueAndFechaVentaBetweenOrderByFechaVentaDesc(periodo.desde(),
                                                periodo.hasta());
                List<ReporteVentaItemResponse> items = ventas.stream().map(this::toVentaItem).toList();
                return new ReporteVentasResponse(
                                periodo.desde(),
                                periodo.hasta(),
                                ventas.size(),
                                sumar(ventas.stream().map(Venta::getPrecioFinal).toList()),
                                sumar(ventas.stream().map(Venta::getCostoTotalAlVender).toList()),
                                sumar(ventas.stream().map(Venta::getRentabilidadCalculada).toList()),
                                items);
        }

        @Transactional(readOnly = true)
        public ReporteComprasResponse compras(LocalDate desde, LocalDate hasta) {
                Periodo periodo = resolverPeriodo(desde, hasta);
                List<Compra> compras = this.compraRepository
                                .findByActivoTrueAndFechaCompraBetweenOrderByFechaCompraDesc(periodo.desde(),
                                                periodo.hasta());
                List<ReporteCompraItemResponse> items = compras.stream()
                                .map(c -> new ReporteCompraItemResponse(
                                                c.getId(),
                                                c.getVehiculo().getId(),
                                                nombreVehiculo(c.getVehiculo().getMarca(), c.getVehiculo().getModelo(),
                                                                c.getVehiculo().getAnio()),
                                                c.getFechaCompra(),
                                                c.getCostoAdquisicion()))
                                .toList();
                return new ReporteComprasResponse(
                                periodo.desde(),
                                periodo.hasta(),
                                compras.size(),
                                sumar(compras.stream().map(Compra::getCostoAdquisicion).toList()),
                                items);
        }

        @Transactional(readOnly = true)
        public ReporteStockResponse stock(LocalDate desde, LocalDate hasta) {
                Periodo periodo = resolverPeriodo(desde, hasta);

                /*
                 * Vehículos comprados específicamente dentro del período solicitado.
                 */
                List<Compra> comprasPeriodo = this.compraRepository
                                .findByActivoTrueAndFechaCompraBetweenOrderByFechaCompraDesc(
                                                periodo.desde(),
                                                periodo.hasta());

                /*
                 * Para reconstruir el stock al cierre deben considerarse todas
                 * las compras realizadas hasta la fecha final.
                 */
                List<Compra> comprasHastaCierre = this.compraRepository
                                .findByActivoTrueAndFechaCompraLessThanEqualOrderByFechaCompraDesc(
                                                periodo.hasta());

                /*
                 * Vehículos que ya habían sido vendidos al llegar a la fecha de cierre.
                 */
                Set<Long> vehiculosVendidosHastaCierre = this.ventaRepository
                                .findByActivoTrueAndFechaVentaLessThanEqualOrderByFechaVentaDesc(
                                                periodo.hasta())
                                .stream()
                                .filter(venta -> venta.getVehiculo() != null)
                                .map(venta -> venta.getVehiculo().getId())
                                .filter(Objects::nonNull)
                                .collect(Collectors.toSet());

                /*
                 * Formaban parte del stock al cierre aquellos vehículos cuya compra
                 * ya había ocurrido y cuya venta todavía no se había producido.
                 */
                List<Compra> stockAlCierre = comprasHastaCierre.stream()
                                .filter(compra -> compra.getVehiculo() != null)
                                .filter(compra -> compra.getVehiculo().getId() != null)
                                .filter(compra -> !vehiculosVendidosHastaCierre.contains(
                                                compra.getVehiculo().getId()))
                                .toList();

                /*
                 * Reconstruye estado y publicación que tenía cada vehículo
                 * exactamente al cierre del período solicitado.
                 */
                Map<Long, EstadoHistoricoVehiculo> situacionHistorica = reconstruirSituacionVehiculos(
                                stockAlCierre,
                                periodo.hasta());

                List<ReporteVehiculoStockItemResponse> items = stockAlCierre.stream()
                                .map(compra -> {
                                        var vehiculo = compra.getVehiculo();

                                        EstadoHistoricoVehiculo situacion = situacionHistorica.getOrDefault(
                                                        vehiculo.getId(),
                                                        new EstadoHistoricoVehiculo(
                                                                        EstadoVehiculo.COMPRADO,
                                                                        false));

                                        return new ReporteVehiculoStockItemResponse(
                                                        vehiculo.getId(),
                                                        vehiculo.getMarca(),
                                                        vehiculo.getModelo(),
                                                        vehiculo.getAnio(),
                                                        vehiculo.getTipoVehiculo(),
                                                        situacion.estado(),
                                                        situacion.publicado(),
                                                        vehiculo.getPrecioVentaEstimado(),
                                                        compra.getFechaCompra());
                                })
                                .toList();

                long disponibles = items.stream()
                                .filter(item -> item.estado() == EstadoVehiculo.DISPONIBLE)
                                .count();

                long publicados = items.stream()
                                .filter(item -> Boolean.TRUE.equals(item.publicado()))
                                .count();

                return new ReporteStockResponse(
                                periodo.desde(),
                                periodo.hasta(),
                                comprasPeriodo.size(),
                                stockAlCierre.size(),
                                disponibles,
                                publicados,
                                false,
                                items);
        }

        @Transactional(readOnly = true)
        public ReporteVentasResponse vendidos(LocalDate desde, LocalDate hasta) {
                return ventas(desde, hasta);
        }

        @Transactional(readOnly = true)
        public ReporteRefaccionesResponse refacciones(LocalDate desde, LocalDate hasta) {
                Periodo periodo = resolverPeriodo(desde, hasta);
                List<Refaccion> refacciones = this.refaccionRepository
                                .findByActivoTrueAndFechaBetweenOrderByFechaDesc(periodo.desde(), periodo.hasta())
                                .stream()
                                .filter(r -> r.getEstadoTarea() != EstadoTarea.CANCELADA)
                                .toList();

                List<ReporteRefaccionItemResponse> items = refacciones.stream()
                                .map(r -> new ReporteRefaccionItemResponse(
                                                r.getId(),
                                                r.getVehiculo().getId(),
                                                nombreVehiculo(r.getVehiculo().getMarca(), r.getVehiculo().getModelo(),
                                                                r.getVehiculo().getAnio()),
                                                r.getFecha(),
                                                r.getTipoTrabajo(),
                                                r.getEstadoTarea(),
                                                r.getCostoRepuestos(),
                                                r.getCostoManoObra(),
                                                r.getCostoServiciosExternos(),
                                                r.costoTotal()))
                                .toList();

                return new ReporteRefaccionesResponse(
                                periodo.desde(),
                                periodo.hasta(),
                                refacciones.size(),
                                sumar(refacciones.stream().map(Refaccion::getCostoRepuestos).toList()),
                                sumar(refacciones.stream().map(Refaccion::getCostoManoObra).toList()),
                                sumar(refacciones.stream().map(Refaccion::getCostoServiciosExternos).toList()),
                                sumar(refacciones.stream().map(Refaccion::costoTotal).toList()),
                                items);
        }

        @Transactional(readOnly = true)
        public ReporteRentabilidadResponse rentabilidad(LocalDate desde, LocalDate hasta) {
                Periodo periodo = resolverPeriodo(desde, hasta);
                List<Venta> ventas = this.ventaRepository
                                .findByActivoTrueAndFechaVentaBetweenOrderByFechaVentaDesc(periodo.desde(),
                                                periodo.hasta());
                BigDecimal ingresos = sumar(ventas.stream().map(Venta::getPrecioFinal).toList());
                BigDecimal costo = sumar(ventas.stream().map(Venta::getCostoTotalAlVender).toList());
                BigDecimal rentabilidad = sumar(ventas.stream().map(Venta::getRentabilidadCalculada).toList());
                BigDecimal margen = ingresos.compareTo(BigDecimal.ZERO) == 0
                                ? BigDecimal.ZERO
                                : rentabilidad.multiply(BigDecimal.valueOf(100)).divide(ingresos, 2,
                                                RoundingMode.HALF_UP);

                return new ReporteRentabilidadResponse(
                                periodo.desde(),
                                periodo.hasta(),
                                ventas.size(),
                                ingresos,
                                costo,
                                rentabilidad,
                                margen,
                                ventas.stream().map(this::toVentaItem).toList());
        }

        private EstadoVehiculo extraerEstado(String valoresNuevos, EstadoVehiculo valorAnterior) {
                if (valoresNuevos == null || valoresNuevos.isBlank()) {
                        return valorAnterior;
                }
                Matcher matcher = ESTADO_AUDITORIA_PATTERN.matcher(valoresNuevos);
                if (!matcher.find()) {
                        return valorAnterior;
                }
                try {
                        return EstadoVehiculo.valueOf(matcher.group(1));
                } catch (IllegalArgumentException ex) {
                        return valorAnterior;
                }
        }

        private boolean extraerPublicado(
                        String valoresNuevos,
                        boolean valorAnterior) {

                if (valoresNuevos == null || valoresNuevos.isBlank()) {
                        return valorAnterior;
                }

                Matcher matcher = PUBLICADO_AUDITORIA_PATTERN.matcher(valoresNuevos);

                if (!matcher.find()) {
                        return valorAnterior;
                }

                return Boolean.parseBoolean(matcher.group(1));
        }

        private Map<Long, EstadoHistoricoVehiculo> reconstruirSituacionVehiculos(
                        List<Compra> stockAlCierre,
                        LocalDate hasta) {

                Map<Long, EstadoHistoricoVehiculo> resultado = new HashMap<>();

                /*
                 * Todo vehículo comienza su ciclo en COMPRADO y no publicado.
                 * Esta es la base conocida sobre la que se reproducen los cambios
                 * registrados posteriormente en auditoría.
                 */
                for (Compra compra : stockAlCierre) {
                        var vehiculo = compra.getVehiculo();

                        resultado.put(
                                        vehiculo.getId(),
                                        new EstadoHistoricoVehiculo(
                                                        EstadoVehiculo.COMPRADO,
                                                        false));
                }

                if (resultado.isEmpty()) {
                        return resultado;
                }

                /*
                 * Incluye todos los eventos producidos durante el día "hasta".
                 */
                LocalDateTime hastaExclusivo = hasta.plusDays(1).atStartOfDay();

                List<Auditoria> historial = this.auditoriaRepository
                                .buscarHistorialVehiculosHasta(
                                                resultado.keySet(),
                                                hastaExclusivo);

                /*
                 * Los eventos llegan ordenados cronológicamente.
                 * Cada uno modifica la última situación conocida.
                 */
                for (Auditoria auditoria : historial) {
                        Long vehiculoId = auditoria.getEntidadId();

                        EstadoHistoricoVehiculo anterior = resultado.get(vehiculoId);

                        if (anterior == null) {
                                continue;
                        }

                        String valoresNuevos = auditoria.getValoresNuevos();

                        EstadoVehiculo estado = extraerEstado(
                                        valoresNuevos,
                                        anterior.estado());

                        boolean publicado = extraerPublicado(
                                        valoresNuevos,
                                        anterior.publicado());

                        resultado.put(
                                        vehiculoId,
                                        new EstadoHistoricoVehiculo(
                                                        estado,
                                                        publicado));
                }

                return resultado;
        }

        private ReporteVentaItemResponse toVentaItem(Venta venta) {
                return new ReporteVentaItemResponse(
                                venta.getId(),
                                venta.getVehiculo().getId(),
                                nombreVehiculo(venta.getVehiculo().getMarca(), venta.getVehiculo().getModelo(),
                                                venta.getVehiculo().getAnio()),
                                venta.getFechaVenta(),
                                venta.getPrecioFinal(),
                                venta.getCostoTotalAlVender(),
                                venta.getRentabilidadCalculada());
        }

        private Periodo resolverPeriodo(LocalDate desde, LocalDate hasta) {
                LocalDate hoy = LocalDate.now();
                LocalDate inicio = desde == null ? hoy.withDayOfMonth(1) : desde;
                LocalDate fin = hasta == null ? hoy : hasta;
                if (inicio.isAfter(fin)) {
                        throw new BusinessException("La fecha desde no puede ser posterior a la fecha hasta.");
                }
                return new Periodo(inicio, fin);
        }

        private BigDecimal sumar(List<BigDecimal> valores) {
                return valores.stream()
                                .filter(java.util.Objects::nonNull)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        private String nombreVehiculo(String marca, String modelo, Integer anio) {
                return (marca + " " + modelo + " " + anio).trim();
        }

        private record Periodo(
                        LocalDate desde,
                        LocalDate hasta) {
        }

        private record EstadoHistoricoVehiculo(
                        EstadoVehiculo estado,
                        boolean publicado) {
        }
}
