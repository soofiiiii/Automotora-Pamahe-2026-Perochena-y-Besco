package uy.edu.ctc.pamahe.modules.roles.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.modules.roles.dto.response.RolResponse;
import uy.edu.ctc.pamahe.modules.roles.repository.RolRepository;

@RestController
@RequestMapping("/roles")
public class RolController {

    private final RolRepository rolRepository;

    public RolController(RolRepository rolRepository) {
        this.rolRepository = rolRepository;
    }

    @GetMapping
    public ApiResponse<List<RolResponse>> listar() {
        List<RolResponse> roles = this.rolRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(r -> new RolResponse(r.getId(), r.getNombre(), r.getDescripcion(), r.getActivo()))
                .toList();
        return ApiResponse.ok("Roles obtenidos correctamente.", roles);
    }
    
}
