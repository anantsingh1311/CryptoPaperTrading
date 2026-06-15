package com.crypto.portfolio.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class PaperTradeExecutionDTO {

    private String userId;
    private String coinId;
    private String symbol;
    private TradeSide side;
    private BigDecimal quantity;
    private String currency;
    private BigDecimal executionPrice;
    private BigDecimal notionalValue;
    private BigDecimal cashBalance;
    private BigDecimal realizedPnl;
    private Instant executedAt;

    public PaperTradeExecutionDTO(
            String userId,
            String coinId,
            String symbol,
            TradeSide side,
            BigDecimal quantity,
            String currency,
            BigDecimal executionPrice,
            BigDecimal notionalValue,
            BigDecimal cashBalance,
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
        this.cashBalance = cashBalance;
        this.realizedPnl = realizedPnl;
        this.executedAt = executedAt;
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

    public BigDecimal getCashBalance() {
        return cashBalance;
    }

    public void setCashBalance(BigDecimal cashBalance) {
        this.cashBalance = cashBalance;
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
