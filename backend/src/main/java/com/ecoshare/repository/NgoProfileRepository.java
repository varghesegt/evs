package com.ecoshare.repository;

import com.ecoshare.entity.NgoProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NgoProfileRepository extends JpaRepository<NgoProfile, Long> {

    Optional<NgoProfile> findByUserId(Long userId);

    List<NgoProfile> findByIsApprovedTrue();

    List<NgoProfile> findByIsApprovedFalse();

    boolean existsByUserId(Long userId);
}
