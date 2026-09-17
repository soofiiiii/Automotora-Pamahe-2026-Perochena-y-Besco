package uy.edu.ctc.pamahe.modules.reportes.controller;

import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.DashboardResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteComprasResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteRefaccionesResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteRentabilidadResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteStockResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteVentasResponse;
import uy.edu.ctc.pamahe.modules.reportes.service.ReporteService;


@RestController
@RequestMapping("/reportes")
public class ReporteController {
    private final ReporteService reporteService;

    public ReporteController(ReporteService reporteService) {
        this.reporteService = reporteService;
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

    @GetMapping("/compras")
    public ApiResponse<ReporteComprasResponse> compras(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ApiResponse.ok("Reporte de compras obtenido correctamente.", this.reporteService.compras(desde, hasta));
    }

    @GetMapping("/stock")
    public ApiResponse<ReporteStockResponse> stock(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ApiResponse.ok("Reporte de stock obtenido correctamente.", this.reporteService.stock(desde, hasta));
    }

    @GetMapping("/vendidos")
    public ApiResponse<ReporteVentasResponse> vendidos(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ApiResponse.ok("Reporte de vehículos vendidos obtenido correctamente.", this.reporteService.vendidos(desde, hasta));
    }

    @GetMapping("/refacciones")
    public ApiResponse<ReporteRefaccionesResponse> refacciones(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ApiResponse.ok("Reporte de refacciones obtenido correctamente.", this.reporteService.refacciones(desde, hasta));
    }

    @GetMapping("/rentabilidad")
    public ApiResponse<ReporteRentabilidadResponse> rentabilidad(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ApiResponse.ok("Reporte de rentabilidad obtenido correctamente.", this.reporteService.rentabilidad(desde, hasta));
    }
    
}
