package com.crypto.portfolio.controller;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.crypto.portfolio.dto.PaperAccountDTO;
import com.crypto.portfolio.dto.PaperTradeExecutionDTO;
import com.crypto.portfolio.dto.PaperTradeRequest;
import com.crypto.portfolio.service.PaperTradeService;

@RestController
@RequestMapping("/api/trades")
public class PaperTradeController {

    private final PaperTradeService paperTradeService;

    public PaperTradeController(PaperTradeService paperTradeService) {
        this.paperTradeService = paperTradeService;
    }

    @GetMapping("/paper/account")
    public ResponseEntity<PaperAccountDTO> getPaperAccount(@AuthenticationPrincipal Jwt jwt) {
        /*
         * The paper account belongs to the logged-in user. The frontend sends only the
         * bearer token, and the backend reads identity from the already-validated JWT.
         */
        String userId = jwt.getSubject();
        String emailId = jwt.getClaimAsString("email");

        return ResponseEntity.ok(paperTradeService.getPaperAccount(userId, emailId));
    }

    @PostMapping("/paper")
    public ResponseEntity<PaperTradeExecutionDTO> executePaperTrade(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody PaperTradeRequest request) {
        /*
         * The request contains only order details. User ownership and cash/holding
         * updates are handled server-side from the authenticated JWT.
         */
        String userId = jwt.getSubject();
        String emailId = jwt.getClaimAsString("email");

        return ResponseEntity.ok(paperTradeService.executePaperTrade(userId, emailId, request));
    }
}
