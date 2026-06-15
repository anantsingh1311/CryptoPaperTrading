package com.crypto.portfolio.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crypto.portfolio.dto.MarketPriceDTO;
import com.crypto.portfolio.dto.MarketPriceResponse;
import com.crypto.portfolio.dto.PaperAccountDTO;
import com.crypto.portfolio.dto.PaperHoldingDTO;
import com.crypto.portfolio.dto.PaperTradeDTO;
import com.crypto.portfolio.dto.PaperTradeExecutionDTO;
import com.crypto.portfolio.dto.PaperTradeRequest;
import com.crypto.portfolio.dto.TradeSide;
import com.crypto.portfolio.entity.PaperHolding;
import com.crypto.portfolio.entity.PaperTrade;
import com.crypto.portfolio.entity.Portfolio;
import com.crypto.portfolio.exception.MarketPriceException;
import com.crypto.portfolio.exception.PaperTradeException;
import com.crypto.portfolio.repository.PaperHoldingRepository;
import com.crypto.portfolio.repository.PaperTradeRepository;
import com.crypto.portfolio.repository.PortfolioRepository;

@Service
public class PaperTradeService {

    private static final String PAPER_CURRENCY = "usd";
    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final MarketPriceService marketPriceService;
    private final PortfolioRepository portfolioRepository;
    private final PaperHoldingRepository paperHoldingRepository;
    private final PaperTradeRepository paperTradeRepository;

    public PaperTradeService(
            MarketPriceService marketPriceService,
            PortfolioRepository portfolioRepository,
            PaperHoldingRepository paperHoldingRepository,
            PaperTradeRepository paperTradeRepository) {
        this.marketPriceService = marketPriceService;
        this.portfolioRepository = portfolioRepository;
        this.paperHoldingRepository = paperHoldingRepository;
        this.paperTradeRepository = paperTradeRepository;
    }

    @Transactional
    public PaperAccountDTO getPaperAccount(String userId, String emailId) {
        /*
         * Opening the paper-trading page should always give the user a usable demo
         * wallet. If they have not visited Profile yet, this creates their Portfolio
         * row using the same portfolio-service table instead of relying on another
         * microservice.
         */
        Portfolio portfolio = getOrCreatePortfolio(userId, emailId);
        List<PaperHolding> holdings = paperHoldingRepository.findByUserIdOrderBySymbolAsc(userId);
        Map<String, MarketPriceDTO> latestPricesByCoinId = fetchLatestPricesForHoldings(holdings);

        BigDecimal cashBalance = moneyValue(portfolio.getBalance());
        BigDecimal holdingsValue = ZERO;
        BigDecimal unrealizedPnl = ZERO;
        List<PaperHoldingDTO> holdingDtos = new ArrayList<>();

        /*
         * Holdings are valued with fresh backend market prices so the account summary
         * moves with the live market even when the user has not placed a new trade.
         */
        for (PaperHolding holding : holdings) {
            MarketPriceDTO latestPrice = latestPricesByCoinId.get(holding.getCoinId());
            BigDecimal currentPrice = requireUsablePrice(latestPrice, holding.getCoinId());
            BigDecimal currentValue = currentPrice.multiply(holding.getQuantity());
            BigDecimal costBasis = holding.getAveragePrice().multiply(holding.getQuantity());
            BigDecimal positionPnl = currentValue.subtract(costBasis);

            holdingsValue = holdingsValue.add(currentValue);
            unrealizedPnl = unrealizedPnl.add(positionPnl);

            holdingDtos.add(new PaperHoldingDTO(
                    holding.getCoinId(),
                    holding.getSymbol(),
                    holding.getQuantity(),
                    holding.getAveragePrice(),
                    currentPrice,
                    currentValue,
                    costBasis,
                    positionPnl));
        }

        List<PaperTrade> trades = paperTradeRepository.findByUserIdOrderByExecutedAtDesc(userId);
        BigDecimal realizedPnl = calculateRealizedPnl(trades);
        BigDecimal totalPnl = realizedPnl.add(unrealizedPnl);

        return new PaperAccountDTO(
                portfolio.getUserId(),
                portfolio.getEmailId(),
                cashBalance,
                holdingsValue,
                cashBalance.add(holdingsValue),
                realizedPnl,
                unrealizedPnl,
                totalPnl,
                trades.size(),
                Instant.now(),
                holdingDtos,
                toRecentTradeDtos(trades));
    }

