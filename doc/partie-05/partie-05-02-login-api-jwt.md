# Partie 05 — Étape 02
# Login API — `User`, BCrypt et JWT

> 📘 **Tu crées 7 fichiers Java** et tu **modifies** `pom.xml` + `application.yaml`.  
> Objectif : **`POST /auth/login`** renvoie un **token JWT** si mail + mot de passe sont corrects.  
> 🗣️ **On vulgarise :** le login = vérifier la **carte d'identité** (mail/mdp) ; le JWT = le **badge** signé que tu montreras aux routes `/admin` à l'étape suivante.  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** [partie-05-01-cadrage-auth.md](partie-05-01-cadrage-auth.md) (branche `partie-05` active).

## Ce que tu auras à la fin de cette étape

- **`User`** + **`UserRepository`** — lire un utilisateur par mail en JDBC.
- **`LoginRequest`** / **`LoginResponse`** — contrat JSON du login.
- **`JwtService`** — créer (et préparer la validation) d'un JWT.
- **`AuthController`** — `POST /auth/login`.
- **`SecurityConfig`** — config **temporaire** : tout reste ouvert (le verrou `/admin` = étape 05-03).
- Mot de passe démo **`demo1234`** pour `alice@example.com` (hash BCrypt en base).

> ⏱️ **Durée estimée :** 75 à 90 minutes.

---

## Todo

