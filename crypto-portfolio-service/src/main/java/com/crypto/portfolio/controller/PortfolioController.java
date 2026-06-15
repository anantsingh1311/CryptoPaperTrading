package com.crypto.portfolio.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.crypto.portfolio.dto.PortfolioDTO;
import com.crypto.portfolio.service.PortfolioService;

@RestController
@RequestMapping("/portfolio")
public class PortfolioController {

	private final PortfolioService portfolioService;

	public PortfolioController(PortfolioService portfolioService) {
		this.portfolioService = portfolioService;
	}

	/*
	 * This endpoint returns the portfolio for the user who is currently logged in.
	 *
	 * The frontend should call this route with:
	 * Authorization: Bearer <jwt-token>
	 *
	 * Spring Security validates the token before this method runs. After validation,
	 * @AuthenticationPrincipal gives us the decoded JWT so we can read the user
	 * identity from the trusted token instead of trusting userId/email from the
	 * frontend request body.
	 */
	/*
	 * Main route used by the frontend: /portfolio/information
	 * Backup route kept for older frontend calls: /portfolio/me
	 * Both routes call the same method so a route-name mismatch does not cause 404.
	 */
	@GetMapping({"/information", "/me"})
	public ResponseEntity<PortfolioDTO> fetchLoggedInUserPortfolio(@AuthenticationPrincipal Jwt jwt) {

		/*
		 * Auth-service creates the token with subject = username/userId.
		 * That means jwt.getSubject() is the logged-in user's username/userId.
		 */
		String userID = jwt.getSubject();

		/*
		 * Auth-service also adds an "email" claim to the JWT.
		 * Portfolio-service uses that email to find or create this user's portfolio.
		 */
		String emailID = jwt.getClaimAsString("email");

		/*
		 * If the token is valid but missing identity data, avoid calling the service
		 * with null values. That keeps the controller from creating bad portfolio rows.
		 */
		if (userID == null || emailID == null) {
			return ResponseEntity.badRequest().build();
		}

		/*
		 * The service owns the business logic:
		 * - find the existing portfolio for this user, or
		 * - create a default portfolio if it does not exist.
		 */
		PortfolioDTO portfolio = portfolioService.fetchuserInformation(emailID, userID);

		/*
		 * Return only the DTO to the frontend. This keeps database/entity details
		 * separate from the API response.
		 */
		return ResponseEntity.ok(portfolio);
	}
}

