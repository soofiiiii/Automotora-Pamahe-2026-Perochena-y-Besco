package uy.edu.ctc.pamahe.modules.costos.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.modules.costos.dto.response.CostoVehiculoResponse;
import uy.edu.ctc.pamahe.modules.costos.service.CostoService;

@RestController
@RequestMapping("/costos")
public class CostoController {
    private final CostoService costoService;
    public CostoController(CostoService costoService) { this.costoService = costoService; }

    @GetMapping("/vehiculos/{vehiculoId}")
    public ApiResponse<CostoVehiculoResponse> calcular(@PathVariable Long vehiculoId) {
        return ApiResponse.ok("Costo del vehículo calculado correctamente.", this.costoService.calcular(vehiculoId));
    }
}