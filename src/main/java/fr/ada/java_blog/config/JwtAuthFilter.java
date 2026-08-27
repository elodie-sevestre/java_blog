package fr.ada.java_blog.config;

import fr.ada.java_blog.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Filtre JWT — s'exécute avant les controllers.
 * Lit Authorization: Bearer … et remplit le contexte Spring Security.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // Pas de header ou mauvais format → on laisse passer ; Security décidera si 401
        // sur /admin
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Enlève le préfixe "Bearer " (7 caractères)
        String token = authHeader.substring(7);

        try {
            Claims claims = jwtService.parseToken(token);
            String userId = claims.getSubject();

            // Objet « utilisateur connecté » pour Spring Security
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userId,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_USER")));

            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (Exception ex) {
            // Token invalide ou expiré → on ne met PAS d'authentification
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}