package com.crypto.portfolio.entity;

import java.math.BigDecimal;
import java.time.Instant;

import com.crypto.portfolio.dto.TradeSide;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "paper_trades")
public class PaperTrade {

    @Id
    @GeneratedValue
    private Long id;

    // The authenticated user who placed this simulated order.
    @Column(nullable = false)
    private String userId;

    // CoinGecko id used to refresh future prices for this asset.
    @Column(nullable = false)
    private String coinId;

    // Display ticker captured at execution time.
    @Column(nullable = false)
    private String symbol;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TradeSide side;

    @Column(nullable = false, precision = 28, scale = 10)
    private BigDecimal quantity;

    @Column(nullable = false)
    private String currency;

    // Price returned by the backend market service at the moment of execution.
    @Column(nullable = false, precision = 28, scale = 10)
    private BigDecimal executionPrice;

    // quantity * executionPrice, stored to make history rows stable over time.
    @Column(nullable = false, precision = 28, scale = 10)
    private BigDecimal notionalValue;

    // BUY trades keep this at zero; SELL trades record closed-position profit/loss.
    @Column(nullable = false, precision = 28, scale = 10)
    private BigDecimal realizedPnl;

    @Column(nullable = false)
    private Instant executedAt;

    public PaperTrade() {
    }

    public PaperTrade(
            String userId,
            String coinId,
            String symbol,
            TradeSide side,
            BigDecimal quantity,
            String currency,
            BigDecimal executionPrice,
            BigDecimal notionalValue,
            BigDecimal realizedPnl,
            Instant executedAt) {
        this.userId = userId;
        this.coinId = coinId;
        this.symbol = symbol;
        this.side = side;
        this.quantity = quantity;
        this.currency = currency;
        this.executionPrice = executionPrice;
        this.notionalValue = notionalValue;
        this.realizedPnl = realizedPnl;
        this.executedAt = executedAt;
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

    public TradeSide getSide() {
        return side;
    }

    public void setSide(TradeSide side) {
        this.side = side;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getExecutionPrice() {
        return executionPrice;
    }

    public void setExecutionPrice(BigDecimal executionPrice) {
        this.executionPrice = executionPrice;
    }

    public BigDecimal getNotionalValue() {
        return notionalValue;
    }

    public void setNotionalValue(BigDecimal notionalValue) {
        this.notionalValue = notionalValue;
    }

    public BigDecimal getRealizedPnl() {
        return realizedPnl;
    }

    public void setRealizedPnl(BigDecimal realizedPnl) {
        this.realizedPnl = realizedPnl;
    }

    public Instant getExecutedAt() {
        return executedAt;
    }

    public void setExecutedAt(Instant executedAt) {
        this.executedAt = executedAt;
    }
}
