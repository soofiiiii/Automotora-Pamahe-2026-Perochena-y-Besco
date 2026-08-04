package uy.edu.ctc.pamahe.security.jwt;

import io.jsonwebtoken.Claims;
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
 * Emite y verifica tokens firmados para identificar al usuario entre solicitudes sin sesión.
 * Los roles incluidos sirven al cliente como referencia; la autorización efectiva se reconstruye
 * desde la base de datos en cada petición protegida.
 */
@Service
public class JwtService {

    @Value("${security.jwt.secret}")
    private String secret;

    @Value("${security.jwt.expiration-minutes}")
    private Long expirationMinutes;

    public String generarToken(UserDetails userDetails) {
        Instant ahora = Instant.now();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("roles", roles)
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(ahora.plusSeconds(this.expirationMinutes * 60)))
                .signWith(this.getSigningKey())
                .compact();
    }

    public String obtenerUsername(String token) {
        return this.obtenerClaims(token).getSubject();
    }

    public boolean tokenValido(String token, UserDetails userDetails) {
        String username = this.obtenerUsername(token);
        return username.equals(userDetails.getUsername()) && !this.tokenExpirado(token);
    }

    private boolean tokenExpirado(String token) {
        return this.obtenerClaims(token).getExpiration().before(new Date());
    }

    private Claims obtenerClaims(String token) {
        return Jwts.parser()
                .verifyWith(this.getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** La clave se exige en Base64 para obtener bytes suficientes y consistentes entre entornos. */
    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(this.secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
