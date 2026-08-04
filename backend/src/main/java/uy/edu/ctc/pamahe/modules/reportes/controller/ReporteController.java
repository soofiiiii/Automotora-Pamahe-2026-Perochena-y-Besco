package uy.edu.ctc.pamahe.modules.reportes.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.DashboardResponse;
import uy.edu.ctc.pamahe.modules.reportes.service.ReporteService;

@RestController
@RequestMapping("/reportes")
public class ReporteController {
    private final ReporteService reporteService;
    public ReporteController(ReporteService reporteService) { this.reporteService = reporteService; }

    @GetMapping("/dashboard")
    public ApiResponse<DashboardResponse> dashboard() {
        return ApiResponse.ok("Dashboard obtenido correctamente.", this.reporteService.dashboard());
    }
}

