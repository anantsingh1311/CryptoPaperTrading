package com.crypto.portfolio.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

@Entity
public class Portfolio{

//Defining fields for portfolio database
@Id
@GeneratedValue
private long id;
@Column(nullable=false)
private String userId;
@Column(nullable=false)
private String emailId;
@Column(nullable=false)
private double balance;	

//JPA needs this empty constructor to recreate Portfolio objects from database rows.
public Portfolio() {}

public Portfolio(String userId, String emailId, double balance) {
	this.userId = userId;
	this.emailId = emailId;
	this.balance = balance;
}
public long getId() {
	return id;
}


public void setId(long id) {
	this.id = id;
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
