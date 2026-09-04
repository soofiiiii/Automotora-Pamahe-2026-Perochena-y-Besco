package uy.edu.ctc.pamahe.modules.compras.controller;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.common.util.PdfService;
import uy.edu.ctc.pamahe.modules.compras.dto.request.CompraRequest;
import uy.edu.ctc.pamahe.modules.compras.dto.response.CompraResponse;
import uy.edu.ctc.pamahe.modules.compras.service.CompraService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/compras")
public class CompraController {

    private final CompraService compraService;

    public CompraController(CompraService compraService) {
        this.compraService = compraService;
    }

    @GetMapping
    public ApiResponse<List<CompraResponse>> listar() {
        return ApiResponse.ok("Compras obtenidas correctamente.", this.compraService.listar());
    }

    @GetMapping("/{id}")
    public ApiResponse<CompraResponse> obtener(@PathVariable Long id) {
        return ApiResponse.ok("Compra obtenida correctamente.", this.compraService.obtener(id));
    }

    @PostMapping
    public ApiResponse<?> crear(@Valid @RequestBody CompraRequest request) {
        return ApiResponse.ok("Compra registrada correctamente.", this.compraService.crear(request));
    }

    @GetMapping("/{id}/comprobante")
    public ResponseEntity<Resource> descargarComprobante(@PathVariable Long id) {
        PdfService.ComprobanteResource comprobante = this.compraService.obtenerComprobante(id);
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(comprobante.filename(), StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(comprobante.resource());
    }
}