package fr.ada.java_blog.controller;

import fr.ada.java_blog.dto.LoginRequest;
import fr.ada.java_blog.dto.LoginResponse;
import fr.ada.java_blog.model.User;
import fr.ada.java_blog.repository.UserRepository;
import fr.ada.java_blog.service.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest body) {
        User user = userRepository.findByMail(body.mail())
                .orElseThrow(() -> unauthorized());

        if (!passwordEncoder.matches(body.mdp(), user.getMdp())) {
            throw unauthorized();
        }

        String token = jwtService.generateToken(user);
        return new LoginResponse(token, user.getPseudo(), user.getId());
    }

    private static ResponseStatusException unauthorized() {
        return new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Identifiants invalides");
    }
}