package com.ecoshare.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    private String phone;

    private String address;

    private Double latitude;

    private Double longitude;

    @NotBlank(message = "Role is required")
    private String role;

    // NGO-specific fields
    private String organizationName;
    private String registrationNumber;
    private String description;
    private Integer storageCapacityKg;
    private Boolean hasVehicle;
}
