package com.ecoshare.service;

import com.ecoshare.dto.auth.*;
import com.ecoshare.dto.user.UserResponse;
import com.ecoshare.entity.NgoProfile;
import com.ecoshare.entity.User;
import com.ecoshare.enums.RoleType;
import com.ecoshare.exception.ResourceNotFoundException;
import com.ecoshare.repository.NgoProfileRepository;
import com.ecoshare.repository.UserRepository;
import com.ecoshare.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final NgoProfileRepository ngoProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        RoleType role = RoleType.valueOf("ROLE_" + request.getRole().toUpperCase());

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .address(request.getAddress())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .role(role)
                .isActive(true)
                .organizationName(request.getOrganizationName())
                .build();

        user = userRepository.save(user);

        // Create NGO profile if registering as NGO
        if (role == RoleType.ROLE_NGO) {
            NgoProfile profile = NgoProfile.builder()
                    .user(user)
                    .orgName(request.getOrganizationName() != null ? request.getOrganizationName() : request.getName())
                    .registrationNumber(request.getRegistrationNumber())
                    .description(request.getDescription())
                    .storageCapacityKg(request.getStorageCapacityKg() != null ? request.getStorageCapacityKg() : 100)
                    .hasVehicle(request.getHasVehicle() != null ? request.getHasVehicle() : false)
                    .isApproved(false)
                    .totalDeliveries(0)
                    .build();
            ngoProfileRepository.save(profile);
        }

        String token = jwtTokenProvider.generateTokenFromEmail(user.getEmail());

        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), role.name());
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = jwtTokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole().name());
    }

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public UserResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToUserResponse(user);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    public List<UserResponse> getUsersByRole(String role) {
        RoleType roleType = RoleType.valueOf("ROLE_" + role.toUpperCase());
        return userRepository.findByRole(roleType).stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse toggleUserStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setIsActive(!user.getIsActive());
        userRepository.save(user);
        return mapToUserResponse(user);
    }

    @Transactional
    public UserResponse approveNgo(Long userId) {
        NgoProfile profile = ngoProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("NGO profile not found"));
        profile.setIsApproved(true);
        ngoProfileRepository.save(profile);
        return mapToUserResponse(profile.getUser());
    }

    private UserResponse mapToUserResponse(User user) {
        UserResponse.UserResponseBuilder builder = UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .address(user.getAddress())
                .latitude(user.getLatitude())
                .longitude(user.getLongitude())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .organizationName(user.getOrganizationName())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);

        ngoProfileRepository.findByUserId(user.getId()).ifPresent(profile -> {
            builder.registrationNumber(profile.getRegistrationNumber())
                    .description(profile.getDescription())
                    .storageCapacityKg(profile.getStorageCapacityKg())
                    .hasVehicle(profile.getHasVehicle())
                    .isApproved(profile.getIsApproved())
                    .totalDeliveries(profile.getTotalDeliveries());
        });

        return builder.build();
    }
}
