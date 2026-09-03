package uy.edu.ctc.pamahe.modules.auth.dto.response;

import java.util.Set;

public record AuthMeResponse(
        Long id,
        String username,
        String nombre,
        Set<String> roles
) {
}