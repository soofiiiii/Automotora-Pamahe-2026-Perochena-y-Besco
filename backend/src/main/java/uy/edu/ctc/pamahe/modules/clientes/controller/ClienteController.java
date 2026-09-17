package uy.edu.ctc.pamahe.modules.clientes.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
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
import uy.edu.ctc.pamahe.common.response.PageResponse;
import uy.edu.ctc.pamahe.modules.clientes.dto.request.ClienteRequest;
import uy.edu.ctc.pamahe.modules.clientes.dto.response.ClienteResponse;
import uy.edu.ctc.pamahe.modules.clientes.service.ClienteService;

@RestController
@RequestMapping("/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @GetMapping
    public ApiResponse<List<ClienteResponse>> listar() {
        return ApiResponse.ok("Clientes obtenidos correctamente.", this.clienteService.listar());
    }

    @GetMapping("/paginado")
    public ApiResponse<PageResponse<ClienteResponse>> listarPaginado(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok("Clientes paginados obtenidos correctamente.", this.clienteService.listarPaginado(page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<ClienteResponse> obtener(@PathVariable Long id) {
        return ApiResponse.ok("Cliente obtenido correctamente.", this.clienteService.obtener(id));
    }

    @PostMapping
    public ApiResponse<ClienteResponse> crear(@Valid @RequestBody ClienteRequest request) {
        return ApiResponse.ok("Cliente creado correctamente.", this.clienteService.crear(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<ClienteResponse> actualizar(@PathVariable Long id,
                                                    @Valid @RequestBody ClienteRequest request) {
        return ApiResponse.ok("Cliente actualizado correctamente.", this.clienteService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> desactivar(@PathVariable Long id) {
        this.clienteService.desactivar(id);
        return ApiResponse.ok("Cliente desactivado correctamente.", null);
    }
}
