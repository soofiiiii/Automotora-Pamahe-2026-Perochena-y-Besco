package uy.edu.ctc.pamahe.modules.vehiculos.controller;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.common.response.PageResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.request.CambiarEstadoVehiculoRequest;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.request.CambiarPublicacionVehiculoRequest;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.request.VehiculoRequest;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.service.VehiculoService;

@RestController
@RequestMapping("/vehiculos")
public class VehiculoController {

    private final VehiculoService vehiculoService;

    public VehiculoController(VehiculoService vehiculoService) {
        this.vehiculoService = vehiculoService;
    }

    @GetMapping
    public ApiResponse<List<?>> listar(
            @RequestParam(required = false) EstadoVehiculo estado,
            @RequestParam(required = false) String marca,
            @RequestParam(required = false) String modelo,
            @RequestParam(required = false) String tipoVehiculo,
            @RequestParam(required = false) Integer anioDesde,
            @RequestParam(required = false) Integer anioHasta,
            @RequestParam(required = false) BigDecimal precioMin,
            @RequestParam(required = false) BigDecimal precioMax,
            @RequestParam(required = false) Boolean publicado,
            @RequestParam(required = false) Boolean disponibleComercial
    ) {
        return ApiResponse.ok(
                "Vehículos obtenidos correctamente.",
                this.vehiculoService.listar(
                       estado, marca, modelo, tipoVehiculo, anioDesde, anioHasta,
                        precioMin, precioMax, publicado, disponibleComercial));
    }

    /**
     * Variante paginada que no rompe el contrato histórico de GET /vehiculos.
     */
    @GetMapping("/paginado")
    public ApiResponse<PageResponse<?>> listarPaginado(
            @RequestParam(required = false) EstadoVehiculo estado,
            @RequestParam(required = false) String marca,
            @RequestParam(required = false) String modelo,
            @RequestParam(required = false) String tipoVehiculo,
            @RequestParam(required = false) Integer anioDesde,
            @RequestParam(required = false) Integer anioHasta,
            @RequestParam(required = false) BigDecimal precioMin,
            @RequestParam(required = false) BigDecimal precioMax,
            @RequestParam(required = false) Boolean publicado,
            @RequestParam(required = false) Boolean disponibleComercial,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(
                "Vehículos paginados obtenidos correctamente.",
                this.vehiculoService.listarPaginado(
                        estado, marca, modelo, tipoVehiculo, anioDesde, anioHasta,
                        precioMin, precioMax, publicado, disponibleComercial, page, size));
    }

    @GetMapping("/{id}/historial")
    public ApiResponse<?> historial(@PathVariable Long id) {
        return ApiResponse.ok("Historial del vehículo obtenido correctamente.", this.vehiculoService.historial(id));
    }

    @GetMapping("/{id}")
    public ApiResponse<?> obtener(@PathVariable Long id) {
        return ApiResponse.ok("Vehículo obtenido correctamente.", this.vehiculoService.obtener(id));
    }

    @PostMapping
    public ApiResponse<?> crear(@Valid @RequestBody VehiculoRequest request) {
        return ApiResponse.ok("Vehículo creado correctamente.", this.vehiculoService.crear(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<?> actualizar(@PathVariable Long id,
                                                    @Valid @RequestBody VehiculoRequest request) {
        return ApiResponse.ok("Vehículo actualizado correctamente.", this.vehiculoService.actualizar(id, request));
    }

    @PatchMapping("/{id}/estado")
    public ApiResponse<?> cambiarEstado(@PathVariable Long id,
                                                       @Valid @RequestBody CambiarEstadoVehiculoRequest request) {
        return ApiResponse.ok("Estado del vehículo actualizado correctamente.", this.vehiculoService.cambiarEstado(id, request));
    }

    @PatchMapping("/{id}/publicacion")
    public ApiResponse<?> cambiarPublicacion(@PathVariable Long id,
                                                            @Valid @RequestBody CambiarPublicacionVehiculoRequest request) {
        return ApiResponse.ok("Publicación del vehículo actualizada correctamente.", this.vehiculoService.cambiarPublicacion(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> desactivar(@PathVariable Long id) {
        this.vehiculoService.desactivar(id);
        return ApiResponse.ok("Vehículo desactivado correctamente.", null);
    }
}