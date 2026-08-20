package com.ecoshare.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntryResponse {
    private Integer rank;
    private Long donorId;
    private String organizationName;
    private String donorName;
    private Double totalFoodRescuedKg;
    private Double totalCo2eAvoidedKg;
    private Double totalWaterSavedKL;
    private Long totalMealsSupported;
    private Integer totalDonationsCount;
    private String tierBadge; // "GREEN_GOLD", "SILVER_SAVIOR", "BRONZE_CHAMPION"
    private List<String> environmentalBadges;
    private String verifiedSha256Hash;
}
