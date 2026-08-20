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
public class CvrpResponse {
    private List<OptimizedStop> optimizedRoute;
    private Double totalDistanceKm;
    private Double unoptimizedDistanceKm;
    private Double distanceSavedKm;
    private Double fuelSavedLiters;
    private Double co2eSavedTransportKg;
    private Boolean capacityConstraintSatisfied;
    private Double totalLoadCarriedKg;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptimizedStop {
        private Integer stopOrder;
        private Long nodeId;
        private String name;
        private String nodeType; // "START", "PICKUP", "DELIVERY"
        private Double lat;
        private Double lng;
        private Double loadKg;
        private Double cumulativeDistanceKm;
        private String address;
    }
}
