package com.crypto.portfolio.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.crypto.portfolio.entity.PaperTrade;

public interface PaperTradeRepository extends JpaRepository<PaperTrade, Long> {

    // Newest trades first keeps the frontend history table useful without extra sorting.
    List<PaperTrade> findByUserIdOrderByExecutedAtDesc(String userId);
}
