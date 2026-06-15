package com.crypto.portfolio.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class MarketChartPointDTO {

    private Instant time;
    private BigDecimal price;

    public MarketChartPointDTO(Instant time, BigDecimal price) {
        this.time = time;
        this.price = price;
    }

    public Instant getTime() {
        return time;
    }

    public void setTime(Instant time) {
        this.time = time;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }
}
