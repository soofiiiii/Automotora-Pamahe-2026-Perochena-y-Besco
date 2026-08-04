package uy.edu.ctc.pamahe.modules.clientes.dto.response;

import uy.edu.ctc.pamahe.modules.clientes.model.TipoCliente;

public record ClienteResponse(
        Long id,
        String nombre,
        String apellido,
        String razonSocial,
        String documento,
        String telefono,
        String email,
        String direccion,
        TipoCliente tipoCliente,
        Boolean activo
) {
}

