package com.ecoshare.ai;

import com.ecoshare.entity.NgoProfile;
import com.ecoshare.entity.User;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Ranks NGOs for a given donation based on distance, response history,
 * storage capacity, and vehicle availability.
 */
@Component
public class NgoRanker {

    private static final double DISTANCE_WEIGHT = 0.4;
    private static final double RESPONSE_WEIGHT = 0.2;
    private static final double CAPACITY_WEIGHT = 0.2;
    private static final double VEHICLE_WEIGHT = 0.2;

    /**
     * Rank NGOs by suitability. Returns list sorted best-first.
     */
    public List<RankedNgo> rankNgos(List<NgoProfile> ngos, double donationLat, double donationLng, double quantityKg) {
        List<RankedNgo> ranked = new ArrayList<>();

        for (NgoProfile ngo : ngos) {
            User user = ngo.getUser();
            if (user.getLatitude() == null || user.getLongitude() == null) continue;

            double distance = haversineDistance(donationLat, donationLng, user.getLatitude(), user.getLongitude());
            double score = calculateScore(ngo, distance, quantityKg);

            ranked.add(new RankedNgo(ngo, score, distance));
        }

        ranked.sort(Comparator.comparingDouble(RankedNgo::score).reversed());
        return ranked;
    }

    private double calculateScore(NgoProfile ngo, double distanceKm, double quantityKg) {
        // Distance score: closer is better (max 50 km range)
        double distanceScore = Math.max(0, 100 - (distanceKm / 50.0 * 100));

        // Response time score: faster responders rank higher
        double responseTime = ngo.getAvgResponseTimeMin() != null ? ngo.getAvgResponseTimeMin() : 30;
        double responseScore = Math.max(0, 100 - (responseTime / 60.0 * 100));

        // Capacity score: can they handle the quantity?
        int capacity = ngo.getStorageCapacityKg() != null ? ngo.getStorageCapacityKg() : 50;
        double capacityScore = capacity >= quantityKg ? 100 : (capacity / quantityKg * 100);

        // Vehicle bonus
        double vehicleScore = Boolean.TRUE.equals(ngo.getHasVehicle()) ? 100 : 30;

        return (distanceScore * DISTANCE_WEIGHT)
             + (responseScore * RESPONSE_WEIGHT)
             + (capacityScore * CAPACITY_WEIGHT)
             + (vehicleScore * VEHICLE_WEIGHT);
    }

    /**
     * Haversine formula to calculate distance between two lat/lng points in km.
     */
    public static double haversineDistance(double lat1, double lng1, double lat2, double lng2) {
        double R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public record RankedNgo(NgoProfile ngo, double score, double distanceKm) {}
}
