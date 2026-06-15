package com.crypto.portfolio.entity;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "paper_holdings",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "coin_id"}))
public class PaperHolding {

    @Id
    @GeneratedValue
    private Long id;

    // Each holding belongs to the same authenticated user id stored in Portfolio.
    @Column(name = "user_id", nullable = false)
    private String userId;

    // CoinGecko id, for example bitcoin, ethereum, or solana.
    @Column(name = "coin_id", nullable = false)
    private String coinId;

    // Short display ticker used by the React tables and order confirmation.
    @Column(nullable = false)
    private String symbol;

    // Quantity is stored as BigDecimal so fractional crypto amounts stay accurate.
    @Column(nullable = false, precision = 28, scale = 10)
    private BigDecimal quantity;

    // Weighted average paper entry price for the open position.
    @Column(nullable = false, precision = 28, scale = 10)
    private BigDecimal averagePrice;

    // Updated whenever a buy or sell changes this holding.
    @Column(nullable = false)
    private Instant updatedAt;

    public PaperHolding() {
    }

    public PaperHolding(
            String userId,
            String coinId,
            String symbol,
            BigDecimal quantity,
            BigDecimal averagePrice,
            Instant updatedAt) {
        this.userId = userId;
        this.coinId = coinId;
        this.symbol = symbol;
        this.quantity = quantity;
        this.averagePrice = averagePrice;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getCoinId() {
        return coinId;
    }

    public void setCoinId(String coinId) {
        this.coinId = coinId;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getAveragePrice() {
        return averagePrice;
    }

    public void setAveragePrice(BigDecimal averagePrice) {
        this.averagePrice = averagePrice;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
