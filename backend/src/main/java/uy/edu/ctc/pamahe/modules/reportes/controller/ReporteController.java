package uy.edu.ctc.pamahe.modules.reportes.controller;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.DashboardResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteComprasResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteRefaccionesResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteRentabilidadResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteStockResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteVentasResponse;
import uy.edu.ctc.pamahe.modules.exportaciones.service.ReportePdfService;
import uy.edu.ctc.pamahe.modules.reportes.service.ReporteService;

@RestController
@RequestMapping("/reportes")
public class ReporteController {
    private final ReporteService reporteService;
    private final ReportePdfService reportePdfService;

    public ReporteController(ReporteService reporteService, ReportePdfService reportePdfService) {
        this.reporteService = reporteService;
        this.reportePdfService = reportePdfService;
    }

    @GetMapping("/dashboard")
    public ApiResponse<DashboardResponse> dashboard(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ApiResponse.ok("Dashboard obtenido correctamente.", this.reporteService.dashboard(desde, hasta));
    }

    @GetMapping("/ventas")
    public ApiResponse<ReporteVentasResponse> ventas(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ApiResponse.ok("Reporte de ventas obtenido correctamente.", this.reporteService.ventas(desde, hasta));
    }

    @GetMapping("/ventas.pdf")
    public ResponseEntity<byte[]> ventasPdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return pdf("pamahe-reporte-ventas.pdf", this.reportePdfService.ventas(desde, hasta));
    }

    @GetMapping("/compras")
    public ApiResponse<ReporteComprasResponse> compras(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ApiResponse.ok("Reporte de compras obtenido correctamente.", this.reporteService.compras(desde, hasta));
    }

    @GetMapping("/compras.pdf")
    public ResponseEntity<byte[]> comprasPdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return pdf("pamahe-reporte-compras.pdf", this.reportePdfService.compras(desde, hasta));
    }

    @GetMapping("/stock")
    public ApiResponse<ReporteStockResponse> stock(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ApiResponse.ok("Reporte de stock obtenido correctamente.", this.reporteService.stock(desde, hasta));
    }

    @GetMapping("/stock.pdf")
    public ResponseEntity<byte[]> stockPdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return pdf("pamahe-reporte-stock.pdf", this.reportePdfService.stock(desde, hasta));
    }

    @GetMapping("/vendidos")
    public ApiResponse<ReporteVentasResponse> vendidos(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ApiResponse.ok("Reporte de vehículos vendidos obtenido correctamente.", this.reporteService.vendidos(desde, hasta));
    }

    @GetMapping("/vendidos.pdf")
    public ResponseEntity<byte[]> vendidosPdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return pdf("pamahe-reporte-vehiculos-vendidos.pdf", this.reportePdfService.vendidos(desde, hasta));
    }

    @GetMapping("/refacciones")
    public ApiResponse<ReporteRefaccionesResponse> refacciones(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ApiResponse.ok("Reporte de refacciones obtenido correctamente.", this.reporteService.refacciones(desde, hasta));
    }

    @GetMapping("/refacciones.pdf")
    public ResponseEntity<byte[]> refaccionesPdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return pdf("pamahe-reporte-refacciones.pdf", this.reportePdfService.refacciones(desde, hasta));
    }

    @GetMapping("/rentabilidad")
    public ApiResponse<ReporteRentabilidadResponse> rentabilidad(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ApiResponse.ok("Reporte de rentabilidad obtenido correctamente.", this.reporteService.rentabilidad(desde, hasta));
    }

    @GetMapping("/rentabilidad.pdf")
    public ResponseEntity<byte[]> rentabilidadPdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return pdf("pamahe-reporte-rentabilidad.pdf", this.reportePdfService.rentabilidad(desde, hasta));
    }

    private ResponseEntity<byte[]> pdf(String filename, byte[] content) {
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(filename, StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .contentType(MediaType.APPLICATION_PDF)
                .body(content);
    }
}
