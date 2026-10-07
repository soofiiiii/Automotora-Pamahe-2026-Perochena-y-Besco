package uy.edu.ctc.pamahe.modules.exportaciones.service;

import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.modules.clientes.repository.ClienteRepository;
import uy.edu.ctc.pamahe.modules.compras.repository.CompraRepository;
import uy.edu.ctc.pamahe.modules.costos.service.CostoService;
import uy.edu.ctc.pamahe.modules.taller.repository.RefaccionRepository;
import uy.edu.ctc.pamahe.modules.vehiculos.repository.VehiculoRepository;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;

@Service
public class CsvExportService {

    private final VehiculoRepository vehiculos;
    private final ClienteRepository clientes;
    private final VentaRepository ventas;
    private final CompraRepository compras;
    private final RefaccionRepository refacciones;
    private final CostoService costoService;

    public CsvExportService(VehiculoRepository vehiculos, ClienteRepository clientes, VentaRepository ventas,
            CompraRepository compras, RefaccionRepository refacciones, CostoService costoService) {
        this.vehiculos = vehiculos;
        this.clientes = clientes;
        this.ventas = ventas;
        this.compras = compras;
        this.refacciones = refacciones;
        this.costoService = costoService;
    }

    @Transactional(readOnly = true)
    public String vehiculos() {
        StringBuilder b = header("id", "marca", "modelo", "tipoVehiculo", "anio", "estado", "ubicacionActual",
                "precioVentaEstimado", "publicado");
        vehiculos.findByActivoTrueOrderByCreadoEnDesc().forEach(v -> row(b, v.getId(), v.getMarca(), v.getModelo(),
                v.getTipoVehiculo(), v.getAnio(), v.getEstado(), v.getUbicacionActual(), v.getPrecioVentaEstimado(),
                v.getPublicado()));
        return b.toString();
    }

    @Transactional(readOnly = true)
    public String clientes() {
        StringBuilder b = header("id", "nombre", "apellido", "documento", "tipoCliente", "telefono", "email");
        clientes.findByActivoTrueOrderByNombreAsc().forEach(c -> row(b, c.getId(), c.getNombre(), c.getApellido(),
                c.getDocumento(), c.getTipoCliente(), c.getTelefono(), c.getEmail()));
        return b.toString();
    }

    @Transactional(readOnly = true)
    public String ventas(LocalDate desde, LocalDate hasta) {
        Periodo periodo = resolverPeriodo(desde, hasta);
        StringBuilder b = header("id", "vehiculoId", "clienteCompradorId", "fechaVenta", "precioFinal",
                "medioPago", "entidadFinanciera", "montoFinanciado", "estadoFinanciacion", "canalOrigen",
                "seguimientoPostventaRealizado", "rentabilidad");
        ventas.findByActivoTrueAndFechaVentaBetweenOrderByFechaVentaDesc(periodo.desde(), periodo.hasta())
                .forEach(v -> row(b, v.getId(), v.getVehiculo().getId(), v.getClienteComprador().getId(),
                        v.getFechaVenta(), v.getPrecioFinal(), v.getMedioPago(), v.getEntidadFinanciera(),
                        v.getMontoFinanciado(), v.getEstadoFinanciacion(), v.getCanalOrigen(),
                        v.getSeguimientoPostventaRealizado(), v.getRentabilidadCalculada()));
        return b.toString();
    }

    @Transactional(readOnly = true)
    public String compras(LocalDate desde, LocalDate hasta) {
        Periodo periodo = resolverPeriodo(desde, hasta);
        StringBuilder b = header("id", "vehiculoId", "clienteVendedorId", "fechaCompra", "costoAdquisicion");
        compras.findByActivoTrueAndFechaCompraBetweenOrderByFechaCompraDesc(periodo.desde(), periodo.hasta())
                .forEach(c -> row(b, c.getId(), c.getVehiculo().getId(), c.getClienteVendedor().getId(),
                        c.getFechaCompra(), c.getCostoAdquisicion()));
        return b.toString();
    }

    @Transactional(readOnly = true)
    public String refacciones(LocalDate desde, LocalDate hasta) {
        Periodo periodo = resolverPeriodo(desde, hasta);
        StringBuilder b = header("id", "vehiculoId", "fecha", "tipoTrabajo", "estadoTarea", "costoRepuestos",
                "costoManoObra", "costoServiciosExternos", "costoTotal");
        refacciones.findByActivoTrueAndFechaBetweenOrderByFechaDesc(periodo.desde(), periodo.hasta())
                .forEach(r -> row(b, r.getId(), r.getVehiculo().getId(), r.getFecha(), r.getTipoTrabajo(),
                        r.getEstadoTarea(), r.getCostoRepuestos(), r.getCostoManoObra(), r.getCostoServiciosExternos(),
                        r.costoTotal()));
        return b.toString();
    }

    @Transactional(readOnly = true)
    public String costosVehiculos() {
        StringBuilder b = header("vehiculoId", "costoCompra", "costoRefacciones", "costoTotal", "precioVenta",
                "margenOperativoRegistrado");
        vehiculos.findByActivoTrueOrderByCreadoEnDesc().forEach(v -> {
            if (compras.findByVehiculoAndActivoTrue(v).isEmpty()) {
                // Un vehículo todavía sin compra no tiene costo financiero calculable; se
                // exporta vacío, no como cero.
                row(b, v.getId(), null, null, null, null, null);
                return;
            }
            var c = costoService.calcular(v.getId());
            row(b, c.vehiculoId(), c.costoCompra(), c.costoRefacciones(), c.costoTotal(), c.precioVentaFinal(),
                    c.rentabilidad());
        });
        return b.toString();
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

    private StringBuilder header(Object... values) {
        StringBuilder b = new StringBuilder("\uFEFF");
        row(b, values);
        return b;
    }

    private void row(StringBuilder b, Object... values) {
        for (int i = 0; i < values.length; i++) {
            if (i > 0)
                b.append(',');
            b.append(escape(values[i]));
        }
        b.append('\n');
    }

    private String escape(Object value) {
        String s = value == null ? "" : String.valueOf(value);
        String left = s.stripLeading();
        if (!left.isEmpty() && "=+-@".indexOf(left.charAt(0)) >= 0)
            s = "'" + s;
        return '"' + s.replace("\"", "\"\"") + '"';
    }

    private record Periodo(LocalDate desde, LocalDate hasta) {
    }
}
