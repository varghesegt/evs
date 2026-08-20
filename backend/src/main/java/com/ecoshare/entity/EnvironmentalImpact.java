package com.ecoshare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "environmental_impact")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EnvironmentalImpact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donation_id", nullable = false, unique = true)
    private Donation donation;

    @Column(name = "food_rescued_kg")
    private Double foodRescuedKg;

    @Column(name = "meals_supported")
    private Integer mealsSupported;

    @Column(name = "co2e_avoided_kg")
    private Double co2eAvoidedKg;

    @Column(name = "water_saved_liters")
    private Double waterSavedLiters;

    @Column(name = "fuel_saved_liters")
    private Double fuelSavedLiters;

    @Column(name = "landfill_prevented_kg")
    private Double landfillPreventedKg;

    @Column(name = "calculated_at")
    private LocalDateTime calculatedAt;

    @PrePersist
    protected void onCreate() {
        calculatedAt = LocalDateTime.now();
    }
}
