package com.ecoshare.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FoodEstimateRequest {
    private String foodCategory; // Optional manual override or auto-detect
    private String containerType; // "STANDARD_10L", "STANDARD_20L", "STANDARD_50L", "CUSTOM"
    private Double customVolumeLiters;
    private Double fillPercentage; // e.g. 75.0 for 75%
    private String topViewPhotoBase64;
    private String sideViewPhotoBase64;
    private String preparationState; // "HOT_FRESH", "ROOM_TEMP", "PACKAGED"
}