    @Transactional
    public PaperTradeExecutionDTO executePaperTrade(String userId, String emailId, PaperTradeRequest request) {
        Portfolio portfolio = getOrCreatePortfolio(userId, emailId);
        String coinId = normalizeCoinId(request.getCoinId());
        String symbol = normalizeSymbol(request.getSymbol());
        BigDecimal quantity = normalizeQuantity(request.getQuantity());

        /*
         * The frontend never chooses the execution price. The backend fetches the
         * current market price at order time so paper fills cannot be manipulated by
         * editing browser state.
         */
        MarketPriceDTO marketPrice = marketPriceService.getLatestPriceForTrade(coinId, PAPER_CURRENCY);
        BigDecimal executionPrice = requireUsablePrice(marketPrice, coinId);
        BigDecimal notionalValue = executionPrice.multiply(quantity);
        BigDecimal realizedPnl = ZERO;
        Instant executedAt = Instant.now();

        if (request.getSide() == TradeSide.BUY) {
            executeBuy(portfolio, userId, coinId, symbol, quantity, executionPrice, notionalValue, executedAt);
        } else if (request.getSide() == TradeSide.SELL) {
            realizedPnl = executeSell(portfolio, userId, coinId, quantity, notionalValue, executedAt);
        } else {
            throw new PaperTradeException(HttpStatus.BAD_REQUEST, "Trade side must be BUY or SELL.");
        }

        /*
         * Store every paper fill after cash/holding updates. The history table uses
         * this immutable execution record instead of trying to recreate old trades
         * from the current holding state.
         */
        paperTradeRepository.save(new PaperTrade(
                userId,
                coinId,
                symbol,
                request.getSide(),
                quantity,
                marketPrice.getCurrency(),
                executionPrice,
                notionalValue,
                realizedPnl,
                executedAt));

        return new PaperTradeExecutionDTO(
                userId,
                coinId,
                symbol,
                request.getSide(),
                quantity,
                marketPrice.getCurrency(),
                executionPrice,
                notionalValue,
                moneyValue(portfolio.getBalance()),
                realizedPnl,
                executedAt);
    }

    private void executeBuy(
            Portfolio portfolio,
            String userId,
            String coinId,
            String symbol,
            BigDecimal quantity,
            BigDecimal executionPrice,
            BigDecimal notionalValue,
            Instant executedAt) {
        BigDecimal currentCash = moneyValue(portfolio.getBalance());

        if (currentCash.compareTo(notionalValue) < 0) {
            throw new PaperTradeException(
                    HttpStatus.BAD_REQUEST,
                    "Your paper cash balance is too low for this buy order.");
        }

        portfolio.setBalance(currentCash.subtract(notionalValue).doubleValue());
        portfolioRepository.save(portfolio);

        /*
         * Buying more of a coin updates the weighted average price:
         * (old cost basis + new order value) / new total quantity.
         */
        PaperHolding holding = paperHoldingRepository
                .findByUserIdAndCoinId(userId, coinId)
                .orElseGet(() -> new PaperHolding(userId, coinId, symbol, ZERO, ZERO, executedAt));

        BigDecimal oldCostBasis = holding.getAveragePrice().multiply(holding.getQuantity());
        BigDecimal newQuantity = holding.getQuantity().add(quantity);
        BigDecimal newCostBasis = oldCostBasis.add(notionalValue);
        BigDecimal newAveragePrice = newCostBasis.divide(newQuantity, 10, RoundingMode.HALF_UP);

        holding.setSymbol(symbol);
        holding.setQuantity(newQuantity);
        holding.setAveragePrice(newAveragePrice);
        holding.setUpdatedAt(executedAt);
        paperHoldingRepository.save(holding);
    }

    private BigDecimal executeSell(
            Portfolio portfolio,
            String userId,
            String coinId,
            BigDecimal quantity,
            BigDecimal notionalValue,
            Instant executedAt) {
        PaperHolding holding = paperHoldingRepository
                .findByUserIdAndCoinId(userId, coinId)
                .orElseThrow(() -> new PaperTradeException(
                        HttpStatus.BAD_REQUEST,
                        "You do not have enough paper holdings to sell this asset."));

        if (holding.getQuantity().compareTo(quantity) < 0) {
            throw new PaperTradeException(
                    HttpStatus.BAD_REQUEST,
                    "You do not have enough paper holdings to sell this quantity.");
        }

        BigDecimal currentCash = moneyValue(portfolio.getBalance());
        BigDecimal costBasisForSoldQuantity = holding.getAveragePrice().multiply(quantity);
        BigDecimal realizedPnl = notionalValue.subtract(costBasisForSoldQuantity);
        BigDecimal remainingQuantity = holding.getQuantity().subtract(quantity);

        portfolio.setBalance(currentCash.add(notionalValue).doubleValue());
        portfolioRepository.save(portfolio);

        /*
         * When a sell closes the position, remove the holding row so the account table
         * stays clean. Partial sells keep the original average entry price.
         */
        if (remainingQuantity.compareTo(ZERO) == 0) {
            paperHoldingRepository.delete(holding);
        } else {
            holding.setQuantity(remainingQuantity);
            holding.setUpdatedAt(executedAt);
            paperHoldingRepository.save(holding);
        }

        return realizedPnl;
    }

