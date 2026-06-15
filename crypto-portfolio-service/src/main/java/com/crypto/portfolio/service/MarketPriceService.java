package com.crypto.portfolio.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import com.crypto.portfolio.dto.MarketChartPointDTO;
import com.crypto.portfolio.dto.MarketChartResponse;
import com.crypto.portfolio.dto.MarketPriceDTO;
import com.crypto.portfolio.dto.MarketPriceResponse;
import com.crypto.portfolio.exception.MarketPriceException;

@Service
public class MarketPriceService {

    /*
     * Keep a tiny metadata map for the coins currently shown in the React market page.
     * CoinGecko's /simple/price endpoint returns ids and numbers, not friendly names.
     */
    private static final Map<String, CoinMetadata> COIN_METADATA = Map.of(
            "bitcoin", new CoinMetadata("BTC", "Bitcoin"),
            "ethereum", new CoinMetadata("ETH", "Ethereum"),
            "solana", new CoinMetadata("SOL", "Solana"));

    private final RestClient restClient;
    private final String apiKey;
    private final Duration cacheTtl;
    private final Map<String, CacheEntry> priceCache = new ConcurrentHashMap<>();
    private final Map<String, ChartCacheEntry> chartCache = new ConcurrentHashMap<>();

    public MarketPriceService(
            @Value("${coingecko.base-url:https://api.coingecko.com/api/v3}") String baseUrl,
            @Value("${coingecko.api-key:}") String apiKey,
            @Value("${coingecko.cache-ttl-seconds:45}") long cacheTtlSeconds) {
        /*
         * Spring normally reads these from environment variables through application.properties.
         * The small resolver below also handles the common Windows/Eclipse case where the
         * user-level environment variable exists but the already-open IDE did not inherit it.
         */
        String resolvedBaseUrl = resolveBackendConfigValue(baseUrl, "COINGECKO_BASE_URL");

        this.restClient = RestClient.builder()
                .baseUrl(resolvedBaseUrl)
                .build();

        /*
         * This key is used only inside the Portfolio service. The frontend still calls our
         * backend endpoint and never receives or sends the CoinGecko API key.
         */
        this.apiKey = resolveBackendConfigValue(apiKey, "COINGECKO_API_KEY");
        this.cacheTtl = Duration.ofSeconds(cacheTtlSeconds);
    }

    public MarketPriceResponse getPrices(String ids, String currency) {
        return getPrices(ids, currency, false);
    }

    public MarketPriceResponse getPrices(String ids, String currency, boolean forceRefresh) {
        // Normalize request values once so cache keys and CoinGecko params are consistent.
        List<String> coinIds = normalizeCoinIds(ids);
        String normalizedCurrency = normalizeCurrency(currency);
        CacheEntry cacheEntry = getOrRefreshCache(coinIds, normalizedCurrency, forceRefresh);

        List<MarketPriceDTO> orderedPrices = new ArrayList<>();
        for (String coinId : coinIds) {
            MarketPriceDTO price = cacheEntry.pricesByCoinId().get(coinId);
            if (price == null) {
                throw new MarketPriceException(
                        HttpStatus.BAD_GATEWAY,
                        "Market price data is incomplete for the requested assets.");
            }
            orderedPrices.add(price);
        }

        return new MarketPriceResponse(orderedPrices, cacheEntry.fetchedAt(), cacheEntry.expiresAt());
    }

    public MarketPriceDTO getLatestPriceForTrade(String coinId, String currency) {
        // Paper trading uses this method so execution price always comes from the backend.
        MarketPriceResponse response = getPrices(coinId, currency);
        return response.getPrices().get(0);
    }

    public MarketChartResponse getChart(String coinId, String currency, int days) {
        /*
         * React uses this route for live price graphs. We cache chart payloads the same
         * way as simple prices so browser polling does not hammer the market provider.
         */
        String normalizedCoinId = normalizeSingleCoinId(coinId);
        String normalizedCurrency = normalizeCurrency(currency);
        int normalizedDays = normalizeChartDays(days);
        ChartCacheEntry cacheEntry = getOrRefreshChartCache(normalizedCoinId, normalizedCurrency, normalizedDays);

        return cacheEntry.response();
    }

