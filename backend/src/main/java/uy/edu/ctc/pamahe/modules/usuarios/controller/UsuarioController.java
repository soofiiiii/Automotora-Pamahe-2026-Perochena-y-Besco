package uy.edu.ctc.pamahe.modules.usuarios.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.modules.usuarios.dto.request.UsuarioRequest;
import uy.edu.ctc.pamahe.modules.usuarios.dto.request.UsuarioUpdateRequest;
import uy.edu.ctc.pamahe.modules.usuarios.dto.response.UsuarioResponse;
import uy.edu.ctc.pamahe.modules.usuarios.service.UsuarioService;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public ApiResponse<List<UsuarioResponse>> listar() {
        return ApiResponse.ok("Usuarios obtenidos correctamente.", this.usuarioService.listar());
    }

    @GetMapping("/{id}")
    public ApiResponse<UsuarioResponse> obtener(@PathVariable Long id) {
        return ApiResponse.ok("Usuario obtenido correctamente.", this.usuarioService.obtener(id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UsuarioResponse>> crear(@Valid @RequestBody UsuarioRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Usuario creado correctamente.", this.usuarioService.crear(request)));
    }

    @PutMapping("/{id}")
    public ApiResponse<UsuarioResponse> actualizar(@PathVariable Long id,
            @Valid @RequestBody UsuarioUpdateRequest request) {
        return ApiResponse.ok("Usuario actualizado correctamente.", this.usuarioService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> desactivar(@PathVariable Long id) {
        this.usuarioService.desactivar(id);
        return ApiResponse.ok("Usuario desactivado correctamente.", null);
    }
}