package com.crypto.portfolio.dto;

import java.time.Instant;
import java.util.List;

public class MarketPriceResponse {

    private List<MarketPriceDTO> prices;
    private Instant fetchedAt;
    private Instant cacheExpiresAt;

    public MarketPriceResponse(List<MarketPriceDTO> prices, Instant fetchedAt, Instant cacheExpiresAt) {
        this.prices = prices;
        this.fetchedAt = fetchedAt;
        this.cacheExpiresAt = cacheExpiresAt;
    }

    public List<MarketPriceDTO> getPrices() {
        return prices;
    }

    public void setPrices(List<MarketPriceDTO> prices) {
        this.prices = prices;
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
