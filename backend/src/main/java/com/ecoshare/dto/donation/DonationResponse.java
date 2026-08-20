package com.ecoshare.dto.donation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonationResponse {
    private Long id;
    private String foodName;
    private String foodCategory;
    private Double quantityKg;
    private String description;
    private String packagingType;
    private String imageUrl;
    private String preparedAt;
    private String expiresAt;
    private String pickupAddress;
    private Double pickupLat;
    private Double pickupLng;
    private String status;
    private Integer priorityScore;
    private Double freshnessHoursRemaining;
    private String qrCode;
    private String createdAt;

    // Donor info
    private Long donorId;
    private String donorName;
    private String donorPhone;

    // Pickup info
    private Long pickupId;
    private String ngoName;
    private String volunteerName;
    private String pickupStatus;

    // AI Estimation Fields (Feature 1, 2, 3)
    private Double aiEstimatedMassKg;
    private Integer aiConfidenceScore;
    private String containerType;
    private Double actualConfirmedMassKg;
    private Double estimationErrorPercent;
}