    private Portfolio getOrCreatePortfolio(String userId, String emailId) {
        String safeEmailId = normalizeEmailForPortfolio(userId, emailId);

        return portfolioRepository
                .findByEmailIdOrUserId(safeEmailId, userId)
                .orElseGet(() -> portfolioRepository.save(new Portfolio(
                        userId,
                        safeEmailId,
                        PortfolioService.DEFAULT_PAPER_BALANCE)));
    }

    private Map<String, MarketPriceDTO> fetchLatestPricesForHoldings(List<PaperHolding> holdings) {
        if (holdings.isEmpty()) {
            return Map.of();
        }

        String ids = holdings.stream()
                .map(PaperHolding::getCoinId)
                .distinct()
                .collect(Collectors.joining(","));

        MarketPriceResponse response = marketPriceService.getPrices(ids, PAPER_CURRENCY);

        return response.getPrices()
                .stream()
                .collect(Collectors.toMap(MarketPriceDTO::getCoinId, Function.identity()));
    }

    private BigDecimal calculateRealizedPnl(List<PaperTrade> trades) {
        BigDecimal realizedPnl = ZERO;

        for (PaperTrade trade : trades) {
            if (trade.getRealizedPnl() != null) {
                realizedPnl = realizedPnl.add(trade.getRealizedPnl());
            }
        }

        return realizedPnl;
    }

    private List<PaperTradeDTO> toRecentTradeDtos(List<PaperTrade> trades) {
        List<PaperTradeDTO> recentTrades = new ArrayList<>();
        int limit = Math.min(20, trades.size());

        for (int index = 0; index < limit; index++) {
            PaperTrade trade = trades.get(index);
            recentTrades.add(new PaperTradeDTO(
                    trade.getCoinId(),
                    trade.getSymbol(),
                    trade.getSide(),
                    trade.getQuantity(),
                    trade.getCurrency(),
                    trade.getExecutionPrice(),
                    trade.getNotionalValue(),
                    trade.getRealizedPnl(),
                    trade.getExecutedAt()));
        }

        return recentTrades;
    }

    private BigDecimal requireUsablePrice(MarketPriceDTO marketPrice, String coinId) {
        if (marketPrice == null || marketPrice.getPrice() == null || marketPrice.getPrice().compareTo(ZERO) <= 0) {
            throw new MarketPriceException(
                    HttpStatus.BAD_GATEWAY,
                    "Market price data is unavailable for " + coinId + ".");
        }

        return marketPrice.getPrice();
    }

    private BigDecimal normalizeQuantity(BigDecimal quantity) {
        if (quantity == null || quantity.compareTo(ZERO) <= 0) {
            throw new PaperTradeException(HttpStatus.BAD_REQUEST, "Trade quantity must be greater than zero.");
        }

        return quantity.stripTrailingZeros();
    }

    private String normalizeCoinId(String coinId) {
        if (coinId == null || coinId.isBlank()) {
            throw new PaperTradeException(HttpStatus.BAD_REQUEST, "Coin id is required.");
        }

        return coinId.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeSymbol(String symbol) {
        if (symbol == null || symbol.isBlank()) {
            throw new PaperTradeException(HttpStatus.BAD_REQUEST, "Symbol is required.");
        }

        return symbol.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeEmailForPortfolio(String userId, String emailId) {
        if (emailId != null && !emailId.isBlank()) {
            return emailId.trim();
        }

        /*
         * Portfolio.emailId is required in the database. This fallback is only for
         * valid JWTs that somehow do not include the email claim.
         */
        return userId + "@paper.local";
    }

    private BigDecimal moneyValue(double value) {
        return BigDecimal.valueOf(value);
    }
}
