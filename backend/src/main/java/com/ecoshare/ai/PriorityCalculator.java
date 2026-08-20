package com.ecoshare.ai;

import com.ecoshare.enums.FoodCategory;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Calculates a priority score (0-100) for donations based on
 * quantity, freshness urgency, and time elapsed since preparation.
 * Higher score = more urgent to distribute.
 */
@Component
public class PriorityCalculator {

    private static final double QUANTITY_WEIGHT = 0.3;
    private static final double FRESHNESS_WEIGHT = 0.5;
    private static final double TIME_WEIGHT = 0.2;

    private final FreshnessPredictor freshnessPredictor;

    public PriorityCalculator(FreshnessPredictor freshnessPredictor) {
        this.freshnessPredictor = freshnessPredictor;
    }

    /**
     * Calculate priority score from 0 (low) to 100 (critical).
     */
    public int calculatePriority(double quantityKg, FoodCategory category, LocalDateTime preparedAt) {
        double quantityScore = calculateQuantityScore(quantityKg);
        double freshnessScore = calculateFreshnessScore(category, preparedAt);
        double timeScore = calculateTimeScore(preparedAt);

        double rawScore = (quantityScore * QUANTITY_WEIGHT)
                        + (freshnessScore * FRESHNESS_WEIGHT)
                        + (timeScore * TIME_WEIGHT);

        return (int) Math.min(100, Math.max(0, rawScore));
    }

    /**
     * Larger quantities get higher scores (more people can be fed).
     * Caps at 100 kg for max score.
     */
    private double calculateQuantityScore(double quantityKg) {
        return Math.min(100, (quantityKg / 100.0) * 100);
    }

    /**
     * Less remaining freshness = higher urgency score.
     */
    private double calculateFreshnessScore(FoodCategory category, LocalDateTime preparedAt) {
        double remainingHours = freshnessPredictor.predictRemainingHours(category, preparedAt);
        if (remainingHours <= 0) return 100;
        if (remainingHours <= 1) return 95;
        if (remainingHours <= 2) return 80;
        if (remainingHours <= 4) return 60;
        if (remainingHours <= 8) return 40;
        if (remainingHours <= 24) return 20;
        return 10;
    }

    /**
     * More time since preparation = higher urgency.
     */
    private double calculateTimeScore(LocalDateTime preparedAt) {
        double hoursElapsed = Duration.between(preparedAt, LocalDateTime.now()).toMinutes() / 60.0;
        if (hoursElapsed >= 6) return 100;
        if (hoursElapsed >= 4) return 80;
        if (hoursElapsed >= 2) return 60;
        if (hoursElapsed >= 1) return 40;
        return 20;
    }
}
