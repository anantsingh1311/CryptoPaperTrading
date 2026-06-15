package com.crypto.portfolio.exception;

import org.springframework.http.HttpStatus;

public class MarketPriceException extends RuntimeException {

    private final HttpStatus status;

    public MarketPriceException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
