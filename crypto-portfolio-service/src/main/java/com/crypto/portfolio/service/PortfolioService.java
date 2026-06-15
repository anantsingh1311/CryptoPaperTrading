package com.crypto.portfolio.service;

import com.crypto.portfolio.repository.PortfolioRepository;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.crypto.portfolio.dto.PortfolioDTO;
import com.crypto.portfolio.entity.*;

//Marks this class as a Spring service so the controller can inject and use it.
@Service
public class PortfolioService{

	// Every new paper-trading account starts with the same virtual cash balance.
	public static final double DEFAULT_PAPER_BALANCE = 100000.00;
	
	private PortfolioRepository portRepo;
		
	
	public PortfolioService(PortfolioRepository portRepo) {
		//Spring injects the repository here so this service can talk to the database.
		this.portRepo = portRepo;
	
	}
	
	
	//Now we need a method, that takes JWT token's assocsiated email and userID as a request, 
	//finds the user assoisciated with it, return it if it exists, 
	//if it doesnt, it should create one
	public PortfolioDTO fetchuserInformation(String emailID, String userID){
		
		//Asks the database to fetch the portfolio data 
		Optional<Portfolio> findportfolio = portRepo.findByEmailIdOrUserId(emailID, userID);
		
		if(findportfolio.isPresent()) {
			
			Portfolio portfolio = findportfolio.get();
			return new PortfolioDTO(portfolio.getUserId(), portfolio.getEmailId(), portfolio.getBalance());
		
		}
		
		Portfolio portfolio  = new Portfolio(userID, emailID, DEFAULT_PAPER_BALANCE);
		Portfolio createNewPortfolio = portRepo.save(portfolio);
		
		return new PortfolioDTO(createNewPortfolio.getUserId(), createNewPortfolio.getEmailId(), createNewPortfolio.getBalance());
		
	}
	
	
	
	
	
	
	
	
	
}

