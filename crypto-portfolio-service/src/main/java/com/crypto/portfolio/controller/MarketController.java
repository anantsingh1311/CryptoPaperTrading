package com.crypto.portfolio.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.crypto.portfolio.dto.MarketChartResponse;
import com.crypto.portfolio.dto.MarketPriceResponse;
import com.crypto.portfolio.service.MarketPriceService;

@RestController
@RequestMapping("/api/market")
public class MarketController {

    private final MarketPriceService marketPriceService;

    public MarketController(MarketPriceService marketPriceService) {
        this.marketPriceService = marketPriceService;
    }

    @GetMapping("/prices")
    public ResponseEntity<MarketPriceResponse> getMarketPrices(
            @RequestParam String ids,
            @RequestParam(defaultValue = "usd") String currency,
            @RequestParam(defaultValue = "false") boolean fresh) {
        /*
         * Normal pages use cached prices. The paper trading live chart can pass
         * fresh=true for a current tick without changing existing frontend calls.
         */
        return ResponseEntity.ok(marketPriceService.getPrices(ids, currency, fresh));
    }

    @GetMapping("/chart")
    public ResponseEntity<MarketChartResponse> getMarketChart(
            @RequestParam String id,
            @RequestParam(defaultValue = "usd") String currency,
            @RequestParam(defaultValue = "1") int days) {
        /*
         * Live chart data is still owned by portfolio-service for now. React calls this
         * endpoint, and portfolio-service keeps the CoinGecko key backend-only.
         */
        return ResponseEntity.ok(marketPriceService.getChart(id, currency, days));
    }
}
