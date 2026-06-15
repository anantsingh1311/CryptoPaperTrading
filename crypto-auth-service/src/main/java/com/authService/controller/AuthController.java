package com.authService.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.authService.dto.AuthResponse;
import com.authService.dto.LoginRequest;
import com.authService.dto.RegisterRequest;
import com.authService.service.AuthService;
import org.springframework.http.ResponseEntity;
import com.authService.dto.LoginRequest;
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/auth")
public class AuthController{
	
	private final AuthService authService;
	
	public AuthController(AuthService authService) {
		this.authService = authService;
	}
	
	@PostMapping("/register")
	public String register(@RequestBody RegisterRequest request) {
		return authService.register(request);
	}
	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request){
		AuthResponse response = authService.login(request);
		if(response == null) {
			return ResponseEntity.status(401).build();
		}
		return ResponseEntity.ok(response);
		
	}
}