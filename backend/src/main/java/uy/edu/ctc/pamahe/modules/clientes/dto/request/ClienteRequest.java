package uy.edu.ctc.pamahe.modules.clientes.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import uy.edu.ctc.pamahe.modules.clientes.model.TipoCliente;

public record ClienteRequest(
        @NotBlank String nombre,
        String apellido,
        String razonSocial,
        @NotBlank String documento,
        String telefono,
        String email,
        String direccion,
        @NotNull TipoCliente tipoCliente
) {
}
