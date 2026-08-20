package com.ecoshare.entity;

import com.ecoshare.enums.DonationStatus;
import com.ecoshare.enums.FoodCategory;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "donations")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Donation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donor_id", nullable = false)
    private User donor;

    @Column(name = "food_name", nullable = false)
    private String foodName;

    @Enumerated(EnumType.STRING)
    @Column(name = "food_category", nullable = false)
    private FoodCategory foodCategory;

    @Column(name = "quantity_kg", nullable = false)
    private Double quantityKg;

    private String description;

    @Column(name = "packaging_type")
    private String packagingType;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "prepared_at", nullable = false)
    private LocalDateTime preparedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "pickup_address", nullable = false)
    private String pickupAddress;

    @Column(name = "pickup_lat")
    private Double pickupLat;

    @Column(name = "pickup_lng")
    private Double pickupLng;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DonationStatus status = DonationStatus.PENDING;

    @Column(name = "priority_score")
    private Integer priorityScore;

    @Column(name = "freshness_hours_remaining")
    private Double freshnessHoursRemaining;

    @Column(name = "qr_code")
    private String qrCode;

    @Column(name = "ai_estimated_mass_kg")
    private Double aiEstimatedMassKg;

    @Column(name = "ai_confidence_score")
    private Integer aiConfidenceScore;

    @Column(name = "container_type")
    private String containerType;

    @Column(name = "actual_confirmed_mass_kg")
    private Double actualConfirmedMassKg;

    @Column(name = "estimation_error_percent")
    private Double estimationErrorPercent;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = DonationStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
