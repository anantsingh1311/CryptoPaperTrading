package com.crypto.portfolio.dto;

import java.math.BigDecimal;

public class MarketPriceDTO {

    private String coinId;
    private String symbol;
    private String name;
    private String currency;
    private BigDecimal price;
    private BigDecimal marketCap;
    private BigDecimal volume24h;
    private BigDecimal change24h;
    private Long lastUpdatedAt;

    public MarketPriceDTO(
            String coinId,
            String symbol,
            String name,
            String currency,
            BigDecimal price,
            BigDecimal marketCap,
            BigDecimal volume24h,
            BigDecimal change24h,
            Long lastUpdatedAt) {
        this.coinId = coinId;
        this.symbol = symbol;
        this.name = name;
        this.currency = currency;
        this.price = price;
        this.marketCap = marketCap;
        this.volume24h = volume24h;
        this.change24h = change24h;
        this.lastUpdatedAt = lastUpdatedAt;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getMarketCap() {
        return marketCap;
    }

    public void setMarketCap(BigDecimal marketCap) {
        this.marketCap = marketCap;
    }

    public BigDecimal getVolume24h() {
        return volume24h;
    }

    public void setVolume24h(BigDecimal volume24h) {
        this.volume24h = volume24h;
    }

    public BigDecimal getChange24h() {
        return change24h;
    }

    public void setChange24h(BigDecimal change24h) {
        this.change24h = change24h;
    }

    public Long getLastUpdatedAt() {
        return lastUpdatedAt;
    }

    public void setLastUpdatedAt(Long lastUpdatedAt) {
        this.lastUpdatedAt = lastUpdatedAt;
    }
}
