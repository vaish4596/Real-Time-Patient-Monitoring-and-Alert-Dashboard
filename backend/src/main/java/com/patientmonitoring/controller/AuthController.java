package com.patientmonitoring.controller;

import com.patientmonitoring.dto.AuthRequest;
import com.patientmonitoring.dto.AuthResponse;
import com.patientmonitoring.model.User;
import com.patientmonitoring.repository.UserRepository;
import com.patientmonitoring.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthenticationManager authenticationManager, JwtUtil jwtUtil, 
                          UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest authRequest) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
        );

        User user = userRepository.findByUsername(authRequest.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        
        return ResponseEntity.ok(new AuthResponse(token, user.getRole().name()));
    }

    // A simple endpoint to setup a test admin if no admin user exists
    @PostMapping("/setup-admin")
    public ResponseEntity<?> setupAdmin() {
        if (!userRepository.findByUsername("admin").isPresent()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRole(com.patientmonitoring.model.Role.ADMIN);
            userRepository.save(admin);
            return ResponseEntity.ok("Admin created: admin / admin123");
        }
        return ResponseEntity.badRequest().body("Admin user already exists");
    }
}
