package com.crypto.portfolio.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.crypto.portfolio.entity.PaperHolding;

public interface PaperHoldingRepository extends JpaRepository<PaperHolding, Long> {

    // One open holding row is kept per user and coin.
    Optional<PaperHolding> findByUserIdAndCoinId(String userId, String coinId);

    // The account screen displays holdings in a stable, readable order.
    List<PaperHolding> findByUserIdOrderBySymbolAsc(String userId);
}
