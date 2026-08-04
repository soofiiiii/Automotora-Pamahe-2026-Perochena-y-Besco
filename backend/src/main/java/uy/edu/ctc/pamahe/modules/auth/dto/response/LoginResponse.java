package uy.edu.ctc.pamahe.modules.auth.dto.response;

import java.util.Set;

public record LoginResponse(
        String token,
        String username,
        String nombre,
        Set<String> roles) {
}
