package com.ecoshare.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    private long todayDonations;
    private long pendingPickups;
    private long completedDeliveries;
    private long activeVolunteers;
    private double foodRescuedToday;
    private long totalDonations;
    private long totalUsers;
}
