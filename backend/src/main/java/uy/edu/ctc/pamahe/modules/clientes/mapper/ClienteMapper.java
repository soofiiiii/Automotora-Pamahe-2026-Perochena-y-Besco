package uy.edu.ctc.pamahe.modules.clientes.mapper;

import uy.edu.ctc.pamahe.modules.clientes.dto.response.ClienteResponse;
import uy.edu.ctc.pamahe.modules.clientes.model.Cliente;

public final class ClienteMapper {

    private ClienteMapper() {
    }

    public static ClienteResponse toResponse(Cliente cliente) {
        return new ClienteResponse(
                cliente.getId(),
                cliente.getNombre(),
                cliente.getApellido(),
                cliente.getRazonSocial(),
                cliente.getDocumento(),
                cliente.getTelefono(),
                cliente.getEmail(),
                cliente.getDireccion(),
                cliente.getTipoCliente(),
                cliente.getActivo());
    }
}
