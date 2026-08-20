package com.ecoshare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ngo_profiles")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class NgoProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "org_name", nullable = false)
    private String orgName;

    @Column(name = "registration_number")
    private String registrationNumber;

    private String description;

    @Column(name = "storage_capacity_kg")
    private Integer storageCapacityKg;

    @Column(name = "has_vehicle")
    private Boolean hasVehicle = false;

    @Column(name = "is_approved")
    private Boolean isApproved = false;

    @Column(name = "avg_response_time_min")
    private Double avgResponseTimeMin;

    @Column(name = "total_deliveries")
    private Integer totalDeliveries = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
