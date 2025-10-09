package com.cursosonline.cursosonlinejs.DTO;

import java.util.List;

public class JwtResponse {
    private String token;
    private String type;
    private String username;
    private String userId;
    private List<String> roles;
    private long expiresIn;

    public JwtResponse() {}

    public JwtResponse(String token, String type, String username, String userId, List<String> roles, long expiresIn) {
        this.token = token;
        this.type = type;
        this.username = username;
        this.userId = userId;
        this.roles = roles;
        this.expiresIn = expiresIn;
    }

    public String getToken() { return token; }
    public String getType() { return type; }
    public String getUsername() { return username; }
    public String getUserId() { return userId; }
    public List<String> getRoles() { return roles; }
    public long getExpiresIn() { return expiresIn; }

    public void setToken(String token) { this.token = token; }
    public void setType(String type) { this.type = type; }
    public void setUsername(String username) { this.username = username; }
    public void setUserId(String userId) { this.userId = userId; }
    public void setRoles(List<String> roles) { this.roles = roles; }
    public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }
}
