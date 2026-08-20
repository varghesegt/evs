# EcoShare AI

**Intelligent Food Waste Prevention, Environmental Impact Analytics and Sustainable Food Redistribution Platform**

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, Leaflet, Recharts   |
| Backend    | Spring Boot 3.3, Java 17            |
| Database   | PostgreSQL                           |
| Auth       | JWT (jjwt 0.12.x), Spring Security  |
| Maps       | Leaflet + OpenStreetMap              |

## Quick Start

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL 14+
- Maven 3.9+

### 1. Database Setup
```sql
CREATE DATABASE ecoshare;
```

### 2. Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
Backend starts at `http://localhost:8080`

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend starts at `http://localhost:5173`

### Demo Accounts (auto-created on first run)

| Role       | Email                   | Password  |
|------------|-------------------------|-----------|
| Admin      | admin@ecoshare.com      | admin123  |
| Donor      | donor1@ecoshare.com     | donor123  |
| NGO        | ngo1@ecoshare.com       | ngo123    |
| Volunteer  | vol1@ecoshare.com       | vol123    |

## Project Structure

```
evs/
├── backend/                 # Spring Boot 3 (Maven)
│   ├── src/main/java/com/ecoshare/
│   │   ├── ai/              # AI Engine (Freshness, Priority, NGO Ranking, Route)
│   │   ├── config/          # Security, CORS, DataInitializer
│   │   ├── controller/      # 6 REST controllers
│   │   ├── dto/             # Request/Response DTOs
│   │   ├── entity/          # JPA entities
│   │   ├── enums/           # RoleType, DonationStatus, FoodCategory, PickupStatus
│   │   ├── exception/       # Global exception handling
│   │   ├── repository/      # Spring Data JPA repositories
│   │   ├── security/        # JWT provider, filter, entry point
│   │   └── service/         # Business logic services
│   └── src/main/resources/
│       └── application.yml
├── frontend/                # React + Vite
│   └── src/
│       ├── api/             # Axios API client modules
│       ├── components/      # Shared UI components
│       ├── context/         # Auth context provider
│       └── pages/           # 13+ route pages (4 role dashboards)
└── README.md
```

## API Endpoints

| Method | Endpoint                       | Role        | Description                    |
|--------|--------------------------------|-------------|--------------------------------|
| POST   | /api/auth/register             | Public      | Register new user              |
| POST   | /api/auth/login                | Public      | Login and get JWT              |
| GET    | /api/auth/me                   | Auth        | Get current user profile       |
| POST   | /api/donations/create          | Donor       | Create food donation           |
| GET    | /api/donations/my              | Donor       | Get my donations               |
| GET    | /api/donations/available       | NGO/Admin   | Get available donations        |
| POST   | /api/ngo/accept/{id}           | NGO         | Accept a donation              |
| POST   | /api/ngo/assign-volunteer/{id} | NGO         | Assign volunteer to pickup     |
| POST   | /api/volunteer/pickup/{id}     | Volunteer   | Mark food as picked up         |
| POST   | /api/volunteer/deliver/{id}    | Volunteer   | Confirm delivery               |
| GET    | /api/analytics/environmental   | Auth        | Environmental impact summary   |
| GET    | /api/analytics/public/summary  | Public      | Public impact stats            |
| GET    | /api/admin/users               | Admin       | List all users                 |
| PATCH  | /api/admin/ngo/{id}/approve    | Admin       | Approve NGO registration       |

## Environmental Impact Factors

| Metric              | Formula                            |
|---------------------|------------------------------------|
| CO2e Avoided        | food_kg x 1.9 kg CO2e              |
| Water Saved         | food_kg x 1,400 liters             |
| Meals Supported     | food_kg / 0.5                      |
| Fuel Saved          | route_distance_km x 0.12 L/km     |
| Landfill Prevented  | = food_kg                          |

## SDG Alignment

- **SDG 2** — Zero Hunger
- **SDG 11** — Sustainable Cities
- **SDG 12** — Responsible Consumption
- **SDG 13** — Climate Action
- **SDG 17** — Partnerships
