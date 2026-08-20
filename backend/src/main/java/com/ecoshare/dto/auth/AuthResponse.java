package com.ecoshare.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String type;
    private Long id;
    private String name;
    private String email;
    private String role;

    public AuthResponse(String token, Long id, String name, String email, String role) {
        this.token = token;
        this.type = "Bearer";
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
    }
}
