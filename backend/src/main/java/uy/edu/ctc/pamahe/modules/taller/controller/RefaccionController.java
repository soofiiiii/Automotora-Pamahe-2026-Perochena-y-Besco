package uy.edu.ctc.pamahe.modules.taller.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.modules.taller.dto.request.RefaccionRequest;
import uy.edu.ctc.pamahe.modules.taller.dto.request.RefaccionUpdateRequest;
import uy.edu.ctc.pamahe.modules.taller.dto.response.RefaccionResponse;
import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.service.RefaccionService;
import uy.edu.ctc.pamahe.common.response.PageResponse;

@RestController
@RequestMapping("/taller/refacciones")
public class RefaccionController {

    private final RefaccionService refaccionService;

    public RefaccionController(RefaccionService refaccionService) {
        this.refaccionService = refaccionService;
    }

    @GetMapping
    public ApiResponse<List<RefaccionResponse>> listar(@RequestParam(required = false) EstadoTarea estado) {
        if (estado != null) {
            return ApiResponse.ok("Refacciones obtenidas correctamente.",
                    this.refaccionService.listarPorEstado(estado));
        }
        return ApiResponse.ok("Refacciones obtenidas correctamente.", this.refaccionService.listar());
    }

    @GetMapping("/paginado")
    public ApiResponse<PageResponse<RefaccionResponse>> listarPaginado(
            @RequestParam(required = false) EstadoTarea estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ApiResponse.ok(
                "Refacciones paginadas obtenidas correctamente.",
                this.refaccionService.listarPaginado(estado, page, size));
    }

    @GetMapping("/vehiculos/{vehiculoId}")
    public ApiResponse<List<RefaccionResponse>> listarPorVehiculo(@PathVariable Long vehiculoId) {
        return ApiResponse.ok("Refacciones del vehículo obtenidas correctamente.",
                this.refaccionService.listarPorVehiculo(vehiculoId));
    }

    @PostMapping
    public ApiResponse<RefaccionResponse> crear(@Valid @RequestBody RefaccionRequest request) {
        return ApiResponse.ok("Refacción registrada correctamente.", this.refaccionService.crear(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<RefaccionResponse> actualizar(@PathVariable Long id,
            @Valid @RequestBody RefaccionUpdateRequest request) {
        return ApiResponse.ok("Refacción actualizada correctamente.", this.refaccionService.actualizar(id, request));
    }
}
