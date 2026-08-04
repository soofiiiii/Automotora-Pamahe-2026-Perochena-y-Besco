package uy.edu.ctc.pamahe.modules.exportaciones.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import uy.edu.ctc.pamahe.modules.clientes.repository.ClienteRepository;
import uy.edu.ctc.pamahe.modules.vehiculos.repository.VehiculoRepository;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;

@RestController
@RequestMapping("/exportaciones")
public class ExportacionController {
    private final VehiculoRepository vehiculoRepository;
    private final ClienteRepository clienteRepository;
    private final VentaRepository ventaRepository;

    public ExportacionController(VehiculoRepository vehiculoRepository, ClienteRepository clienteRepository, VentaRepository ventaRepository) {
        this.vehiculoRepository = vehiculoRepository;
        this.clienteRepository = clienteRepository;
        this.ventaRepository = ventaRepository;
    }

    @GetMapping("/vehiculos.csv")
    public ResponseEntity<String> vehiculosCsv() {
        StringBuilder csv = new StringBuilder("id,marca,modelo,anio,estado,precioVentaEstimado,publicado\n");
        this.vehiculoRepository.findByActivoTrueOrderByCreadoEnDesc().forEach(v ->
                csv.append(v.getId()).append(',').append(v.getMarca()).append(',').append(v.getModelo()).append(',')
                        .append(v.getAnio()).append(',').append(v.getEstado()).append(',').append(v.getPrecioVentaEstimado()).append(',')
                        .append(v.getPublicado()).append('\n'));
        return csv("vehiculos.csv", csv.toString());
    }

    @GetMapping("/clientes.csv")
    public ResponseEntity<String> clientesCsv() {
        StringBuilder csv = new StringBuilder("id,nombre,apellido,documento,tipoCliente,telefono\n");
        this.clienteRepository.findByActivoTrueOrderByNombreAsc().forEach(c ->
                csv.append(c.getId()).append(',').append(c.getNombre()).append(',').append(c.getApellido()).append(',')
                        .append(c.getDocumento()).append(',').append(c.getTipoCliente()).append(',').append(c.getTelefono()).append('\n'));
        return csv("clientes.csv", csv.toString());
    }

    @GetMapping("/ventas.csv")
    public ResponseEntity<String> ventasCsv() {
        StringBuilder csv = new StringBuilder("id,vehiculoId,clienteCompradorId,fechaVenta,precioFinal,rentabilidad\n");
        this.ventaRepository.findByActivoTrueOrderByFechaVentaDesc().forEach(v ->
                csv.append(v.getId()).append(',').append(v.getVehiculo().getId()).append(',').append(v.getClienteComprador().getId()).append(',')
                        .append(v.getFechaVenta()).append(',').append(v.getPrecioFinal()).append(',').append(v.getRentabilidadCalculada()).append('\n'));
        return csv("ventas.csv", csv.toString());
    }

    private ResponseEntity<String> csv(String filename, String content) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(content);
    }
    
}
