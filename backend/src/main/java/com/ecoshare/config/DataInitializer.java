package com.ecoshare.config;

import com.ecoshare.entity.*;
import com.ecoshare.enums.*;
import com.ecoshare.repository.*;
import com.ecoshare.service.EnvironmentalImpactService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final NgoProfileRepository ngoProfileRepository;
    private final DonationRepository donationRepository;
    private final PickupRepository pickupRepository;
    private final EnvironmentalImpactService impactService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded, skipping initialization");
            return;
        }

        log.info("Seeding database with expanded active demo data for Trichy...");

        // Admin
        User admin = userRepository.save(User.builder()
                .name("System Administrator")
                .email("admin@ecoshare.com")
                .password(passwordEncoder.encode("admin123"))
                .phone("9443100001")
                .address("EcoShare HQ, Thillai Nagar, Trichy")
                .latitude(10.8270)
                .longitude(78.6870)
                .role(RoleType.ROLE_ADMIN)
                .isActive(true)
                .build());

        // Donors (Trichy)
        User donor1 = userRepository.save(User.builder()
                .name("SRM Hotel & Convention Centre")
                .email("donor1@ecoshare.com")
                .password(passwordEncoder.encode("donor123"))
                .phone("9443100002")
                .address("Race Course Road, TVS Tollgate, Trichy")
                .latitude(10.7985)
                .longitude(78.6890)
                .role(RoleType.ROLE_DONOR)
                .isActive(true)
                .organizationName("SRM Hotel Trichy")
                .build());

        User donor2 = userRepository.save(User.builder()
                .name("Hotel Sangam Kitchen")
                .email("donor2@ecoshare.com")
                .password(passwordEncoder.encode("donor123"))
                .phone("9443100003")
                .address("Collector Office Road, Cantonment, Trichy")
                .latitude(10.8055)
                .longitude(78.6850)
                .role(RoleType.ROLE_DONOR)
                .isActive(true)
                .organizationName("Hotel Sangam")
                .build());

        User donor3 = userRepository.save(User.builder()
                .name("NIT Trichy Hostel Canteen")
                .email("donor3@ecoshare.com")
                .password(passwordEncoder.encode("donor123"))
                .phone("9443100004")
                .address("Tanjore Main Road, Thuvakudi, Trichy")
                .latitude(10.7600)
                .longitude(78.8150)
                .role(RoleType.ROLE_DONOR)
                .isActive(true)
                .organizationName("NIT Trichy Canteen")
                .build());

        User donor4 = userRepository.save(User.builder()
                .name("Royal Mahal Kalyana Mandapam")
                .email("donor4@ecoshare.com")
                .password(passwordEncoder.encode("donor123"))
                .phone("9443100009")
                .address("Main Road, Thillai Nagar, Trichy")
                .latitude(10.8295)
                .longitude(78.6865)
                .role(RoleType.ROLE_DONOR)
                .isActive(true)
                .organizationName("Royal Mahal Trichy")
                .build());

        User donor5 = userRepository.save(User.builder()
                .name("A2B Bakery & Sweets")
                .email("donor5@ecoshare.com")
                .password(passwordEncoder.encode("donor123"))
                .phone("9443100010")
                .address("Chatram Bus Stand Area, Trichy")
                .latitude(10.8310)
                .longitude(78.6940)
                .role(RoleType.ROLE_DONOR)
                .isActive(true)
                .organizationName("A2B Trichy Branch")
                .build());

        User donor6 = userRepository.save(User.builder()
                .name("St. Joseph's College Cafeteria")
                .email("donor6@ecoshare.com")
                .password(passwordEncoder.encode("donor123"))
                .phone("9443100011")
                .address("College Road, Teppakulam, Trichy")
                .latitude(10.8280)
                .longitude(78.6970)
                .role(RoleType.ROLE_DONOR)
                .isActive(true)
                .organizationName("St. Joseph's Canteen")
                .build());

        // NGOs (Trichy)
        User ngo1User = userRepository.save(User.builder()
                .name("Akshaya Patra Foundation Trichy")
                .email("ngo1@ecoshare.com")
                .password(passwordEncoder.encode("ngo123"))
                .phone("9443100005")
                .address("Near Chathiram Bus Stand, Joseph College Area, Trichy")
                .latitude(10.8290)
                .longitude(78.6930)
                .role(RoleType.ROLE_NGO)
                .isActive(true)
                .organizationName("Akshaya Patra Foundation")
                .build());

        ngoProfileRepository.save(NgoProfile.builder()
                .user(ngo1User)
                .orgName("Akshaya Patra Foundation Trichy")
                .registrationNumber("NGO-TN-2019-0451")
                .description("Serving mid-day meals and redistributing surplus food across Tiruchirappalli district")
                .storageCapacityKg(500)
                .hasVehicle(true)
                .isApproved(true)
                .avgResponseTimeMin(15.0)
                .totalDeliveries(4)
                .build());

        User ngo2User = userRepository.save(User.builder()
                .name("Robin Hood Army Trichy")
                .email("ngo2@ecoshare.com")
                .password(passwordEncoder.encode("ngo123"))
                .phone("9443100006")
                .address("Crawford Main Road, Trichy")
                .latitude(10.7850)
                .longitude(78.6750)
                .role(RoleType.ROLE_NGO)
                .isActive(true)
                .organizationName("Robin Hood Army")
                .build());

        ngoProfileRepository.save(NgoProfile.builder()
                .user(ngo2User)
                .orgName("Robin Hood Army Trichy")
                .registrationNumber("NGO-TN-2020-0789")
                .description("Volunteer-driven food redistribution network across Trichy")
                .storageCapacityKg(200)
                .hasVehicle(false)
                .isApproved(true)
                .avgResponseTimeMin(25.0)
                .totalDeliveries(3)
                .build());

        User ngo3User = userRepository.save(User.builder()
                .name("Anbalayam Charitable Trust")
                .email("ngo3@ecoshare.com")
                .password(passwordEncoder.encode("ngo123"))
                .phone("9443100012")
                .address("Palakkarai Main Road, Trichy")
                .latitude(10.8120)
                .longitude(78.6910)
                .role(RoleType.ROLE_NGO)
                .isActive(true)
                .organizationName("Anbalayam Trust")
                .build());

        ngoProfileRepository.save(NgoProfile.builder()
                .user(ngo3User)
                .orgName("Anbalayam Charitable Trust")
                .registrationNumber("NGO-TN-2021-1102")
                .description("Providing care, shelter and daily fresh food to underprivileged children and senior citizens")
                .storageCapacityKg(350)
                .hasVehicle(true)
                .isApproved(true)
                .avgResponseTimeMin(20.0)
                .totalDeliveries(2)
                .build());

        User ngo4User = userRepository.save(User.builder()
                .name("Helping Hands Social Society")
                .email("ngo4@ecoshare.com")
                .password(passwordEncoder.encode("ngo123"))
                .phone("9443100013")
                .address("Kattur Main Road, Trichy")
                .latitude(10.7950)
                .longitude(78.7420)
                .role(RoleType.ROLE_NGO)
                .isActive(true)
                .organizationName("Helping Hands Trichy")
                .build());

        ngoProfileRepository.save(NgoProfile.builder()
                .user(ngo4User)
                .orgName("Helping Hands Social Society")
                .registrationNumber("NGO-TN-2022-0344")
                .description("Community emergency relief and sustainable food distribution group")
                .storageCapacityKg(250)
                .hasVehicle(true)
                .isApproved(true)
                .avgResponseTimeMin(18.0)
                .totalDeliveries(1)
                .build());

        // Volunteers (Trichy)
        User vol1 = userRepository.save(User.builder()
                .name("K. Sundaram")
                .email("vol1@ecoshare.com")
                .password(passwordEncoder.encode("vol123"))
                .phone("9443100007")
                .address("West Tower Street, Srirangam, Trichy")
                .latitude(10.8620)
                .longitude(78.6920)
                .role(RoleType.ROLE_VOLUNTEER)
                .isActive(true)
                .build());

        User vol2 = userRepository.save(User.builder()
                .name("S. Anitha")
                .email("vol2@ecoshare.com")
                .password(passwordEncoder.encode("vol123"))
                .phone("9443100008")
                .address("KK Nagar Main Road, Trichy")
                .latitude(10.7780)
                .longitude(78.7050)
                .role(RoleType.ROLE_VOLUNTEER)
                .isActive(true)
                .build());

        User vol3 = userRepository.save(User.builder()
                .name("M. Karthik")
                .email("vol3@ecoshare.com")
                .password(passwordEncoder.encode("vol123"))
                .phone("9443100014")
                .address("7th Cross, Thillai Nagar, Trichy")
                .latitude(10.8260)
                .longitude(78.6880)
                .role(RoleType.ROLE_VOLUNTEER)
                .isActive(true)
                .build());

        User vol4 = userRepository.save(User.builder()
                .name("R. Deepa")
                .email("vol4@ecoshare.com")
                .password(passwordEncoder.encode("vol123"))
                .phone("9443100015")
                .address("Woraiyur Bazaar Street, Trichy")
                .latitude(10.8350)
                .longitude(78.6790)
                .role(RoleType.ROLE_VOLUNTEER)
                .isActive(true)
                .build());

        User vol5 = userRepository.save(User.builder()
                .name("V. Saravanan")
                .email("vol5@ecoshare.com")
                .password(passwordEncoder.encode("vol123"))
                .phone("9443100016")
                .address("TVS Tollgate Signal, Trichy")
                .latitude(10.7970)
                .longitude(78.6910)
                .role(RoleType.ROLE_VOLUNTEER)
                .isActive(true)
                .build());

        // --- COMPLETED DONATIONS (Delivered with calculated environmental impact) ---

        // Donation 1
        Donation d1 = donationRepository.save(Donation.builder()
                .donor(donor1)
                .foodName("Traditional South Indian Marriage Feast")
                .foodCategory(FoodCategory.COOKED_RICE)
                .quantityKg(50.0)
                .description("Leftover Sambar Rice, Veg Biryani, and Poriyal from wedding reception, packed in hygienic containers")
                .packagingType("Stainless Steel Containers")
                .preparedAt(LocalDateTime.now().minusHours(5))
                .expiresAt(LocalDateTime.now().plusHours(1))
                .pickupAddress("SRM Hotel, TVS Tollgate, Trichy")
                .pickupLat(10.7985)
                .pickupLng(78.6890)
                .status(DonationStatus.DELIVERED)
                .priorityScore(88)
                .freshnessHoursRemaining(1.0)
                .qrCode("TR001ABC")
                .build());

        Pickup p1 = pickupRepository.save(Pickup.builder()
                .donation(d1)
                .ngo(ngo1User)
                .volunteer(vol1)
                .status(PickupStatus.DELIVERED)
                .assignedAt(LocalDateTime.now().minusHours(4))
                .pickedUpAt(LocalDateTime.now().minusHours(3))
                .deliveredAt(LocalDateTime.now().minusHours(2))
                .routeDistanceKm(4.2)
                .build());
        impactService.calculateAndSave(d1, p1);

        // Donation 2
        Donation d2 = donationRepository.save(Donation.builder()
                .donor(donor2)
                .foodName("Hotel Breakfast Buffet Surplus")
                .foodCategory(FoodCategory.MIXED_MEAL)
                .quantityKg(30.0)
                .description("Assorted South Indian breakfast items including Idli, Vada, Ven Pongal, Sambar, and Chutney")
                .packagingType("Food-grade Containers")
                .preparedAt(LocalDateTime.now().minusHours(4))
                .expiresAt(LocalDateTime.now().plusHours(1))
                .pickupAddress("Hotel Sangam, Cantonment, Trichy")
                .pickupLat(10.8055)
                .pickupLng(78.6850)
                .status(DonationStatus.DELIVERED)
                .priorityScore(82)
                .freshnessHoursRemaining(1.0)
                .qrCode("TR002DEF")
                .build());

        Pickup p2 = pickupRepository.save(Pickup.builder()
                .donation(d2)
                .ngo(ngo2User)
                .volunteer(vol2)
                .status(PickupStatus.DELIVERED)
                .assignedAt(LocalDateTime.now().minusHours(3))
                .pickedUpAt(LocalDateTime.now().minusHours(2))
                .deliveredAt(LocalDateTime.now().minusHours(1))
                .routeDistanceKm(3.1)
                .build());
        impactService.calculateAndSave(d2, p2);

        // Donation 3
        Donation d3 = donationRepository.save(Donation.builder()
                .donor(donor4)
                .foodName("Reception Dinner Meals")
                .foodCategory(FoodCategory.COOKED_CURRY)
                .quantityKg(45.0)
                .description("Paneer Gravy, Veg Pulao, Chapati and Gulab Jamun from evening reception")
                .packagingType("Thermal Hot Boxes")
                .preparedAt(LocalDateTime.now().minusHours(6))
                .expiresAt(LocalDateTime.now().plusHours(1))
                .pickupAddress("Royal Mahal, Thillai Nagar, Trichy")
                .pickupLat(10.8295)
                .pickupLng(78.6865)
                .status(DonationStatus.DELIVERED)
                .priorityScore(90)
                .freshnessHoursRemaining(0.5)
                .qrCode("TR003KLM")
                .build());

        Pickup p3 = pickupRepository.save(Pickup.builder()
                .donation(d3)
                .ngo(ngo3User)
                .volunteer(vol3)
                .status(PickupStatus.DELIVERED)
                .assignedAt(LocalDateTime.now().minusHours(5))
                .pickedUpAt(LocalDateTime.now().minusHours(4))
                .deliveredAt(LocalDateTime.now().minusHours(3))
                .routeDistanceKm(2.8)
                .build());
        impactService.calculateAndSave(d3, p3);

        // Donation 4
        Donation d4 = donationRepository.save(Donation.builder()
                .donor(donor5)
                .foodName("Fresh Bakery Bread & Pastries")
                .foodCategory(FoodCategory.BREAD_BAKERY)
                .quantityKg(20.0)
                .description("Freshly baked wheat bread loaves, veg puffs, and fruit buns from morning batch")
                .packagingType("Sealed Moisture-Proof Bags")
                .preparedAt(LocalDateTime.now().minusHours(8))
                .expiresAt(LocalDateTime.now().plusHours(16))
                .pickupAddress("A2B Branch, Chatram Bus Stand, Trichy")
                .pickupLat(10.8310)
                .pickupLng(78.6940)
                .status(DonationStatus.DELIVERED)
                .priorityScore(45)
                .freshnessHoursRemaining(16.0)
                .qrCode("TR004NOP")
                .build());

        Pickup p4 = pickupRepository.save(Pickup.builder()
                .donation(d4)
                .ngo(ngo1User)
                .volunteer(vol4)
                .status(PickupStatus.DELIVERED)
                .assignedAt(LocalDateTime.now().minusHours(6))
                .pickedUpAt(LocalDateTime.now().minusHours(5))
                .deliveredAt(LocalDateTime.now().minusHours(4))
                .routeDistanceKm(1.9)
                .build());
        impactService.calculateAndSave(d4, p4);

        // Donation 5
        Donation d5 = donationRepository.save(Donation.builder()
                .donor(donor6)
                .foodName("College Event Fruit & Dairy Surplus")
                .foodCategory(FoodCategory.FRUITS)
                .quantityKg(25.0)
                .description("Fresh cut fruit platters, packaged milk, and yogurt pots from cultural fest")
                .packagingType("Insulated Chilled Containers")
                .preparedAt(LocalDateTime.now().minusHours(4))
                .expiresAt(LocalDateTime.now().plusHours(20))
                .pickupAddress("St. Joseph's College, Teppakulam, Trichy")
                .pickupLat(10.8280)
                .pickupLng(78.6970)
                .status(DonationStatus.DELIVERED)
                .priorityScore(62)
                .freshnessHoursRemaining(20.0)
                .qrCode("TR005QRS")
                .build());

        Pickup p5 = pickupRepository.save(Pickup.builder()
                .donation(d5)
                .ngo(ngo4User)
                .volunteer(vol1)
                .status(PickupStatus.DELIVERED)
                .assignedAt(LocalDateTime.now().minusHours(3))
                .pickedUpAt(LocalDateTime.now().minusHours(2))
                .deliveredAt(LocalDateTime.now().minusHours(1))
                .routeDistanceKm(5.4)
                .build());
        impactService.calculateAndSave(d5, p5);

        // Donation 6
        Donation d6 = donationRepository.save(Donation.builder()
                .donor(donor3)
                .foodName("NIT Hostel Dinner Rice Surplus")
                .foodCategory(FoodCategory.COOKED_RICE)
                .quantityKg(60.0)
                .description("Steamed Ponni Rice, Lemon Rice, and Vegetable Kurma from hostel mess dinner")
                .packagingType("Large Food Grade Trays")
                .preparedAt(LocalDateTime.now().minusHours(7))
                .expiresAt(LocalDateTime.now().plusHours(1))
                .pickupAddress("NIT Trichy Campus, Thuvakudi, Trichy")
                .pickupLat(10.7600)
                .pickupLng(78.8150)
                .status(DonationStatus.DELIVERED)
                .priorityScore(85)
                .freshnessHoursRemaining(1.0)
                .qrCode("TR006TUV")
                .build());

        Pickup p6 = pickupRepository.save(Pickup.builder()
                .donation(d6)
                .ngo(ngo2User)
                .volunteer(vol5)
                .status(PickupStatus.DELIVERED)
                .assignedAt(LocalDateTime.now().minusHours(6))
                .pickedUpAt(LocalDateTime.now().minusHours(4))
                .deliveredAt(LocalDateTime.now().minusHours(2))
                .routeDistanceKm(12.5)
                .build());
        impactService.calculateAndSave(d6, p6);

        // --- ACTIVE IN-PROGRESS DONATIONS ---

        // Donation 7 (Picked up, en route to NGO)
        Donation d7 = donationRepository.save(Donation.builder()
                .donor(donor2)
                .foodName("Lunch Buffet Curry & Rice Surplus")
                .foodCategory(FoodCategory.COOKED_RICE)
                .quantityKg(35.0)
                .description("Vegetable Biryani, Jeera Rice, Dal Fry, and Paneer Butter Masala from afternoon buffet")
                .packagingType("Hot-sealed Containers")
                .preparedAt(LocalDateTime.now().minusHours(2))
                .expiresAt(LocalDateTime.now().plusHours(3))
                .pickupAddress("Hotel Sangam, Cantonment, Trichy")
                .pickupLat(10.8055)
                .pickupLng(78.6850)
                .status(DonationStatus.PICKED_UP)
                .priorityScore(78)
                .freshnessHoursRemaining(3.0)
                .qrCode("TR007WXY")
                .build());

        pickupRepository.save(Pickup.builder()
                .donation(d7)
                .ngo(ngo1User)
                .volunteer(vol3)
                .status(PickupStatus.PICKED_UP)
                .assignedAt(LocalDateTime.now().minusHours(1))
                .pickedUpAt(LocalDateTime.now().minusMinutes(20))
                .routeDistanceKm(3.8)
                .build());

        // Donation 8 (Pickup Assigned to volunteer)
        Donation d8 = donationRepository.save(Donation.builder()
                .donor(donor6)
                .foodName("Canteen Evening Snack Platter")
                .foodCategory(FoodCategory.MIXED_MEAL)
                .quantityKg(18.0)
                .description("Hot Samosas, Cutlets, Tea & Coffee flasks from evening staff seminar")
                .packagingType("Insulated Flasks & Boxes")
                .preparedAt(LocalDateTime.now().minusMinutes(90))
                .expiresAt(LocalDateTime.now().plusHours(3))
                .pickupAddress("St. Joseph's College, Teppakulam, Trichy")
                .pickupLat(10.8280)
                .pickupLng(78.6970)
                .status(DonationStatus.PICKUP_ASSIGNED)
                .priorityScore(68)
                .freshnessHoursRemaining(3.0)
                .qrCode("TR008ZAB")
                .build());

        pickupRepository.save(Pickup.builder()
                .donation(d8)
                .ngo(ngo3User)
                .volunteer(vol4)
                .status(PickupStatus.ASSIGNED)
                .assignedAt(LocalDateTime.now().minusMinutes(30))
                .routeDistanceKm(2.4)
                .build());

        // Donation 9 (Accepted by NGO, waiting for volunteer assignment)
        Donation d9 = donationRepository.save(Donation.builder()
                .donor(donor4)
                .foodName("Kalyana Mandapam Dinner Meals")
                .foodCategory(FoodCategory.COOKED_VEGETABLES)
                .quantityKg(40.0)
                .description("Full South Indian meal surplus: Rice, Sambar, Vatha Kuzhambu, Aviyal, and Payasam")
                .packagingType("Stainless Steel Drums")
                .preparedAt(LocalDateTime.now().minusHours(1))
                .expiresAt(LocalDateTime.now().plusHours(4))
                .pickupAddress("Royal Mahal, Thillai Nagar, Trichy")
                .pickupLat(10.8295)
                .pickupLng(78.6865)
                .status(DonationStatus.ACCEPTED)
                .priorityScore(72)
                .freshnessHoursRemaining(4.0)
                .qrCode("TR009CDE")
                .build());

        pickupRepository.save(Pickup.builder()
                .donation(d9)
                .ngo(ngo1User)
                .status(PickupStatus.ASSIGNED)
                .assignedAt(LocalDateTime.now().minusMinutes(15))
                .build());

        // --- AVAILABLE / VALIDATED DONATIONS (Pending NGO acceptance) ---

        // Donation 10
        donationRepository.save(Donation.builder()
                .donor(donor3)
                .foodName("NIT Mess Lunch Surplus")
                .foodCategory(FoodCategory.COOKED_VEGETABLES)
                .quantityKg(25.0)
                .description("Rice, Sambar, Rasam, Kootu, and Curd Rice from hostel mess lunch service")
                .packagingType("Aluminium Foil Trays")
                .preparedAt(LocalDateTime.now().minusHours(1))
                .expiresAt(LocalDateTime.now().plusHours(4))
                .pickupAddress("NIT Trichy Campus, Thuvakudi, Trichy")
                .pickupLat(10.7600)
                .pickupLng(78.8150)
                .status(DonationStatus.VALIDATED)
                .priorityScore(65)
                .freshnessHoursRemaining(4.0)
                .qrCode("TR010FGH")
                .build());

        // Donation 11
        donationRepository.save(Donation.builder()
                .donor(donor1)
                .foodName("Evening Reception Sweets & Snacks")
                .foodCategory(FoodCategory.SWEETS_DESSERTS)
                .quantityKg(15.0)
                .description("Assorted Indian sweets (Laddu, Mysore Pak) and savory snacks (Murukku) from evening function")
                .packagingType("Cardboard Boxes")
                .preparedAt(LocalDateTime.now().minusMinutes(45))
                .expiresAt(LocalDateTime.now().plusHours(7))
                .pickupAddress("SRM Hotel, TVS Tollgate, Trichy")
                .pickupLat(10.7985)
                .pickupLng(78.6890)
                .status(DonationStatus.VALIDATED)
                .priorityScore(50)
                .freshnessHoursRemaining(7.0)
                .qrCode("TR011IJK")
                .build());

        // Donation 12
        donationRepository.save(Donation.builder()
                .donor(donor5)
                .foodName("Packaged Fresh Juices & Dairy Packets")
                .foodCategory(FoodCategory.BEVERAGES)
                .quantityKg(22.0)
                .description("Sealed mango juice cartons, fresh buttermilk packets, and flavored milk bottles")
                .packagingType("Insulated Crates")
                .preparedAt(LocalDateTime.now().minusMinutes(30))
                .expiresAt(LocalDateTime.now().plusHours(11))
                .pickupAddress("A2B Branch, Chatram Bus Stand, Trichy")
                .pickupLat(10.8310)
                .pickupLng(78.6940)
                .status(DonationStatus.VALIDATED)
                .priorityScore(42)
                .freshnessHoursRemaining(11.0)
                .qrCode("TR012LMN")
                .build());

        log.info("Database seeded successfully with expanded active demo data for Trichy");
    }
}
