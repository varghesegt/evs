package com.ecoshare.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String address;
    private Double latitude;
    private Double longitude;
    private String role;
    private Boolean isActive;
    private String organizationName;
    private String createdAt;

    // NGO-specific
    private String registrationNumber;
    private String description;
    private Integer storageCapacityKg;
    private Boolean hasVehicle;
    private Boolean isApproved;
    private Integer totalDeliveries;
}
