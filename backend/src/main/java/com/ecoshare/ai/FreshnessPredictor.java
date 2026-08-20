package com.ecoshare.ai;

import com.ecoshare.enums.FoodCategory;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Predicts remaining safe distribution time for donated food based on
 * food category, preparation time, and known shelf-life windows.
 */
@Component
public class FreshnessPredictor {

    // Maximum safe hours after preparation for each food category
    private static final Map<FoodCategory, Double> SHELF_LIFE_HOURS = Map.ofEntries(
        Map.entry(FoodCategory.COOKED_RICE, 6.0),
        Map.entry(FoodCategory.COOKED_CURRY, 5.0),
        Map.entry(FoodCategory.COOKED_VEGETABLES, 5.0),
        Map.entry(FoodCategory.BREAD_BAKERY, 24.0),
        Map.entry(FoodCategory.FRUITS, 48.0),
        Map.entry(FoodCategory.RAW_VEGETABLES, 72.0),
        Map.entry(FoodCategory.DAIRY, 4.0),
        Map.entry(FoodCategory.SWEETS_DESSERTS, 8.0),
        Map.entry(FoodCategory.BEVERAGES, 12.0),
        Map.entry(FoodCategory.PACKAGED_FOOD, 168.0),
        Map.entry(FoodCategory.MIXED_MEAL, 4.0),
        Map.entry(FoodCategory.OTHER, 6.0)
    );

    /**
     * Calculate remaining safe distribution hours.
     *
     * @param category   the food category
     * @param preparedAt when the food was prepared
     * @return remaining hours (0 if expired)
     */
    public double predictRemainingHours(FoodCategory category, LocalDateTime preparedAt) {
        double shelfLife = SHELF_LIFE_HOURS.getOrDefault(category, 6.0);
        double elapsedHours = Duration.between(preparedAt, LocalDateTime.now()).toMinutes() / 60.0;
        double remaining = shelfLife - elapsedHours;
        return Math.max(0, Math.round(remaining * 10.0) / 10.0);
    }

    /**
     * Calculate the expiry time.
     */
    public LocalDateTime predictExpiryTime(FoodCategory category, LocalDateTime preparedAt) {
        double shelfLife = SHELF_LIFE_HOURS.getOrDefault(category, 6.0);
        long shelfLifeMinutes = (long) (shelfLife * 60);
        return preparedAt.plusMinutes(shelfLifeMinutes);
    }

    /**
     * Check if food is still safe for distribution.
     */
    public boolean isSafeForDistribution(FoodCategory category, LocalDateTime preparedAt) {
        return predictRemainingHours(category, preparedAt) > 0;
    }
}
