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
public class CvrpRequest {
    private Double volunteerStartLat;
    private Double volunteerStartLng;
    private Double vehicleCapacityKg; // e.g. 100.0 kg
    private List<RouteWaypoint> pickupNodes;
    private List<RouteWaypoint> deliveryNodes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RouteWaypoint {
        private Long id;
        private String name;
        private Double lat;
        private Double lng;
        private Double quantityKg;
        private String nodeType; // "PICKUP" or "DELIVERY"
        private String address;
    }
}
