package com.crypto.portfolio.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.crypto.portfolio.entity.Portfolio;

import java.util.*;

public interface PortfolioRepository extends JpaRepository<Portfolio,Long>{
	
//	To find users by Email or UserID
//	Spring Data reads this method name from the entity fields: emailId OR userId.
	Optional<Portfolio> findByEmailIdOrUserId(String emailId, String userId);

	// Paper trading looks up the practice wallet by the trusted JWT subject.
	Optional<Portfolio> findByUserId(String userId);
	
// TO check whether that user Exists by username or by Email Id
//	Kept for future yes/no checks, but named from the actual Portfolio fields.
	boolean existsByEmailIdOrUserId(String emailId, String userId);
	
}
