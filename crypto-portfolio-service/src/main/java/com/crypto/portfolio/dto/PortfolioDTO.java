package com.crypto.portfolio.dto;



public class PortfolioDTO{
	
	private String userId;
	private String emailId;
	private double balance;
	/**
	 * @param userId
	 * @param emailId
	 * @param balance
	 */
	public PortfolioDTO(String userId, String emailId, double balance) {
		super();
		this.userId = userId;
		this.emailId = emailId;
		this.balance = balance;
	}
	public String getUserId() {
		return userId;
	}
	public void setUserId(String userId) {
		this.userId = userId;
	}
	public String getEmailId() {
		return emailId;
	}
	public void setEmailId(String emailId) {
		this.emailId = emailId;
	}
	public double getBalance() {
		return balance;
	}
	public void setBalance(double balance) {
		this.balance = balance;
	}
	
	
	
	
}