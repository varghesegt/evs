package com.ecoshare.dto.donation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CreateDonationRequest {

    @NotBlank(message = "Food name is required")
    private String foodName;

    @NotBlank(message = "Food category is required")
    private String foodCategory;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Double quantityKg;

    private String description;

    private String packagingType;

    private String imageUrl;

    @NotBlank(message = "Preparation time is required")
    private String preparedAt;

    @NotBlank(message = "Pickup address is required")
    private String pickupAddress;

    private Double pickupLat;

    private Double pickupLng;
}