- [ ] Mettre à jour `pom.xml` (Security + JJWT) — **avec confirmation formateur**
- [ ] Ajouter `jwt.secret` et `jwt.expiration-ms` dans `application.yaml`
- [ ] Mettre à jour le hash BCrypt d'Alice en base (pgAdmin)
- [ ] Créer `User.java`, `LoginRequest.java`, `LoginResponse.java`
- [ ] Créer `UserRepository.java`, `JwtService.java`, `AuthController.java`
- [ ] Créer `SecurityConfig.java` (tout public pour l'instant)
- [ ] Tester avec curl (login OK + login KO)
- [ ] Committer sur `partie-05`

---

## Branche Git

Branche active : **`partie-05`** (créée en [partie-05-01-cadrage-auth.md](partie-05-01-cadrage-auth.md)).

```bash
git branch   # * partie-05
```

Si besoin : `git checkout partie-05`

---

## 0. État intermédiaire — normal

| Route | Après cette étape |
|---|---|
| `GET /articles/**`, `/ping`, `/db/ping` | ✅ Toujours public |
| `POST /auth/login` | ✅ **Nouveau** — renvoie un token |
| `POST/PUT/DELETE /admin/**` | ⚠️ **Encore ouvert** — verrou en 05-03 |

> 💡 On code le **badge** (JWT) avant de mettre le **videur** (filtre Spring Security).

---

## 1. Dépendances Maven

> ⚠️ **Confirmation requise** avant de modifier `pom.xml` (règle du projet).

Dans **`pom.xml`**, ajoute dans `<dependencies>` :

```xml
<!-- Spring Security — BCrypt + filtres (filtre JWT en 05-03) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- JJWT — créer et lire des tokens -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.6</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
```

**Explication vulgarisée :**

| Dépendance | Rôle |
|---|---|
| `spring-boot-starter-security` | Bibliothèque « sécurité » Spring + **BCrypt** pour comparer les mots de passe |
| `jjwt-*` | Créer / lire des **JWT** signés |

Puis :

```bash
./mvnw compile
```

> ❓ **Pourquoi Security dès maintenant ?** On utilise `BCryptPasswordEncoder` ; le starter sera **configuré** pour ne **pas** bloquer les routes tant que `/admin` n'est pas protégé (voir `SecurityConfig` plus bas).

---

## 2. Configuration JWT — `application.yaml`

Ajoute **à la fin** de **`src/main/resources/application.yaml`** :

```yaml
jwt:
  # Secret de signature — MINIMUM ~32 caractères pour HS256. En prod : variable d'environnement !
  secret: "dev-secret-java-blog-changez-moi-32chars"
  expiration-ms: 86400000   # 24 h en millisecondes
```

**Explication :**

- `secret` → clé pour **signer** le JWT (comme le tampon inviolable du badge).
- `expiration-ms` → durée de vie du token ; après, il faudra se reconnecter.

> 🔐 **Ne commite jamais** un secret de production. Ici c'est un secret **de dev** explicite.

---

## 3. Mot de passe démo en base — BCrypt

Les placeholders `hash_placeholder_1` de [blog.sql](blog.sql) ne permettent **pas** un vrai login.

Exécute le script d'upgrade (pgAdmin ou `psql`) :

**Fichier :** [doc/sql/upgrade-05-01-bcrypt-alice.sql](sql/upgrade-05-01-bcrypt-alice.sql)

```bash
psql -U postgres -d java_blog -f doc/sql/upgrade-05-01-bcrypt-alice.sql
```

Ou copie le SQL depuis ce fichier dans le Query Tool pgAdmin (base **`java_blog`**).

| Compte | Mail | Mot de passe **en clair** (démo) |
|---|---|---|
| Alice | `alice@example.com` | `demo1234` |

> 💡 Le hash = BCrypt (cost 10) de **`demo1234`**. Voir aussi [doc/sql/README.md](sql/README.md).

> ✅ **Vérifie :** `SELECT mail, mdp FROM "users" WHERE mail = 'alice@example.com';` — le `mdp` commence par `$2y$10$…`.

---

# Fichier 1 — `User.java`

## Objectif

Représenter une ligne de la table **`users`**.

**Chemin :** `src/main/java/fr/ada/java_blog/model/User.java`

```java
package fr.ada.java_blog.model;

public class User {

    private Integer id;
    private String pseudo;
    private String mail;
    private String mdp;

    public User(Integer id, String pseudo, String mail, String mdp) {
        this.id = id;
        this.pseudo = pseudo;
        this.mail = mail;
        this.mdp = mdp;
    }

    public Integer getId() {
        return id;
    }

    public String getPseudo() {
        return pseudo;
    }

    public String getMail() {
        return mail;
    }

    public String getMdp() {
        return mdp;
    }
}
```

**Explication :**

- Quatre champs = quatre colonnes SQL (`id`, `pseudo`, `mail`, `mdp`).
- **Getters seulement** — on ne modifie pas un user dans cette étape.
- `getMdp()` sert **uniquement** en interne pour `passwordEncoder.matches()` — **jamais** dans un DTO de réponse.

> ✅ **Todo :** fichier créé, compile.

---

# Fichier 2 — `LoginRequest.java`

## Objectif

Décrire le JSON **entrant** du login.

**Chemin :** `src/main/java/fr/ada/java_blog/dto/LoginRequest.java`

```java
package fr.ada.java_blog.dto;

public record LoginRequest(
        String mail,
        String mdp
) {
}
```

**Explication :**

- **Record** = DTO compact (comme `ArticleCreateRequest` en partie 03).
- `body.mail()` et `body.mdp()` pour lire le JSON POST.

JSON attendu :

```json
{ "mail": "alice@example.com", "mdp": "demo1234" }
```

---

# Fichier 3 — `LoginResponse.java`

## Objectif

Décrire le JSON **sortant** après login réussi.

**Chemin :** `src/main/java/fr/ada/java_blog/dto/LoginResponse.java`

```java
package fr.ada.java_blog.dto;

public record LoginResponse(
        String token,
        String pseudo,
        Integer userId
) {
}
```

**Explication :**

- `token` → le JWT à stocker côté React (étape 05-04).
- `pseudo` → affichage « Connecté en tant que … ».
- `userId` → utile plus tard (articles, profil).
- **Pas de `mdp`** — jamais.

---

# Fichier 4 — `UserRepository.java`

## Objectif

Chercher un utilisateur par **mail** — seule requête SQL de cette étape.

**Chemin :** `src/main/java/fr/ada/java_blog/repository/UserRepository.java`

```java
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
            rs.getString("mdp")
    );

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Trouve un user par mail (login).
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
```

**Explication ligne par ligne :**

| Ligne | En clair |
|---|---|
| `@Repository` | Spring instancie la classe et injecte `JdbcTemplate` |
| `RowMapper<User>` | Traduit une **ligne SQL** → objet `User` (mapping ①, comme `ArticleRepository`) |
| `WHERE mail = ?` | Requête **paramétrée** — pas de concaténation (injection SQL évitée) |
| `.stream().findFirst()` | 0 ou 1 ligne → `Optional<User>` |

> ✅ **Todo :** compile ; **aucun** SQL dans le controller.

---

# Fichier 5 — `JwtService.java`

## Objectif

**Créer** un JWT signé à partir d'un `User`, et **valider** un token (validation utilisée en 05-03).

**Chemin :** `src/main/java/fr/ada/java_blog/service/JwtService.java`

```java
package fr.ada.java_blog.service;

import fr.ada.java_blog.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long expirationMs;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-ms}") long expirationMs
    ) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    /**
     * Crée un JWT pour l'utilisateur connecté.
     */
    public String generateToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("pseudo", user.getPseudo())
                .claim("mail", user.getMail())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    /**
     * Lit et vérifie un JWT. Lance une exception si invalide ou expiré.
     */
    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Integer extractUserId(Claims claims) {
        return Integer.parseInt(claims.getSubject());
    }
}
```

**Explication vulgarisée :**

| Élément | En clair |
|---|---|
| `SecretKey` | Clé dérivée de `jwt.secret` — sert à **signer** et **vérifier** |
| `.subject(userId)` | Identifiant principal du token (= qui est connecté) |
| `.claim("pseudo", …)` | Données **supplémentaires** dans le token (pas besoin de relire la BDD à chaque requête) |
| `.expiration(expiry)` | Date limite — après, `parseToken` échoue |
| `parseToken` | Étape 05-03 : le filtre appellera cette méthode sur chaque requête `/admin` |

> 💡 Le JWT ressemble à `eyJhbGci…` — trois parties séparées par `.` (header.payload.signature).

---

# Fichier 6 — `AuthController.java`

## Objectif

Route **`POST /auth/login`** : mail + mdp → token ou **401**.

**Chemin :** `src/main/java/fr/ada/java_blog/controller/AuthController.java`

```java
package fr.ada.java_blog.controller;

import fr.ada.java_blog.dto.LoginRequest;
import fr.ada.java_blog.dto.LoginResponse;
import fr.ada.java_blog.model.User;
import fr.ada.java_blog.repository.UserRepository;
import fr.ada.java_blog.service.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest body) {
        User user = userRepository.findByMail(body.mail())
                .orElseThrow(() -> unauthorized());

        if (!passwordEncoder.matches(body.mdp(), user.getMdp())) {
            throw unauthorized();
        }

        String token = jwtService.generateToken(user);
        return new LoginResponse(token, user.getPseudo(), user.getId());
    }

    private static ResponseStatusException unauthorized() {
        return new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Identifiants invalides"
        );
    }
}
```

**Explication — points clés :**

| Ligne | En clair |
|---|---|
| `passwordEncoder.matches(clair, hash)` | Compare le mdp saisi au **hash BCrypt** en base |
| Même message si mail inconnu **ou** mdp faux | Ne pas aider un attaquant à deviner **quel** champ est faux |
| `jwtService.generateToken(user)` | Crée le badge signé |
| `new LoginResponse(...)` | Spring sérialise automatiquement en JSON |

> ✅ **Todo :** compile ; lance `./mvnw spring-boot:run`.

---

# Fichier 7 — `SecurityConfig.java`

## Objectif

Configurer Spring Security pour **ne pas bloquer** les routes pendant qu'on développe — **temporaire**.

**Chemin :** `src/main/java/fr/ada/java_blog/config/SecurityConfig.java`

```java
package fr.ada.java_blog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Pas de session HTTP — on utilisera des JWT (stateless)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // CSRF désactivé : API REST consommée par React / curl (pas de formulaire HTML Spring)
                .csrf(csrf -> csrf.disable())
                // TEMPORAIRE étape 05-02 : tout est public. Étape 05-03 : on protège /admin/**
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

**Explication vulgarisée :**

| Réglage | Pourquoi |
|---|---|
| `STATELESS` | Pas de cookie de session serveur — le JWT **remplace** la session |
| `csrf.disable()` | Classique pour une **API JSON** (pas de formulaire Spring MVC) |
| `permitAll()` | **Temporaire** — sans ça, Spring bloquerait `/auth/login` et `/articles` |
| `BCryptPasswordEncoder` bean | Injecté dans `AuthController` |

> ⚠️ **Étape 05-03** : tu **remplaceras** `permitAll()` par des règles `requestMatchers("/admin/**").authenticated()`.

---

## 4. Tester avec curl

**Prérequis :** Spring Boot lancé, hash Alice en base.

### Login OK

```bash
curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mail":"alice@example.com","mdp":"demo1234"}'
```

Réponse attendue (200) :

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9…",
  "pseudo": "alice_dev",
  "userId": 1
}
```

### Login KO — mauvais mot de passe

```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mail":"alice@example.com","mdp":"wrong"}'
```

→ **401** + message `Identifiants invalides`.

### Login KO — mail inconnu

```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mail":"nobody@example.com","mdp":"demo1234"}'
```

→ **401** (même message — normal).

### Vérifier que `/admin` est encore ouvert (temporaire)

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:8080/admin/articles/99
```

→ **404** (article absent) ou **204** — mais **pas 401**. Le verrou arrive en **05-03**.

> ✅ **Todo :** login OK renvoie un token ; mauvais identifiants → 401.

---

## 5. Enregistrer l'étape dans Git

```bash
git add pom.xml src/main/resources/application.yaml src/main/java/
git commit -m "05-02 — login API : User, BCrypt, JWT"
git log --oneline
```

> 💡 Si tu préfères ne pas versionner le secret JWT : utilise une variable d'environnement en prod ; pour le cours, le secret de dev dans `application.yaml` est acceptable.

---

## 🆘 En cas de problème

| Symptôme | Cause | Solution |
|---|---|---|
| 401 alors que mdp correct | Hash pas mis à jour en BDD | Refaire l'`UPDATE` SQL Alice |
| `WeakKeyException` JJWT | Secret trop court | Au moins **32 caractères** dans `jwt.secret` |
| 403 sur `/auth/login` | `SecurityConfig` manquant | Vérifier `permitAll()` |
| Page login HTML Spring | Config Security par défaut | Ajouter `SecurityConfig` avec `permitAll` |
| `matches` toujours false | Hash pas BCrypt | Le `mdp` en base doit commencer par `$2a$` ou `$2y$` |
| Compile : JJWT introuvable | Dépendances Maven | `./mvnw compile` après edit `pom.xml` |

---

## ✅ Récapitulatif

| # | Fichier | Rôle |
|---|---|---|
| 1 | `User.java` | Model table `users` |
| 2 | `LoginRequest.java` | JSON entrant |
| 3 | `LoginResponse.java` | JSON sortant (token, pas de mdp) |
| 4 | `UserRepository.java` | SQL `findByMail` |
| 5 | `JwtService.java` | Générer / parser JWT |
| 6 | `AuthController.java` | `POST /auth/login` |
| 7 | `SecurityConfig.java` | BCrypt + tout public (temporaire) |

- [ ] Login testé avec curl
- [ ] `/admin` encore ouvert (normal)
- [ ] Commit `05-02` sur `partie-05`

---

## Suite

👉 **[partie-05-03-securiser-admin-spring.md](partie-05-03-securiser-admin-spring.md)** — filtre JWT + **`/admin/**` protégé** ; sans token valide → **401**.
