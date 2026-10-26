package com.ecoshare.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

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

    // --- Enhanced Computer Vision & Deep Telemetry ---
    private List<String> dominantColors;
    private String visualTexturePattern;
    private Double opticalDetectedFillPercentage;
    private String detectedContainerType;
    private Double calorieEstimateKcal;
    private Double nutritionalProteinGrams;
    private Double nutritionalCarbsGrams;
    private Double nutritionalFatGrams;
    private Double avoidedCo2eKg;
    private Double avoidedWaterLiters;
    private Double avoidedMethaneGwp28Kg;
    private List<String> deepAnalysisSteps;
    private Boolean photoAnalyzed;

    // Advanced Optical Geometry & Visual Segmentation Telemetry
    private List<Double> detectedBoundingBox; // [ymin, xmin, ymax, xmax] 0.0 to 1.0
    private List<Double> containerRimCenter;   // [cx, cy]
    private Double containerRimRadius;
    private Double spectralWarmthRatio;
    private Double surfaceGranularityIndex;
    private Double confidenceP10Kg;
    private Double confidenceP90Kg;
}

