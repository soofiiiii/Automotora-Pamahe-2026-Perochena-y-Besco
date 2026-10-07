package uy.edu.ctc.pamahe.modules.parametros.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.modules.parametros.dto.request.ParametroRequest;
import uy.edu.ctc.pamahe.modules.parametros.dto.response.ParametroResponse;
import uy.edu.ctc.pamahe.modules.parametros.service.ParametroService;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/parametros")
public class ParametroController {

    private final ParametroService service;

    public ParametroController(ParametroService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<ParametroResponse>> listar() {
        return ApiResponse.ok("Parámetros obtenidos correctamente.", service.listar());
    }


    @GetMapping("/opciones")
    public ApiResponse<List<ParametroResponse>> listarOpcionesPorCategoria(@RequestParam String categoria) {
        return ApiResponse.ok("Opciones de parámetros obtenidas correctamente.",
                service.listarPorCategoria(categoria));
    }

    @PostMapping
    public ApiResponse<ParametroResponse> crear(@Valid @RequestBody ParametroRequest r) {
        return ApiResponse.ok("Parámetro creado correctamente.", service.crear(r));
    }

    @PutMapping("/{id}")
    public ApiResponse<ParametroResponse> actualizar(@PathVariable Long id, @Valid @RequestBody ParametroRequest r) {
        return ApiResponse.ok("Parámetro actualizado correctamente.", service.actualizar(id, r));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> desactivar(@PathVariable Long id) {
        service.desactivar(id);
        return ApiResponse.ok("Parámetro desactivado correctamente.", null);
    }

}
