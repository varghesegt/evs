package com.ecoshare.repository;

import com.ecoshare.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<AuditLog> findTop50ByOrderByCreatedAtDesc();

    List<AuditLog> findByEntityTypeOrderByCreatedAtDesc(String entityType);
}
