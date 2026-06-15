package com.authService.repository;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

import com.authService.dto.LoginRequest;
import com.authService.entity.User;

/*
 * 
 * These are repository functions that extends User table as their blueprints for creating functions to reterieve data 
 * Example: Optional<user> findByEmail(String email) tells thhe database that fetch a user using query: Select * from users where emailId = "?"
 */



public interface UserRepository extends JpaRepository<User, Long>{
	Optional<User> findByEmail(String email);
	
	Optional<User> findByUsername(String username);
	
	Optional<User> findByUsernameOrEmail(String username, String email);
	
	
	boolean existsByUsername(String username);

	
	boolean existsByEmail(String email);
	
	boolean existsByUsernameOrEmail(String username, String email);
	
	
}