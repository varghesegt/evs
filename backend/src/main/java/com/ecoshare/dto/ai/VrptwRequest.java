package com.ecoshare.dto.ai;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VrptwRequest {

    private List<FleetVehicle> fleet;
    private List<TimeWindowNode> pickupNodes;
    private List<TimeWindowNode> deliveryNodes;
    private String trafficCondition; // "LOW", "MODERATE", "PEAK_HOUR"

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FleetVehicle {
        private String vehicleId;
        private String vehicleType; // "TWO_WHEELER", "AUTO_RICKSHAW", "REFRIGERATED_VAN"
        private Double capacityKg;
        private Double startLat;
        private Double startLng;
        private String startAddress;
        private Double maxShiftHours;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeWindowNode {
        private Long id;
        private String name;
        private String nodeType; // "PICKUP", "DELIVERY"
        private Double lat;
        private Double lng;
        private Double quantityKg;
        private String address;
        private String earliestTime; // e.g. "11:30"
        private String latestTime;   // e.g. "13:00"
        private Double serviceDurationMinutes;
        private Double perishabilityDeadlineHours;
    }
}
