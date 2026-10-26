package com.ecoshare.dto.ai;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VrptwResponse {

    private String optimizationAlgorithm;
    private List<VehicleTour> vehicleTours;
    private Double totalFleetDistanceKm;
    private Double unoptimizedBaselineKm;
    private Double fleetDistanceSavedKm;
    private Double fuelSavedLiters;
    private Double transportCo2eAvoidedKg;
    private Integer totalStopsServiced;
    private Boolean allTimeWindowsMet;
    private Boolean allCapacityConstraintsMet;
    private String solverStatus;

    public List<VehicleTour> getFleetRoutes() {
        return vehicleTours;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VehicleTour {
        private String vehicleId;
        private String vehicleType;
        private Double vehicleCapacityKg;
        private Double peakLoadKg;
        private Double tourDistanceKm;
        private Double tourDurationMinutes;
        private Boolean capacityViolated;
        private List<ScheduledStop> schedule;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScheduledStop {
        private Integer sequenceOrder;
        private Long nodeId;
        private String name;
        private String stopType; // "START", "PICKUP", "DELIVERY"
        private Double lat;
        private Double lng;
        private String address;
        private Double loadCarriedKg;
        private String estimatedArrivalTime;
        private String timeWindow;
        private Boolean windowSatisfied;
        private Double cumulativeDistanceKm;
    }
}
