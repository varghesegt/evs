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
public class RouteMatchResponse {
    private Long donationId;
    private Long bestVolunteerId;
    private String bestVolunteerName;
    private Double bestMatchScore; // e.g. 98.4%
    private Double totalRouteDistanceKm;
    private Integer estimatedDurationMinutes;
    private String estimatedPickupTime;
    private String estimatedDeliveryTime;
    private Double fuelSavedLiters;
    private Double transportCo2eSavedKg;
    private Boolean freshnessWindowCompliant;
    private Double freshnessSafetyBufferHours;
    private String routeSummaryExplanation;
    private List<double[]> polylineCoordinates; // [lat, lng] pairs for map rendering
    private List<RankedVolunteerRoute> rankedVolunteers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RankedVolunteerRoute {
        private Long volunteerId;
        private String volunteerName;
        private String phone;
        private Double latitude;
        private Double longitude;
        private String vehicleType;
        private Double capacityKg;
        private Integer activeDeliveries;
        private Double matchScore; // 0 - 100
        private Double distanceToPickupKm;
        private Double totalRouteDistanceKm;
        private Integer etaMinutes;
        private Double fuelSavedLiters;
        private Double transportCo2eSavedKg;
        private Boolean isRecommended;
        private String matchBadge; // "Fastest ETA", "Cold-Chain Ready", "Optimal Match"
        private String recommendationReason;
        private List<double[]> polylineCoordinates;
    }
}