    private CacheEntry getOrRefreshCache(List<String> coinIds, String currency, boolean forceRefresh) {
        String cacheKey = buildCacheKey(coinIds, currency);
        CacheEntry cachedEntry = priceCache.get(cacheKey);

        // Return cached data while it is fresh so React refreshes do not hit CoinGecko every time.
        if (!forceRefresh && cachedEntry != null && cachedEntry.expiresAt().isAfter(Instant.now())) {
            return cachedEntry;
        }

        /*
         * Only one request should refresh a missing/expired cache entry at a time.
         * Other requests wait here and then reuse the refreshed value.
         */
        synchronized (priceCache) {
            cachedEntry = priceCache.get(cacheKey);
            if (!forceRefresh && cachedEntry != null && cachedEntry.expiresAt().isAfter(Instant.now())) {
                return cachedEntry;
            }

            CacheEntry refreshedEntry = fetchFromCoinGecko(coinIds, currency);
            priceCache.put(cacheKey, refreshedEntry);
            return refreshedEntry;
        }
    }

    private ChartCacheEntry getOrRefreshChartCache(String coinId, String currency, int days) {
        String cacheKey = coinId + "|" + currency + "|" + days;
        ChartCacheEntry cachedEntry = chartCache.get(cacheKey);

        if (cachedEntry != null && cachedEntry.expiresAt().isAfter(Instant.now())) {
            return cachedEntry;
        }

        /*
         * Use one monitor for chart cache refreshes. This is intentionally simple
         * because the project currently supports only a few homepage trading coins.
         */
        synchronized (chartCache) {
            cachedEntry = chartCache.get(cacheKey);
            if (cachedEntry != null && cachedEntry.expiresAt().isAfter(Instant.now())) {
                return cachedEntry;
            }

            ChartCacheEntry refreshedEntry = fetchChartFromCoinGecko(coinId, currency, days);
            chartCache.put(cacheKey, refreshedEntry);
            return refreshedEntry;
        }
    }

    private CacheEntry fetchFromCoinGecko(List<String> coinIds, String currency) {
        // A blank key means backend config is missing; return a clean 503 instead of a stack trace.
        if (apiKey == null || apiKey.isBlank()) {
            throw new MarketPriceException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Market price service is not configured.");
        }

        try {
            // Portfolio service is the only place that talks to CoinGecko.
            Map<String, Map<String, Object>> response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/simple/price")
                            .queryParam("ids", String.join(",", coinIds))
                            .queryParam("vs_currencies", currency)
                            .queryParam("include_market_cap", "true")
                            .queryParam("include_24hr_vol", "true")
                            .queryParam("include_24hr_change", "true")
                            .queryParam("include_last_updated_at", "true")
                            .build())
                    // CoinGecko Demo API authentication header.
                    .header("x-cg-demo-api-key", apiKey)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Map<String, Object>>>() {
                    });

