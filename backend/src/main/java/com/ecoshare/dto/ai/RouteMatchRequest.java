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
public class RouteMatchRequest {
    private Long donationId;
    private Double donationLat;
    private Double donationLng;
    private String donationAddress;
    private Double quantityKg;
    private String foodCategory;
    private Double freshnessHoursRemaining;
    private Double shelterLat;
    private Double shelterLng;
    private String shelterName;
    private List<VolunteerCandidate> availableVolunteers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VolunteerCandidate {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private Double latitude;
        private Double longitude;
        private String vehicleType; // REFRIGERATED_VAN, ELECTRIC_CARGO, TWO_WHEELER, CAR
        private Double capacityKg;
        private Integer activeDeliveries;
    }
}
