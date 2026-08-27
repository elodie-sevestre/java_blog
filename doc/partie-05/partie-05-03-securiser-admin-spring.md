# Partie 05 — Étape 03
# Sécuriser `/admin/**` — filtre JWT et Spring Security

> 📘 **Tu crées 1 fichier Java** et tu **modifies** `SecurityConfig.java`.  
> Objectif : sans token valide, **`/admin/**` renvoie 401** ; les routes publiques restent accessibles.  
> 🗣️ **On vulgarise :** le **filtre** = le videur qui lit le badge (`Authorization: Bearer …`) **avant** d'atteindre le controller admin.  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** [partie-05-02-login-api-jwt.md](partie-05-02-login-api-jwt.md) (commit `05-02` OK, login curl OK).

## Ce que tu auras à la fin de cette étape

- **`JwtAuthFilter.java`** — lit le header `Authorization`, valide le JWT, enregistre l'utilisateur dans le contexte Spring Security.
- **`SecurityConfig.java`** mis à jour — `/admin/**` exige une authentification.
- Tests curl : admin **sans** token → **401** ; admin **avec** token → CRUD OK.
- Le back-office React **ne marchera plus** sur `/admin` tant qu'il n'envoie pas le token → normal ; correction en **05-04**.

> ⏱️ **Durée estimée :** 45 à 60 minutes.

---

## Todo

- [ ] Créer `JwtAuthFilter.java`
- [ ] Mettre à jour `SecurityConfig.java` (règles + filtre)
- [ ] Tester curl : DELETE `/admin/articles/…` sans token → 401
- [ ] Tester curl : même requête avec `Authorization: Bearer …` → OK ou 404 métier
- [ ] Committer sur `partie-05`

---

## Branche Git

Branche active : **`partie-05`** (créée en [partie-05-01-cadrage-auth.md](partie-05-01-cadrage-auth.md)).

```bash
git branch   # * partie-05
```

Si besoin : `git checkout partie-05`

---

## 0. Rappel — où on en est

```
Requête HTTP
     │
     ▼
┌─────────────────┐
│ JwtAuthFilter   │  ← NOUVEAU : lit le header Bearer
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Spring Security │  ← règles : /admin/** = authentifié ?
└────────┬────────┘
         │
         ▼
   Controller admin
```

| Route | Avant 05-03 | Après 05-03 |
|---|---|---|
| `GET /articles/**` | Public | Public ✅ |
| `POST /auth/login` | Public | Public ✅ |
| `POST/PUT/DELETE /admin/**` | Public ❌ | **Token obligatoire** ✅ |

---

## 1. Le header `Authorization`

Convention **Bearer token** :

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIi…
```

| Partie | Signification |
|---|---|
| `Bearer` | Type d'authentification (= « voici mon badge ») |
| Le reste | Le JWT lui-même |

> 💡 **curl** : `-H "Authorization: Bearer VOTRE_TOKEN_ICI"`.

---

# Fichier — `JwtAuthFilter.java`

## Objectif

Intercepter **chaque requête** entrante, extraire le JWT du header, le valider via `JwtService`, et dire à Spring **qui** est connecté.

**Chemin :** `src/main/java/fr/ada/java_blog/config/JwtAuthFilter.java`

```java
package fr.ada.java_blog.config;

