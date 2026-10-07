package uy.edu.ctc.pamahe.modules.catalogo.controller;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.common.response.PageResponse;
import uy.edu.ctc.pamahe.modules.catalogo.dto.response.CatalogoVehiculoResponse;
import uy.edu.ctc.pamahe.modules.catalogo.service.CatalogoService;

@RestController
@RequestMapping("/catalogo")
public class CatalogoController {

    private final CatalogoService catalogoService;

    public CatalogoController(CatalogoService catalogoService) {
        this.catalogoService = catalogoService;
    }

    @GetMapping("/vehiculos")
    public ApiResponse<List<CatalogoVehiculoResponse>> listarDisponibles(
            @RequestParam(required = false) String marca,
            @RequestParam(required = false) String modelo,
            @RequestParam(required = false) String tipoVehiculo,
            @RequestParam(required = false) Integer anioDesde,
            @RequestParam(required = false) Integer anioHasta,
            @RequestParam(required = false) BigDecimal precioMin,
            @RequestParam(required = false) BigDecimal precioMax) {
        return ApiResponse.ok(
                "Vehículos disponibles obtenidos correctamente.",
                this.catalogoService.listarDisponibles(
                        marca, modelo, tipoVehiculo, anioDesde, anioHasta, precioMin, precioMax));
    }

    @GetMapping("/vehiculos/paginado")
    public ApiResponse<PageResponse<CatalogoVehiculoResponse>> listarDisponiblesPaginado(
            @RequestParam(required = false) String marca,
            @RequestParam(required = false) String modelo,
            @RequestParam(required = false) String tipoVehiculo,
            @RequestParam(required = false) Integer anioDesde,
            @RequestParam(required = false) Integer anioHasta,
            @RequestParam(required = false) BigDecimal precioMin,
            @RequestParam(required = false) BigDecimal precioMax,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(
                "Vehículos públicos paginados obtenidos correctamente.",
                this.catalogoService.listarDisponiblesPaginado(
                        marca, modelo, tipoVehiculo, anioDesde, anioHasta, precioMin, precioMax, page, size));
    }

    @GetMapping("/vehiculos/{id}")
    public ApiResponse<CatalogoVehiculoResponse> obtenerDetalle(@PathVariable Long id) {
        return ApiResponse.ok(
                "Detalle público del vehículo obtenido correctamente.",
                this.catalogoService.obtenerDetalle(id));
    }
}
