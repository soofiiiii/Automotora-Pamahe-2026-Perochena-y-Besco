package uy.edu.ctc.pamahe.modules.clientes.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import uy.edu.ctc.pamahe.modules.clientes.model.TipoCliente;

public record ClienteRequest(

        @NotBlank(message = "El nombre es obligatorio.")
        @Size(max = 120, message = "El nombre no puede superar los 120 caracteres.")
        String nombre,

        @Size(max = 120, message = "El apellido no puede superar los 120 caracteres.")
        String apellido,

        @Size(max = 160, message = "La razón social no puede superar los 160 caracteres.")
        String razonSocial,

        @NotBlank(message = "El documento es obligatorio.")
        @Size(max = 30, message = "El documento no puede superar los 30 caracteres.")
        String documento,

        @Pattern(
                regexp = "^\\+?[0-9 ()-]{8,40}$",
                message = "El teléfono no tiene un formato válido."
        )
        @Size(max = 40, message = "El teléfono no puede superar los 40 caracteres.")
        String telefono,

        @Email(message = "El email no tiene un formato válido.")
        @Size(max = 120, message = "El email no puede superar los 120 caracteres.")
        String email,

        @Size(max = 200, message = "La dirección no puede superar los 200 caracteres.")
        String direccion,

        @NotNull(message = "El tipo de cliente es obligatorio.")
        TipoCliente tipoCliente
) {
}
