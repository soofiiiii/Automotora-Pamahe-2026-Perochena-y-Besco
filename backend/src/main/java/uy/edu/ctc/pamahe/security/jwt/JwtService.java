package uy.edu.ctc.pamahe.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.annotation.PostConstruct;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.List;

/**
 * Emite y verifica JWT firmados para la API Pamahe.
 * Además de firma, sujeto y expiración, exige un issuer propio para evitar aceptar
 * tokens válidamente firmados que pertenezcan a otra aplicación que reutilice la clave.
 */
@Service
public class JwtService {

    @Value("${security.jwt.secret}")
    private String secret;

    @Value("${security.jwt.expiration-minutes}")
    private Long expirationMinutes;

    @Value("${security.jwt.issuer}")
    private String issuer;

    @PostConstruct
    void validarConfiguracion() {
        if (expirationMinutes == null || expirationMinutes <= 0 || issuer == null || issuer.isBlank()) {
            throw new IllegalStateException("JWT requiere issuer y expiración positiva en minutos.");
        }
        try {
            Date.from(Instant.now().plusSeconds(Math.multiplyExact(expirationMinutes, 60L)));
            getSigningKey();
        } catch (RuntimeException exception) {
            throw new IllegalStateException("Clave o duración JWT inválida.", exception);
        }
    }

    public String generarToken(UserDetails userDetails) {
        Instant ahora = Instant.now();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        return Jwts.builder()
                .issuer(this.issuer)
                .subject(userDetails.getUsername())
                .claim("roles", roles)
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(ahora.plusSeconds(Math.multiplyExact(this.expirationMinutes, 60L))))
                .signWith(this.getSigningKey())
                .compact();
    }

    public long getExpirationMinutes() {
        return this.expirationMinutes;
    }
    
    public String obtenerUsername(String token) {
        return this.obtenerClaims(token).getSubject();
    }

    public boolean tokenValido(String token, UserDetails userDetails) {
        Claims claims = this.obtenerClaims(token);
        return claims.getSubject().equals(userDetails.getUsername())
                && !claims.getExpiration().before(new Date());
    }

    private Claims obtenerClaims(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(this.getSigningKey())
                .requireIssuer(this.issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        // Un JWT firmado sin expiración no respeta el contrato de sesión de Pamahe.
        if (claims.getExpiration() == null || claims.getSubject() == null || claims.getSubject().isBlank()) {
            throw new JwtException("El token requiere subject y expiration.");
        }
        return claims;
    }

    /** La clave se exige en Base64 para obtener bytes suficientes y consistentes entre entornos. */
    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(this.secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
