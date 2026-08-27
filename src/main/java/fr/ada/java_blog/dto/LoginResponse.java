package fr.ada.java_blog.dto;

public record LoginResponse(
        String token,
        String pseudo,
        Integer userId) {
}