package com.ecoshare.repository;

import com.ecoshare.entity.User;
import com.ecoshare.enums.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(RoleType role);

    List<User> findByRoleAndIsActiveTrue(RoleType role);

    @Query("SELECT u FROM User u WHERE u.role = :role AND u.isActive = true " +
           "AND u.latitude IS NOT NULL AND u.longitude IS NOT NULL")
    List<User> findActiveUsersWithLocationByRole(@Param("role") RoleType role);

    long countByRole(RoleType role);

    long countByIsActiveTrue();
}
