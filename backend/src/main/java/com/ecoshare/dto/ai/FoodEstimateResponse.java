package com.ecoshare.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FoodEstimateResponse {
    private String detectedFoodCategory;
    private String foodDisplayName;
    private Double estimatedVolumeLiters;
    private Double estimatedMassMinKg;
    private Double estimatedMassMaxKg;
    private Double estimatedMassMidpointKg;
    private Integer estimatedServingsMin;
    private Integer estimatedServingsMax;
    private Integer estimatedServingsMidpoint;
    private Integer confidenceScore; // 0 to 100%
    private Double foodDensityKgPerLiter;
    private Double portionSizeGramsPerServing;
    private String priorityRecommendation; // "HIGH", "MEDIUM", "LOW"
    private String priorityReason;
    private Double historicalModelErrorRate; // e.g. 3.8%
    private String scientificNote;
}
