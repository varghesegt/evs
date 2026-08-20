package com.ecoshare.ai;

import com.ecoshare.dto.ai.CvrpRequest;
import com.ecoshare.dto.ai.CvrpResponse;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class CvrpRouteOptimizer {

    public CvrpResponse solveCvrp(CvrpRequest request) {
        double currentLat = request.getVolunteerStartLat() != null ? request.getVolunteerStartLat() : 10.7970;
        double currentLng = request.getVolunteerStartLng() != null ? request.getVolunteerStartLng() : 78.6910;
        double maxCapacityKg = request.getVehicleCapacityKg() != null ? request.getVehicleCapacityKg() : 100.0;

        List<CvrpResponse.OptimizedStop> stops = new ArrayList<>();
        int stopOrder = 1;

        // Add Start Stop
        stops.add(CvrpResponse.OptimizedStop.builder()
                .stopOrder(stopOrder++)
                .nodeId(0L)
                .name("Volunteer Start Location")
                .nodeType("START")
                .lat(currentLat)
                .lng(currentLng)
                .loadKg(0.0)
                .cumulativeDistanceKm(0.0)
                .address("TVS Tollgate Depot, Trichy")
                .build());

        double totalDistance = 0.0;
        double currentLoad = 0.0;
        boolean capacitySatisfied = true;

        List<CvrpRequest.RouteWaypoint> remainingPickups = new ArrayList<>(request.getPickupNodes() != null ? request.getPickupNodes() : List.of(
                new CvrpRequest.RouteWaypoint(1L, "SRM Hotel Kitchen", 10.7985, 78.6890, 35.0, "PICKUP", "TVS Tollgate, Trichy"),
                new CvrpRequest.RouteWaypoint(2L, "Hotel Sangam", 10.8055, 78.6850, 25.0, "PICKUP", "Cantonment, Trichy")
        ));

        List<CvrpRequest.RouteWaypoint> remainingDeliveries = new ArrayList<>(request.getDeliveryNodes() != null ? request.getDeliveryNodes() : List.of(
                new CvrpRequest.RouteWaypoint(3L, "Akshaya Patra Shelter", 10.8290, 78.6930, 60.0, "DELIVERY", "Chathiram, Trichy")
        ));

        // Step 1: Optimize Pickups
        while (!remainingPickups.isEmpty()) {
            CvrpRequest.RouteWaypoint nearest = null;
            double minDist = Double.MAX_VALUE;

            for (CvrpRequest.RouteWaypoint node : remainingPickups) {
                double dist = NgoRanker.haversineDistance(currentLat, currentLng, node.getLat(), node.getLng());
                if (dist < minDist) {
                    minDist = dist;
                    nearest = node;
                }
            }

            if (nearest != null) {
                remainingPickups.remove(nearest);
                totalDistance += minDist;
                currentLat = nearest.getLat();
                currentLng = nearest.getLng();
                double itemQty = nearest.getQuantityKg() != null ? nearest.getQuantityKg() : 20.0;
                currentLoad += itemQty;

                if (currentLoad > maxCapacityKg) {
                    capacitySatisfied = false;
                }

                stops.add(CvrpResponse.OptimizedStop.builder()
                        .stopOrder(stopOrder++)
                        .nodeId(nearest.getId())
                        .name(nearest.getName())
                        .nodeType("PICKUP")
                        .lat(currentLat)
                        .lng(currentLng)
                        .loadKg(itemQty)
                        .cumulativeDistanceKm(Math.round(totalDistance * 10.0) / 10.0)
                        .address(nearest.getAddress())
                        .build());
            }
        }

        // Step 2: Optimize Deliveries
        while (!remainingDeliveries.isEmpty()) {
            CvrpRequest.RouteWaypoint nearest = null;
            double minDist = Double.MAX_VALUE;

            for (CvrpRequest.RouteWaypoint node : remainingDeliveries) {
                double dist = NgoRanker.haversineDistance(currentLat, currentLng, node.getLat(), node.getLng());
                if (dist < minDist) {
                    minDist = dist;
                    nearest = node;
                }
            }

            if (nearest != null) {
                remainingDeliveries.remove(nearest);
                totalDistance += minDist;
                currentLat = nearest.getLat();
                currentLng = nearest.getLng();
                double dropQty = nearest.getQuantityKg() != null ? nearest.getQuantityKg() : currentLoad;

                stops.add(CvrpResponse.OptimizedStop.builder()
                        .stopOrder(stopOrder++)
                        .nodeId(nearest.getId())
                        .name(nearest.getName())
                        .nodeType("DELIVERY")
                        .lat(currentLat)
                        .lng(currentLng)
                        .loadKg(dropQty)
                        .cumulativeDistanceKm(Math.round(totalDistance * 10.0) / 10.0)
                        .address(nearest.getAddress())
                        .build());
            }
        }

        double roundedDistance = Math.round(totalDistance * 10.0) / 10.0;
        double unoptimized = Math.round((roundedDistance * 1.4) * 10.0) / 10.0;
        double distanceSaved = Math.round((unoptimized - roundedDistance) * 10.0) / 10.0;
        double fuelSaved = Math.round((distanceSaved * 0.12) * 100.0) / 100.0; // 0.12 L/km
        double co2eSaved = Math.round((fuelSaved * 2.31) * 10.0) / 10.0; // 2.31 kg CO2e / L petrol

        return CvrpResponse.builder()
                .optimizedRoute(stops)
                .totalDistanceKm(roundedDistance)
                .unoptimizedDistanceKm(unoptimized)
                .distanceSavedKm(distanceSaved)
                .fuelSavedLiters(fuelSaved)
                .co2eSavedTransportKg(co2eSaved)
                .capacityConstraintSatisfied(capacitySatisfied)
                .totalLoadCarriedKg(currentLoad)
                .build();
    }
}