            return mapCoinGeckoResponse(response, coinIds, currency);
        } catch (RestClientResponseException exception) {
            throw new MarketPriceException(
                    HttpStatus.BAD_GATEWAY,
                    "Market price provider returned an error.");
        } catch (RestClientException exception) {
            throw new MarketPriceException(
                    HttpStatus.BAD_GATEWAY,
                    "Market price provider is not reachable.");
        }
    }

    private ChartCacheEntry fetchChartFromCoinGecko(String coinId, String currency, int days) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new MarketPriceException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Market price service is not configured.");
        }

        try {
            Map<String, Object> response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/coins/{id}/market_chart")
                            .queryParam("vs_currency", currency)
                            .queryParam("days", days)
                            .build(coinId))
                    .header("x-cg-demo-api-key", apiKey)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            return mapCoinGeckoChartResponse(response, coinId, currency);
        } catch (RestClientResponseException exception) {
            throw new MarketPriceException(
                    HttpStatus.BAD_GATEWAY,
                    "Market chart provider returned an error.");
        } catch (RestClientException exception) {
            throw new MarketPriceException(
                    HttpStatus.BAD_GATEWAY,
                    "Market chart provider is not reachable.");
        }
    }

    private CacheEntry mapCoinGeckoResponse(
            Map<String, Map<String, Object>> response,
            List<String> coinIds,
            String currency) {
        // Do not pass raw provider errors or malformed provider responses to the frontend.
        if (response == null || response.isEmpty()) {
            throw new MarketPriceException(
                    HttpStatus.BAD_GATEWAY,
                    "Market price provider returned an invalid response.");
        }

        Instant fetchedAt = Instant.now();
        Instant expiresAt = fetchedAt.plus(cacheTtl);
        Map<String, MarketPriceDTO> pricesByCoinId = new ConcurrentHashMap<>();

        // Convert CoinGecko's nested JSON map into stable DTOs for the React UI and trades.
        for (String coinId : coinIds) {
            Map<String, Object> coinNode = response.get(coinId);
            if (coinNode == null || !coinNode.containsKey(currency)) {
                throw new MarketPriceException(
                        HttpStatus.BAD_GATEWAY,
                        "Market price data is unavailable for one or more requested assets.");
            }

            String marketCapField = currency + "_market_cap";
            String volumeField = currency + "_24h_vol";
            String changeField = currency + "_24h_change";
            CoinMetadata metadata = COIN_METADATA.getOrDefault(
                    coinId,
                    new CoinMetadata(coinId.toUpperCase(Locale.ROOT), toDisplayName(coinId)));

            pricesByCoinId.put(coinId, new MarketPriceDTO(
                    coinId,
                    metadata.symbol(),
                    metadata.name(),
                    currency,
                    decimalValue(coinNode, currency),
                    decimalValue(coinNode, marketCapField),
                    decimalValue(coinNode, volumeField),
                    decimalValue(coinNode, changeField),
                    longValue(coinNode, "last_updated_at")));
        }

        return new CacheEntry(pricesByCoinId, fetchedAt, expiresAt);
    }

    private ChartCacheEntry mapCoinGeckoChartResponse(
            Map<String, Object> response,
            String coinId,
            String currency) {
        if (response == null || response.isEmpty()) {
            throw new MarketPriceException(
                    HttpStatus.BAD_GATEWAY,
                    "Market chart provider returned an invalid response.");
        }

        Object rawPrices = response.get("prices");
        if (!(rawPrices instanceof List<?> priceRows) || priceRows.isEmpty()) {
            throw new MarketPriceException(
                    HttpStatus.BAD_GATEWAY,
                    "Market chart data is unavailable for the requested asset.");
        }

        List<MarketChartPointDTO> points = new ArrayList<>();

        /*
         * CoinGecko chart rows arrive as [unixMillis, price]. Convert them into a DTO
         * shape that React can draw directly without understanding provider format.
         */
        for (Object row : priceRows) {
            if (!(row instanceof List<?> values) || values.size() < 2) {
                continue;
            }

            Long unixMillis = longValue(values.get(0));
            BigDecimal price = decimalValue(values.get(1));

            if (unixMillis != null && price != null) {
                points.add(new MarketChartPointDTO(Instant.ofEpochMilli(unixMillis), price));
            }
        }

        if (points.isEmpty()) {
            throw new MarketPriceException(
                    HttpStatus.BAD_GATEWAY,
                    "Market chart provider returned no usable prices.");
        }

        Instant fetchedAt = Instant.now();
        Instant expiresAt = fetchedAt.plus(cacheTtl);
        CoinMetadata metadata = COIN_METADATA.getOrDefault(
                coinId,
                new CoinMetadata(coinId.toUpperCase(Locale.ROOT), toDisplayName(coinId)));
        MarketChartResponse chartResponse = new MarketChartResponse(
                coinId,
                metadata.symbol(),
                metadata.name(),
                currency,
                points,
                fetchedAt,
                expiresAt);

        return new ChartCacheEntry(chartResponse, expiresAt);
    }

    private String resolveBackendConfigValue(String springValue, String environmentVariableName) {
        /*
         * First choice: Spring property value. This covers normal launches where
         * application.properties resolves COINGECKO_API_KEY / COINGECKO_BASE_URL.
         */
        if (springValue != null && !springValue.isBlank()) {
            return springValue.trim();
        }

        /*
         * Second choice: the Java process environment. This covers command-line starts
         * after the variable is set in the same terminal/session.
         */
        String processEnvironmentValue = System.getenv(environmentVariableName);
        if (processEnvironmentValue != null && !processEnvironmentValue.isBlank()) {
            return processEnvironmentValue.trim();
        }

        /*
         * Final local-dev fallback: read the Windows user environment from HKCU.
         * This keeps the key backend-only and avoids hardcoding it in source files.
         */
        return readWindowsUserEnvironmentValue(environmentVariableName);
    }

    private String readWindowsUserEnvironmentValue(String environmentVariableName) {
        String osName = System.getProperty("os.name", "").toLowerCase(Locale.ROOT);
        if (!osName.contains("windows")) {
            return "";
        }

        try {
            Process process = new ProcessBuilder(
                    "reg",
                    "query",
                    "HKCU\\Environment",
                    "/v",
                    environmentVariableName)
                    .redirectErrorStream(true)
                    .start();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    String trimmedLine = line.trim();
                    if (trimmedLine.startsWith(environmentVariableName + " ")) {
                        String[] columns = trimmedLine.split("\\s+", 3);
                        if (columns.length == 3) {
                            return columns[2].trim();
                        }
                    }
                }
            }

            process.waitFor();
        } catch (IOException exception) {
            return "";
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return "";
        }

        return "";
    }

    private List<String> normalizeCoinIds(String ids) {
        if (ids == null || ids.isBlank()) {
            throw new MarketPriceException(HttpStatus.BAD_REQUEST, "At least one coin id is required.");
        }

        Set<String> normalizedIds = new LinkedHashSet<>();
        for (String id : ids.split(",")) {
            String normalizedId = id.trim().toLowerCase(Locale.ROOT);
            if (!normalizedId.isBlank()) {
                normalizedIds.add(normalizedId);
            }
        }

        if (normalizedIds.isEmpty()) {
            throw new MarketPriceException(HttpStatus.BAD_REQUEST, "At least one coin id is required.");
        }

        return List.copyOf(normalizedIds);
    }

    private String normalizeSingleCoinId(String coinId) {
        List<String> coinIds = normalizeCoinIds(coinId);
        if (coinIds.size() != 1) {
            throw new MarketPriceException(HttpStatus.BAD_REQUEST, "Exactly one coin id is required.");
        }

        return coinIds.get(0);
    }

    private String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return "usd";
        }

        return currency.trim().toLowerCase(Locale.ROOT);
    }

    private int normalizeChartDays(int days) {
        if (days < 1) {
            return 1;
        }

        // Keep provider payloads modest for the student project UI.
        return Math.min(days, 30);
    }

    private String buildCacheKey(List<String> coinIds, String currency) {
        List<String> sortedIds = new ArrayList<>(coinIds);
        sortedIds.sort(Comparator.naturalOrder());
        return String.join(",", sortedIds) + "|" + currency;
    }

    private BigDecimal decimalValue(Map<String, Object> node, String fieldName) {
        return decimalValue(node.get(fieldName));
    }

    private BigDecimal decimalValue(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof BigDecimal decimalValue) {
            return decimalValue;
        }

        if (value instanceof Number numberValue) {
            return BigDecimal.valueOf(numberValue.doubleValue());
        }

        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private Long longValue(Map<String, Object> node, String fieldName) {
        return longValue(node.get(fieldName));
    }

    private Long longValue(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof Number numberValue) {
            return numberValue.longValue();
        }

        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private String toDisplayName(String coinId) {
        String[] words = coinId.split("-");
        List<String> displayWords = new ArrayList<>();
        for (String word : words) {
            if (word.isBlank()) {
                continue;
            }
            displayWords.add(word.substring(0, 1).toUpperCase(Locale.ROOT) + word.substring(1));
        }
        return String.join(" ", displayWords);
    }

    private record CacheEntry(Map<String, MarketPriceDTO> pricesByCoinId, Instant fetchedAt, Instant expiresAt) {
    }

    private record ChartCacheEntry(MarketChartResponse response, Instant expiresAt) {
    }

    private record CoinMetadata(String symbol, String name) {
    }
}
