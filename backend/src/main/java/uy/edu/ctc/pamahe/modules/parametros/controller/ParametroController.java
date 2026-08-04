package uy.edu.ctc.pamahe.modules.parametros.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.modules.parametros.model.Parametro;
import uy.edu.ctc.pamahe.modules.parametros.repository.ParametroRepository;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/parametros")
public class ParametroController {

    private final ParametroRepository parametroRepository;

    public ParametroController(ParametroRepository parametroRepository) {
        this.parametroRepository = parametroRepository;
    }

    @GetMapping
    public ApiResponse<List<Parametro>> listar() {
        return ApiResponse.ok("Parametros obtenidos correctamente.",
                this.parametroRepository.findByActivoTrueOrderByCategoriaAscClaveAsc());
    }

}
