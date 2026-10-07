package uy.edu.ctc.pamahe.modules.ventas.controller;

import java.nio.charset.StandardCharsets;
import java.util.List;
import uy.edu.ctc.pamahe.common.response.PageResponse;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.common.util.PdfService;
import uy.edu.ctc.pamahe.modules.ventas.dto.request.ActualizarFinanciacionVentaRequest;
import uy.edu.ctc.pamahe.modules.ventas.dto.request.ActualizarProximoMantenimientoRequest;
import uy.edu.ctc.pamahe.modules.ventas.dto.request.VentaRequest;
import uy.edu.ctc.pamahe.modules.ventas.dto.response.VentaDetalleGerencialResponse;
import uy.edu.ctc.pamahe.modules.ventas.dto.response.VentaResponse;
import uy.edu.ctc.pamahe.modules.ventas.service.VentaService;

@RestController
@RequestMapping("/ventas")
public class VentaController {
    private final VentaService ventaService;

    public VentaController(VentaService ventaService) {
        this.ventaService = ventaService;
    }

    @GetMapping
    public ApiResponse<List<VentaResponse>> listar() {
        return ApiResponse.ok("Ventas obtenidas correctamente.", this.ventaService.listar());
    }

    @GetMapping("/paginado")
    public ApiResponse<PageResponse<VentaResponse>> listarPaginado(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Long vehiculoId) {
        return ApiResponse.ok("Ventas paginadas obtenidas correctamente.",
                this.ventaService.listarPaginado(page, size, desde, hasta, clienteId, vehiculoId));
    }

    @GetMapping("/{id}")
    public ApiResponse<VentaResponse> obtener(@PathVariable Long id) {
        return ApiResponse.ok("Venta obtenida correctamente.", this.ventaService.obtener(id));
    }

    @GetMapping("/{id}/detalle-gerencial")
    public ApiResponse<VentaDetalleGerencialResponse> obtenerDetalleGerencial(@PathVariable Long id) {
        return ApiResponse.ok("Detalle gerencial de la venta obtenido correctamente.",
                this.ventaService.obtenerDetalleGerencial(id));
    }

    @PostMapping
    public ApiResponse<VentaResponse> crear(@Valid @RequestBody VentaRequest request) {
        return ApiResponse.ok("Venta registrada correctamente.", this.ventaService.crear(request));
    }

    @PatchMapping("/{id}/financiacion")
    public ApiResponse<VentaResponse> actualizarFinanciacion(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarFinanciacionVentaRequest request) {
        return ApiResponse.ok(
                "Datos de financiación actualizados correctamente.",
                this.ventaService.actualizarFinanciacion(id, request));
    }

    @PatchMapping("/{id}/proximo-mantenimiento")
    public ApiResponse<VentaResponse> actualizarProximoMantenimiento(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarProximoMantenimientoRequest request) {
        return ApiResponse.ok(
                "Fecha de próximo mantenimiento actualizada correctamente.",
                this.ventaService.actualizarProximoMantenimiento(id, request));
    }

    @PatchMapping("/{id}/seguimiento-postventa/realizado")
    public ApiResponse<VentaResponse> marcarSeguimientoPostventaRealizado(@PathVariable Long id) {
        return ApiResponse.ok(
                "Seguimiento postventa marcado como realizado.",
                this.ventaService.marcarSeguimientoPostventaRealizado(id));
    }

    @PostMapping("/{id}/comprobante/reintentar")
    public ApiResponse<Void> reintentarComprobante(@PathVariable Long id) {
        this.ventaService.reintentarComprobante(id);
        return ApiResponse.ok("Comprobante reprogramado correctamente.", null);
    }

    @GetMapping("/{id}/comprobante")
    public ResponseEntity<Resource> descargarComprobante(@PathVariable Long id) {
        PdfService.ComprobanteResource comprobante = this.ventaService.obtenerComprobante(id);
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(comprobante.filename(), StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(comprobante.resource());
    }
}
