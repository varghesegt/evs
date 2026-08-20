package com.ecoshare.security;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Component
public class Sha256Ledger {

    public String generateHash(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    public String generateCertificateHash(Long donorId, String certCode, Double co2e, Double water, String date) {
        String payload = String.format("EVS-LEDGER-V1|DONOR:%d|CERT:%s|CO2:%f|WATER:%f|DATE:%s",
                donorId, certCode, co2e, water, date);
        return generateHash(payload);
    }
}
