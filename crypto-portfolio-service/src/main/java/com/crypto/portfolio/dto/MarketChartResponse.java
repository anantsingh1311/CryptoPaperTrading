package com.crypto.portfolio.dto;

import java.time.Instant;
import java.util.List;

public class MarketChartResponse {

    private String coinId;
    private String symbol;
    private String name;
    private String currency;
    private List<MarketChartPointDTO> points;
    private Instant fetchedAt;
    private Instant cacheExpiresAt;

    public MarketChartResponse(
            String coinId,
            String symbol,
            String name,
            String currency,
            List<MarketChartPointDTO> points,
            Instant fetchedAt,
            Instant cacheExpiresAt) {
        this.coinId = coinId;
        this.symbol = symbol;
        this.name = name;
        this.currency = currency;
        this.points = points;
        this.fetchedAt = fetchedAt;
        this.cacheExpiresAt = cacheExpiresAt;
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

    public List<MarketChartPointDTO> getPoints() {
        return points;
    }

    public void setPoints(List<MarketChartPointDTO> points) {
        this.points = points;
    }

    public Instant getFetchedAt() {
        return fetchedAt;
    }

    public void setFetchedAt(Instant fetchedAt) {
        this.fetchedAt = fetchedAt;
    }

    public Instant getCacheExpiresAt() {
        return cacheExpiresAt;
    }

    public void setCacheExpiresAt(Instant cacheExpiresAt) {
        this.cacheExpiresAt = cacheExpiresAt;
    }
}
