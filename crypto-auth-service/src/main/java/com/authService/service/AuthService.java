package com.authService.service;

import java.time.Instant;

import java.time.temporal.ChronoUnit;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import com.authService.dto.AuthResponse;
import com.authService.dto.LoginRequest;
import com.authService.dto.RegisterRequest;
import com.authService.entity.User;
import com.authService.repository.UserRepository;
@Service
public class AuthService{
	
	private final UserRepository userRepository;
	
	private final PasswordEncoder passwordEncoder;
	
	private final JwtEncoder jwtEncoder;
	
	public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtEncoder jwtEncoder) {
		
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtEncoder = jwtEncoder;
	}
	
	public String register(RegisterRequest request) {
		if(userRepository.existsByEmail(request.getEmail())) {
			return "Email already exists";
		}
		if(userRepository.existsByUsername(request.getUsername())) {
			return "username exists";
		}
		
		User user = new User(request.getEmail(),request.getUsername(),passwordEncoder.encode(request.getPassword()),"User");
		
		userRepository.save(user);
		return "User Saved Sucessfully";
	}
	
	
	public AuthResponse login(LoginRequest request) {
		
//		This line is retrieving the user from the database, suggesting Select * from Users where id = ?
		User user = userRepository.findByUsernameOrEmail(request.getUsername(), request.getEmail()).orElse(null);
		
		if(user == null) {
			return null;
		}
		boolean passwordMatches = passwordEncoder.matches(request.getPassword(), user.getPassword());
		
		if(!passwordMatches) {
			return null;
		}
		
		String token = generateToken(user);
		
		
		return new AuthResponse(
				user.getUsername(),
				user.getEmail(),
				user.getRole(),
				token
				);
		
	}
	
//	Helper function for AuthResponse login method:
	public String generateToken(User user) {
		
		Instant now = Instant.now();
		
		JwtClaimsSet claims = JwtClaimsSet
				.builder()
				.issuer("crypto-auth-service")
				.issuedAt(now)
				.expiresAt(now.plus(1,ChronoUnit.HOURS))
				.subject(user.getUsername())
				.claim("email", user.getEmail())
				.claim("role", user.getRole())
				.build();
		
		JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
		
		return jwtEncoder.encode(JwtEncoderParameters.from(header,claims)).getTokenValue();
		
	}
	
//	Service to approve the login
//	public Boolean login(LoginRequest request) {
//		return userRepository.findByEmail(request.getEmail()).map(user-> passwordEncoder.matches(request.getPassword(), user.getPassword())).orElse(false);
//		
//	}
//	public String login(LoginRequest request) {
//		
//		boolean valid =  userRepository.findByUsernameOrEmail(request.getUsername(), request.getEmail()).map(user->passwordEncoder.matches(request.getPassword(),user.getPassword())).orElse(false);
//		
//		if(valid) {
//			JwtConfigurer configurer = new 
//		}
//	}
	
	

}