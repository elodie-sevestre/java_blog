# Partie 06 — Étape 03
# Tests API — MockMvc, routes publiques et admin sécurisé

> 📘 **Tu crées des tests d'intégration HTTP** avec **MockMvc** — Spring simule le serveur **sans** ouvrir le port 8080.  
> 🗣️ **On vulgarise :** MockMvc = un **client HTTP fictif** qui tape sur tes controllers pour vérifier status + JSON.  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** [partie-06-02-tests-backend.md](partie-06-02-tests-backend.md) (commit `06-02` OK).

## Ce que tu auras à la fin de cette étape

- **`ArticleControllerMockMvcTest`** — GET `/articles/recents`, GET `/articles/{id}`, 404.
- **`AuthControllerMockMvcTest`** — POST `/auth/login` OK / KO.
- **`AdminArticleSecurityMockMvcTest`** — `/admin/**` sans token → **401** ; avec JWT → **201** / **204**.
- Suite de tests **complète** pour la CI.

> ⏱️ **Durée estimée :** 60 à 75 minutes.

---

## Todo

- [ ] Créer `ArticleControllerMockMvcTest.java`
- [ ] Créer `AuthControllerMockMvcTest.java`
- [ ] Créer `AdminArticleSecurityMockMvcTest.java`
- [ ] `./mvnw test` → BUILD SUCCESS
- [ ] Committer `06-03`

---

## Branche Git

Branche active : **`partie-06`** (créée en [partie-06-01-cadrage-devops.md](partie-06-01-cadrage-devops.md)).

```bash
git branch   # * partie-06
```

Si besoin : `git checkout partie-06`

---

## 0. MockMvc — c'est quoi ?

```
Test JUnit
    │
    ▼
MockMvc.perform(get("/articles/recents"))
    │
    ▼
DispatcherServlet → Controller → JSON
    │
    ▼
.andExpect(status().isOk())
.andExpect(jsonPath("$[0].titre").exists())
```

| Avantage | Détail |
|---|---|
| Pas de port réseau | Plus rapide, pas de conflit 8080 |
| Rejouable | Idéal en CI |
| Vérifie la **vraie** stack Spring | Security + filtres JWT inclus |

---

## 1. Annotations communes

```java
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MonTest {
    @Autowired
    private MockMvc mockMvc;
}
```

| Annotation | Rôle |
|---|---|
| `@SpringBootTest` | Charge l'application complète |
| `@AutoConfigureMockMvc` | Injecte `MockMvc` |
| `@ActiveProfiles("test")` | PostgreSQL `java_blog_test` + seed (06-02) |

---

# Test 1 — `ArticleControllerMockMvcTest.java`

**Chemin :** `src/test/java/fr/ada/java_blog/controller/ArticleControllerMockMvcTest.java`

```java
package fr.ada.java_blog.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ArticleControllerMockMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getRecents_retourne200EtUnTableau() throws Exception {
        mockMvc.perform(get("/articles/recents"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(org.hamcrest.Matchers.greaterThanOrEqualTo(1))));
    }

    @Test
    void getById_existant_retourne200() throws Exception {
        mockMvc.perform(get("/articles/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.titre").value("Article test CI"));
    }

    @Test
    void getById_inexistant_retourne404() throws Exception {
        mockMvc.perform(get("/articles/99999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void ping_retourne200() throws Exception {
        mockMvc.perform(get("/ping"))
                .andExpect(status().isOk());
    }
}
```

**Explication :**

- `jsonPath("$.titre")` → JSONPath sur la réponse (comme jq).
- `status().isNotFound()` → vérifie le **404** du controller.

---

# Test 2 — `AuthControllerMockMvcTest.java`

**Chemin :** `src/test/java/fr/ada/java_blog/controller/AuthControllerMockMvcTest.java`

```java
package fr.ada.java_blog.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerMockMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void login_identifiantsValides_retourneToken() throws Exception {
        String body = """
                {"mail":"alice@example.com","mdp":"demo1234"}
                """;

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.pseudo").value("alice_dev"))
                .andExpect(jsonPath("$.userId").value(1));
    }

    @Test
    void login_motDePasseIncorrect_retourne401() throws Exception {
        String body = """
                {"mail":"alice@example.com","mdp":"wrong"}
                """;

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }
}
```

> 💡 Le hash BCrypt dans `data-test.sql` **doit** correspondre à `demo1234` (partie 05-02).

---

# Test 3 — `AdminArticleSecurityMockMvcTest.java`

## Objectif

Prouver que la **partie 05-03** tient : admin protégé, public ouvert.

**Chemin :** `src/test/java/fr/ada/java_blog/controller/AdminArticleSecurityMockMvcTest.java`

```java
package fr.ada.java_blog.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminArticleSecurityMockMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String bearerToken;

    @BeforeEach
    void loginAndGetToken() throws Exception {
        String body = """
                {"mail":"alice@example.com","mdp":"demo1234"}
                """;

        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        bearerToken = json.get("token").asText();
    }

    @Test
    void postAdmin_sansToken_retourne401() throws Exception {
        String body = """
                {"titre":"Hack","contenu":"Sans auth","userId":1}
                """;

        mockMvc.perform(post("/admin/articles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void postAdmin_avecToken_retourne201() throws Exception {
        String body = """
                {"titre":"Via test","contenu":"Créé en CI","userId":1}
                """;

        mockMvc.perform(post("/admin/articles")
                        .header("Authorization", "Bearer " + bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());
    }

    @Test
    void deleteAdmin_avecToken_retourne204() throws Exception {
        mockMvc.perform(delete("/admin/articles/1")
                        .header("Authorization", "Bearer " + bearerToken))
                .andExpect(status().isNoContent());
    }
}
```

**Explication — flux :**

1. `@BeforeEach` → login → récupère le **vrai** JWT (comme React).
2. Test sans header → **401**.
3. Test avec `Authorization: Bearer …` → controller atteint.

> 💡 `ObjectMapper` est fourni par Spring Boot — parse le JSON de réponse login.

---

## 4. Nettoyer l'ancien test Initializr (optionnel)

Le fichier **`JavaBlogApplicationTests.java`** (test `contextLoads` vide) peut **rester** — il vérifie que le contexte démarre.

Si tu préfères un seul endroit documenté :

```java
@SpringBootTest
@ActiveProfiles("test")
class JavaBlogApplicationTests {

    @Test
    void contextLoads() {
    }
}
```

Ajoute `@ActiveProfiles("test")` pour utiliser **`java_blog_test`** PostgreSQL aussi sur ce test.

---

## 5. Lancer toute la suite

```bash
./mvnw test
```

Compte attendu : **~15 tests** (mapper + jwt + repo + mockmvc).

---

## 6. Commit

```bash
git add src/test/
git commit -m "06-03 — tests MockMvc API publique + admin JWT"
```

---

## 🆘 En cas de problème

| Symptème | Cause | Solution |
|---|---|---|
| 401 sur login test | Hash BDD test | `data-test.sql` hash Alice |
| 403 au lieu de 401 | Config Security | `authenticationEntryPoint` (05-03) |
| 201 attendu, 400 reçu | JSON invalide | Vérifier `userId` dans body POST |
| `@SpringBootTest` lent | Normal | Acceptable en CI ; unitaires restent rapides |
| Security bloque `/auth/login` | Règle manquante | `permitAll` sur `/auth/login` |

---

## Suite

👉 **[partie-06-04-pipeline-github-actions.md](partie-06-04-pipeline-github-actions.md)** — automatiser `./mvnw test` sur **GitHub Actions**.
