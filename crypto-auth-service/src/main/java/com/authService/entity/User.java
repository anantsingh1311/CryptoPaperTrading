package com.authService.entity;

import jakarta.persistence.*;


@Entity
@Table(name="Users")
public class User{
	
	@Id
	@GeneratedValue(strategy= GenerationType.IDENTITY)
//	user id
	private Long id;
	
	@Column(unique=true)
//	registeration username:
	private String username;
	


	//	registration email
	
	private String email;
//	password 
	private String password;
//	role based sign in and sign up example: admin or user
	private String role;
	
	public User() {}

	
	public User(String email, String username,String password ,String role) {
		this.email = email;
		this.username = username;
		this.password = password;
		this.role = role;
	}
	
	public Long getId() {
		return id;
	}
	
	public String getPassword() {
		return password;
	}
	
	public String getEmail() {
		return email;
	}
	public String getRole() {
		return role;
	}
	
	public void setId(Long id) {
		this.id = id;
	}
	
	public void setPassword(String password) {
		this.password = password;
	}
	
	public void setEmail(String email) {
		this.email = email;
	}
	
	public void setRole(String role) {
		this.role = role;
	}
	public String getUsername() {
		return username;
	}


	public void setUsername(String username) {
		this.username = username;
	}
}