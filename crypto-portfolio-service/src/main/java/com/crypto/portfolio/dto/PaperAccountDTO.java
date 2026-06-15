package com.crypto.portfolio.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class PaperAccountDTO {

    private String userId;
    private String emailId;
    private BigDecimal cashBalance;
    private BigDecimal holdingsValue;
    private BigDecimal totalEquity;
    private BigDecimal realizedPnl;
    private BigDecimal unrealizedPnl;
    private BigDecimal totalPnl;
    private int totalTrades;
    private Instant updatedAt;
    private List<PaperHoldingDTO> holdings;
    private List<PaperTradeDTO> recentTrades;

    public PaperAccountDTO(
            String userId,
            String emailId,
            BigDecimal cashBalance,
            BigDecimal holdingsValue,
            BigDecimal totalEquity,
            BigDecimal realizedPnl,
            BigDecimal unrealizedPnl,
            BigDecimal totalPnl,
            int totalTrades,
            Instant updatedAt,
            List<PaperHoldingDTO> holdings,
            List<PaperTradeDTO> recentTrades) {
        this.userId = userId;
        this.emailId = emailId;
        this.cashBalance = cashBalance;
        this.holdingsValue = holdingsValue;
        this.totalEquity = totalEquity;
        this.realizedPnl = realizedPnl;
        this.unrealizedPnl = unrealizedPnl;
        this.totalPnl = totalPnl;
        this.totalTrades = totalTrades;
        this.updatedAt = updatedAt;
        this.holdings = holdings;
        this.recentTrades = recentTrades;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getEmailId() {
        return emailId;
    }

    public void setEmailId(String emailId) {
        this.emailId = emailId;
    }

    public BigDecimal getCashBalance() {
        return cashBalance;
    }

    public void setCashBalance(BigDecimal cashBalance) {
        this.cashBalance = cashBalance;
    }

    public BigDecimal getHoldingsValue() {
        return holdingsValue;
    }

    public void setHoldingsValue(BigDecimal holdingsValue) {
        this.holdingsValue = holdingsValue;
    }

    public BigDecimal getTotalEquity() {
        return totalEquity;
    }

    public void setTotalEquity(BigDecimal totalEquity) {
        this.totalEquity = totalEquity;
    }

    public BigDecimal getRealizedPnl() {
        return realizedPnl;
    }

    public void setRealizedPnl(BigDecimal realizedPnl) {
        this.realizedPnl = realizedPnl;
    }

    public BigDecimal getUnrealizedPnl() {
        return unrealizedPnl;
    }

    public void setUnrealizedPnl(BigDecimal unrealizedPnl) {
        this.unrealizedPnl = unrealizedPnl;
    }

    public BigDecimal getTotalPnl() {
        return totalPnl;
    }

    public void setTotalPnl(BigDecimal totalPnl) {
        this.totalPnl = totalPnl;
    }

    public int getTotalTrades() {
        return totalTrades;
    }

    public void setTotalTrades(int totalTrades) {
        this.totalTrades = totalTrades;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<PaperHoldingDTO> getHoldings() {
        return holdings;
    }

    public void setHoldings(List<PaperHoldingDTO> holdings) {
        this.holdings = holdings;
    }

    public List<PaperTradeDTO> getRecentTrades() {
        return recentTrades;
    }

    public void setRecentTrades(List<PaperTradeDTO> recentTrades) {
        this.recentTrades = recentTrades;
    }
}