import fr.ada.java_blog.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Filtre JWT — s'exécute avant les controllers.
 * Lit Authorization: Bearer … et remplit le contexte Spring Security.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // Pas de header ou mauvais format → on laisse passer ; Security décidera si 401 sur /admin
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Enlève le préfixe "Bearer " (7 caractères)
        String token = authHeader.substring(7);

        try {
            Claims claims = jwtService.parseToken(token);
            String userId = claims.getSubject();

            // Objet « utilisateur connecté » pour Spring Security
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userId,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_USER"))
                    );

            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (Exception ex) {
            // Token invalide ou expiré → on ne met PAS d'authentification
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
```

**Explication ligne par ligne :**

| Ligne | En clair |
|---|---|
| `extends OncePerRequestFilter` | Spring n'exécute le filtre **qu'une fois** par requête HTTP |
| `@Component` | Spring **instancie** le filtre automatiquement |
| `authHeader.startsWith("Bearer ")` | Format standard du header |
| `jwtService.parseToken(token)` | Vérifie signature + expiration (étape 05-02) |
| `UsernamePasswordAuthenticationToken` | Objet Spring « quelqu'un est connecté » |
| `SecurityContextHolder.getContext().setAuthentication(...)` | Enregistre l'identité pour la suite de la requête |
| `catch` + `clearContext()` | Token pourri → comme si personne n'était connecté |
| `filterChain.doFilter(...)` | **Toujours** appeler à la fin — sinon la requête s'arrête |

> ❓ **Pourquoi ne pas renvoyer 401 dans le filtre ?** Spring Security le fait **uniformément** via les règles `authenticated()` — une seule logique de refus.

> ✅ **Todo :** compile.

---

## 3. Mettre à jour `SecurityConfig.java`

**Remplace** le contenu de **`src/main/java/fr/ada/java_blog/config/SecurityConfig.java`** par :

```java
package fr.ada.java_blog.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Preflight CORS (navigateur) — doit rester public
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Login
                        .requestMatchers("/auth/login").permitAll()
                        // API publique (lecture articles, santé)
                        .requestMatchers(
                                "/articles/**",
                                "/ping",
                                "/db/**"
                        ).permitAll()
                        // Back-office — token obligatoire
                        .requestMatchers("/admin/**").authenticated()
                        .anyRequest().permitAll()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) ->
                                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Non authentifié")
                        )
                )
                .addFilterBefore(
                        jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

**Explication — changements par rapport à 05-02 :**

| Changement | En clair |
|---|---|
| `OPTIONS /**` permitAll | Le navigateur envoie un **preflight** avant POST/DELETE — ne pas le bloquer |
| `/admin/**` authenticated | Sans JWT valide → **401** |
| `authenticationEntryPoint` | Réponse claire **401** (pas une page HTML login Spring) |
| `addFilterBefore(jwtAuthFilter, …)` | Notre filtre s'exécute **avant** l'authentification classique Spring |

> 💡 **`WebConfig.java` (CORS, partie 04)** : pas de changement — `allowedHeaders("*")` accepte déjà `Authorization`.

---

## 4. Schéma — requête admin avec token

```
curl DELETE /admin/articles/5
Header: Authorization: Bearer eyJ…
        │
        ▼
JwtAuthFilter
  → parseToken OK
  → SecurityContext = userId "1"
        │
        ▼
Security : /admin/** authenticated ?  OUI
        │
        ▼
AdminArticleController.supprimer(5)
        │
        ▼
204 No Content  (ou 404 si id absent)
```

Sans header :

```
curl DELETE /admin/articles/5
(sans Authorization)
        │
        ▼
JwtAuthFilter → pas de token → contexte vide
        │
        ▼
Security : authenticated ?  NON
        │
        ▼
401 Non authentifié
```

---

## 5. Tester avec curl

**Prérequis :** Spring Boot lancé, hash Alice OK.

### Étape A — obtenir un token

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mail":"alice@example.com","mdp":"demo1234"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "$TOKEN"
```

> 💡 Sous Windows PowerShell, copie le token manuellement depuis la réponse JSON.

### Étape B — admin SANS token → 401

```bash
curl -s -w "\nHTTP %{http_code}\n" -X DELETE http://localhost:8080/admin/articles/999
```

→ **401** (article absent ou pas — peu importe, **refusé avant** le controller).

### Étape C — admin AVEC token → passe le videur

```bash
curl -s -w "\nHTTP %{http_code}\n" -X DELETE http://localhost:8080/admin/articles/999 \
  -H "Authorization: Bearer $TOKEN"
```

→ **404** (article 999 n'existe pas) — preuve que le controller a été atteint.

### Étape D — routes publiques toujours OK

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/articles/recents
```

→ **200** sans token.

### Étape E — token expiré / bidon

```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:8080/admin/articles \
  -H "Authorization: Bearer token.invalide" \
  -H "Content-Type: application/json" \
  -d '{"titre":"x","contenu":"y","userId":1}'
```

→ **401**.

> ✅ **Todo :** sans token = 401 sur `/admin` ; avec token valide = controller atteint.

---

## 6. Impact sur le React admin (normal)

Si tu lances **`admin/`** (partie 04) :

- Les `fetch` vers `/admin/articles` échouent (**401**).
- La liste peut encore charger via **`GET /articles/recents`** (public).

> 💡 **C'est voulu.** L'étape **05-04** ajoutera le login React et le header `Authorization` dans `api/articles.js`.

---

## 7. Enregistrer l'étape dans Git

```bash
git add src/main/java/fr/ada/java_blog/config/
git commit -m "05-03 — filtre JWT + protection /admin/**"
git log --oneline
```

---

## 🆘 En cas de problème

| Symptôme | Cause | Solution |
|---|---|---|
| 403 au lieu de 401 | Ancienne config Security | Vérifier `authenticationEntryPoint` |
| 401 même avec token | Header mal formé | `Bearer ` + espace + token |
| CORS OK mais 401 en React | Normal en 05-03 | Attendre 05-04 ou tester avec curl |
| OPTIONS bloqué | Preflight non autorisé | `requestMatchers(OPTIONS, "/**").permitAll()` |
| 401 sur `/auth/login` | Route pas en `permitAll` | Vérifier la règle `/auth/login` |
| Token OK en curl, KO en React | Header absent côté front | Étape 05-04 |

---

## ✅ Récapitulatif

- [ ] **`JwtAuthFilter`** lit `Authorization: Bearer …`
- [ ] Token valide → `SecurityContext` rempli
- [ ] **`/admin/**`** exige authentification
- [ ] Routes publiques (`/articles`, `/auth/login`, `/ping`) inchangées
- [ ] Commit `05-03`

---

## Suite

👉 **[partie-05-04-login-react.md](partie-05-04-login-react.md)** — **`LoginForm`**, stockage du token, header sur tous les appels admin.
