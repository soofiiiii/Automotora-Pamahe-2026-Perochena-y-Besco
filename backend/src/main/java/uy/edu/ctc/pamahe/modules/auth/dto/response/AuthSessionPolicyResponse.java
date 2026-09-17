package uy.edu.ctc.pamahe.modules.auth.dto.response;

public record AuthSessionPolicyResponse(
        String renewalMode,
        long accessTokenMinutes,
        boolean refreshTokenEnabled) {
}
