package com.ecoshare.ai;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Optimizes pickup routes using nearest-neighbor heuristic.
 * Takes a list of pickup points and returns an ordered route
 * minimizing total travel distance.
 */
@Component
public class RouteOptimizer {

    /**
     * Optimize the route through the given waypoints starting from the origin.
     * Returns an ordered list of indices representing the optimized visit order.
     */
    public OptimizedRoute optimize(double originLat, double originLng, List<double[]> waypoints) {
        if (waypoints == null || waypoints.isEmpty()) {
            return new OptimizedRoute(List.of(), 0);
        }

        List<Integer> visited = new ArrayList<>();
        boolean[] used = new boolean[waypoints.size()];
        double totalDistance = 0;
        double currentLat = originLat;
        double currentLng = originLng;

        for (int i = 0; i < waypoints.size(); i++) {
            int nearest = -1;
            double nearestDist = Double.MAX_VALUE;

            for (int j = 0; j < waypoints.size(); j++) {
                if (used[j]) continue;
                double dist = NgoRanker.haversineDistance(
                    currentLat, currentLng,
                    waypoints.get(j)[0], waypoints.get(j)[1]
                );
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = j;
                }
            }

            if (nearest >= 0) {
                visited.add(nearest);
                used[nearest] = true;
                totalDistance += nearestDist;
                currentLat = waypoints.get(nearest)[0];
                currentLng = waypoints.get(nearest)[1];
            }
        }

        return new OptimizedRoute(visited, Math.round(totalDistance * 10.0) / 10.0);
    }

    public record OptimizedRoute(List<Integer> order, double totalDistanceKm) {}
}
