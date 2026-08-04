package uy.edu.ctc.pamahe.modules.ventas.controller;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.common.util.PdfService;
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
