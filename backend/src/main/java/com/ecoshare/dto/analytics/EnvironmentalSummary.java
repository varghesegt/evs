package com.ecoshare.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnvironmentalSummary {
    private Double totalFoodRescuedKg;
    private Long totalMealsSupported;
    private Double totalCo2eAvoidedKg;
    private Double totalWaterSavedLiters;
    private Double totalFuelSavedLiters;
    private Double totalLandfillPreventedKg;
    private Double totalDistanceOptimizedKm;
    private Long totalDonations;
    private Long totalActiveDonors;
    private Long totalActiveNgos;
    private Long totalActiveVolunteers;
    private Long pendingDonations;
    private Long completedDeliveries;

    // EVS Equivalencies
    private Double carKmNegated;
    private Double treesPlantedEquivalency;
    private Double electricityHoursSaved;

    // IPCC Category-Wise CO2e Footprint Breakdown (kg CO2e)
    private Double cookedRiceCo2e;
    private Double cookedCurryCo2e;
    private Double dairyCo2e;
    private Double fruitsVegCo2e;
    private Double bakeryCo2e;
}
