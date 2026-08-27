package fr.ada.java_blog.repository;

import fr.ada.java_blog.model.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbcTemplate;

    private static final RowMapper<User> USER_ROW_MAPPER = (rs, rowNum) -> new User(
            rs.getInt("id"),
            rs.getString("pseudo"),
            rs.getString("mail"),
            rs.getString("mdp"));

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Trouve un user par mail (login).
     * 
     * @return Optional vide si aucun compte avec ce mail
     */
    public Optional<User> findByMail(String mail) {
        String sql = """
                SELECT id, pseudo, mail, mdp
                FROM "users"
                WHERE mail = ?
                """;

        return jdbcTemplate.query(sql, USER_ROW_MAPPER, mail).stream().findFirst();
    }
}