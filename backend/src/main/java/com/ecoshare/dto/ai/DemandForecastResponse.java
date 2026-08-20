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
public class DemandForecastResponse {
    private String forecastRegion; // e.g. "Tiruchirappalli District"
    private String forecastPeriod; // e.g. "Next 24 Hours"
    private Integer totalForecastedMealsDeficit;
    private Double totalForecastedFoodDeficitKg;
    private Integer totalExpectedSurplusMeals;
    private Double deficitCoveragePercentage;
    private List<ShelterDemandPrediction> shelterPredictions;
    private List<String> highDemandZones;
    private String aiRecommendation;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShelterDemandPrediction {
        private Long ngoId;
        private String ngoName;
        private String location;
        private Integer estimatedMealsNeeded;
        private Double foodNeededKg;
        private String urgencyLevel; // "CRITICAL", "HIGH", "MODERATE"
        private String peakDeficitTime;
    }
}
