package com.ecoshare.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MapPinResponse {
    private Long id;
    private String title;
    private String subtitle;
    private Double lat;
    private Double lng;
    private String type; // "donor", "ngo", "volunteer", "pickup"
    private String status;
    private Double quantityKg;
    private Integer priorityScore;
    private Double freshnessHours;
    private String address;
    private String phone;
}
