# Partie 07 — Étape 03 *(bonus DevOps)*
# Tests JUnit — commentaires (repository + MockMvc)

> 📘 **Support optionnel** — à faire **après** avoir codé les commentaires (TP [partie-07-01](partie-07-01-enonce-tp-routes.md)).  
> 🗣️ **On vulgarise :** tu **réutilises** la pyramide des tests (partie 06) sur une **nouvelle ressource** que tu as toi-même écrite.  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** commentaires implémentés ; `./mvnw test` vert avec le socle partie 06 ; branche **`partie-07`**.

## Ce que tu auras à la fin de cette étape

- **`schema-test.sql`** / **`data-test.sql`** — table `commentaires` en base de test.
- **`CommentaireMapperTest`** — test unitaire pur.
- **`CommentaireRepositoryTest`** — `@JdbcTest` PostgreSQL.
- **`CommentaireControllerMockMvcTest`** — GET / POST publics.
- **`AdminCommentaireMockMvcTest`** — DELETE admin avec JWT.

> ⏱️ **Durée estimée :** 60 à 90 minutes.

---

## Todo

- [ ] Étendre `schema-test.sql` et `data-test.sql`
- [ ] Créer `CommentaireMapperTest`
- [ ] Créer `CommentaireRepositoryTest`
- [ ] Créer `CommentaireControllerMockMvcTest`
- [ ] Créer `AdminCommentaireMockMvcTest`
- [ ] `./mvnw test` → BUILD SUCCESS
- [ ] Committer `07 — tests commentaires`

---

## Branche Git

Branche active : **`partie-07`**.

```bash
git branch   # * partie-07
```

---

## 0. Pourquoi tester le TP ?

| Niveau | Test | Ce qu'il prouve |
|---|---|---|
| **Unitaire** | `CommentaireMapperTest` | Le DTO ne fuit pas `articleId` si tu ne le veux pas en JSON |
| **Intégration JDBC** | `CommentaireRepositoryTest` | Le SQL `INSERT … RETURNING` marche sur PostgreSQL |
| **Intégration HTTP** | MockMvc | GET/POST/DELETE + **401** sans token admin |

> 💡 Même recette que [partie-06-02](partie-06-02-tests-backend.md) + [partie-06-03](partie-06-03-tests-api-mockmvc.md) — appliquée à **ta** feature.

---

## 1. Étendre le seed de test

Les fichiers existent depuis la partie 06 — tu **ajoutes** la table `commentaires`.

### `schema-test.sql` — ajouter avant ou après `articles`

```sql
DROP TABLE IF EXISTS commentaires CASCADE;

CREATE TABLE commentaires (
    id SERIAL PRIMARY KEY,
    contenu TEXT,
    user_id INT,
    article_id INT,
    date TIMESTAMP
);
```

> ⚠️ Garde les `DROP … CASCADE` existants (`articles`, `users`) — l'ordre compte : `commentaires` **avant** `articles` si FK, ou sans FK en test (plus simple).

**Version simple (sans FK en test) :** la table ci-dessus suffit.

### `data-test.sql` — après les inserts articles

```sql
INSERT INTO commentaires (id, contenu, user_id, article_id, date) VALUES
(1, 'Commentaire seed CI', 1, 1, CURRENT_TIMESTAMP);

SELECT setval(pg_get_serial_sequence('commentaires', 'id'), (SELECT MAX(id) FROM commentaires));
```

> ✅ **Vérifie :** `./mvnw test` — les anciens tests (articles, auth) passent encore.

---

## 2. `CommentaireMapperTest.java`

**Chemin :** `src/test/java/fr/ada/java_blog/mapper/CommentaireMapperTest.java`

```java
package fr.ada.java_blog.mapper;

import fr.ada.java_blog.dto.CommentaireResponse;
import fr.ada.java_blog.model.Commentaire;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CommentaireMapperTest {

    @Test
    void toResponse_copieIdContenuUserIdEtDate() {
        LocalDateTime date = LocalDateTime.of(2026, 4, 1, 14, 30);

        Commentaire commentaire = new Commentaire(
                10,
                "Bravo !",
                2,
                1,
                date
        );

        CommentaireResponse response = CommentaireMapper.toResponse(commentaire);

        assertEquals(10, response.id());
        assertEquals("Bravo !", response.contenu());
        assertEquals(2, response.userId());
        assertEquals(date, response.date());
    }
}
```

> 💡 Si ton `CommentaireResponse` inclut `articleId`, adapte les assertions.

---

## 3. `CommentaireRepositoryTest.java`

**Chemin :** `src/test/java/fr/ada/java_blog/repository/CommentaireRepositoryTest.java`

```java
package fr.ada.java_blog.repository;

import fr.ada.java_blog.model.Commentaire;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.JdbcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@JdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@Import(CommentaireRepository.class)
@Transactional
class CommentaireRepositoryTest {

    @Autowired
    private CommentaireRepository commentaireRepository;

    @Test
    void findByArticleId_retourneLeSeed() {
        List<Commentaire> liste = commentaireRepository.findByArticleId(1);

        assertTrue(liste.size() >= 1);
        assertEquals("Commentaire seed CI", liste.get(0).getContenu());
    }

    @Test
    void save_assigneUnId() {
        Commentaire saved = commentaireRepository.save(1, "Nouveau commentaire", 1);

        assertTrue(saved.getId() != null && saved.getId() > 0);
        assertEquals("Nouveau commentaire", saved.getContenu());
    }

    @Test
    void deleteById_supprimeLaLigne() {
        Commentaire saved = commentaireRepository.save(1, "À supprimer", 1);

        boolean ok = commentaireRepository.deleteById(saved.getId());

        assertTrue(ok);
        assertTrue(commentaireRepository.findById(saved.getId()).isEmpty());
    }

    @Test
    void findById_inexistant_retourneVide() {
        Optional<Commentaire> opt = commentaireRepository.findById(99999);

        assertTrue(opt.isEmpty());
    }
}
```

**Explication :**

| Annotation | Rôle |
|---|---|
| `@JdbcTest` | Charge JDBC + `JdbcTemplate` — pas tout Spring Web |
| `@AutoConfigureTestDatabase(replace = NONE)` | Utilise PostgreSQL `java_blog_test` — pas de base embarquée |
| `@Import(CommentaireRepository.class)` | Enregistre **ton** repository dans le contexte test |
| `@Transactional` | Rollback après chaque test (`save`, `deleteById`) |

---

## 4. `CommentaireControllerMockMvcTest.java`

**Chemin :** `src/test/java/fr/ada/java_blog/controller/CommentaireControllerMockMvcTest.java`

```java
package fr.ada.java_blog.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CommentaireControllerMockMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getCommentaires_articleExistant_retourne200() throws Exception {
        mockMvc.perform(get("/articles/1/commentaires"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(org.hamcrest.Matchers.greaterThanOrEqualTo(1))));
    }

    @Test
    void getCommentaires_articleInexistant_retourne404() throws Exception {
        mockMvc.perform(get("/articles/99999/commentaires"))
                .andExpect(status().isNotFound());
    }

    @Test
    void postCommentaire_articleExistant_retourne201() throws Exception {
        String body = """
                {"contenu":"Via MockMvc","userId":1}
                """;

        mockMvc.perform(post("/articles/1/commentaires")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.contenu").value("Via MockMvc"))
                .andExpect(jsonPath("$.id").exists());
    }

    @Test
    void postCommentaire_articleInexistant_retourne404() throws Exception {
        String body = """
                {"contenu":"Orphelin","userId":1}
                """;

        mockMvc.perform(post("/articles/99999/commentaires")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound());
    }
}
```

---

## 5. `AdminCommentaireMockMvcTest.java`

**Chemin :** `src/test/java/fr/ada/java_blog/controller/AdminCommentaireMockMvcTest.java`

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
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminCommentaireMockMvcTest {

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
    void deleteCommentaire_sansToken_retourne401() throws Exception {
        mockMvc.perform(delete("/admin/commentaires/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteCommentaire_avecToken_retourne204() throws Exception {
        // Créer un commentaire à supprimer
        String createBody = """
                {"contenu":"Temporaire","userId":1}
                """;
        MvcResult created = mockMvc.perform(post("/articles/1/commentaires")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode json = objectMapper.readTree(created.getResponse().getContentAsString());
        int id = json.get("id").asInt();

        mockMvc.perform(delete("/admin/commentaires/" + id)
                        .header("Authorization", "Bearer " + bearerToken))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteCommentaire_inexistant_retourne404() throws Exception {
        mockMvc.perform(delete("/admin/commentaires/99999")
                        .header("Authorization", "Bearer " + bearerToken))
                .andExpect(status().isNotFound());
    }
}
```

> 💡 Même pattern `@BeforeEach` + login que [partie-06-03](partie-06-03-tests-api-mockmvc.md) (`AdminArticleSecurityMockMvcTest`).

---

## 6. Lancer les tests

**Prérequis :** PostgreSQL allumé, base **`java_blog_test`** (partie 06).

```bash
./mvnw test
```

| Résultat attendu | |
|---|---|
| Tests partie 06 | Toujours verts |
| + 4 classes commentaires | ~10–12 tests en plus |
| CI GitHub | Verte (service PostgreSQL 06-04) |

---

## 7. Commit

```bash
git add src/test/ src/test/resources/schema-test.sql src/test/resources/data-test.sql
git commit -m "07 — tests commentaires (mapper, repository, MockMvc)"
git log --oneline
```

---

## 8. Aller plus loin *(facultatif)*

| Idée | Comment |
|---|---|
| Test `@JdbcTest` sur `CategorieRepository` | SQL avec `"catégories"` |
| Test MockMvc `GET /categories` | Public, pas de JWT |
| Test `UserController` | Vérifier qu'aucun champ `mdp` dans le JSON (`jsonPath("$.mdp").doesNotExist()`) |
| Vitest sur `site/` | Composant `CommentForm` — hors scope Java |

---

## Dépannage

| Erreur | Cause | Fix |
|---|---|---|
| `relation "commentaires" does not exist` | Seed non à jour | `schema-test.sql` + `spring.sql.init.mode: always` |
| 401 sur DELETE avec token | Header mal formé | `"Authorization", "Bearer " + token` |
| Tests articles cassés | DROP CASCADE trop agressif | Ordre DROP : commentaires → articles → users |
| Login test échoue | Hash BCrypt seed | Même hash que partie 05-02 dans `data-test.sql` |

---

## Suite

👉 Retour à [partie-07-01-enonce-tp-routes.md](partie-07-01-enonce-tp-routes.md) — checklist finale TP.  
👉 Corrigé implémentation : [partie-07-02-corrige-formateur.md](partie-07-02-corrige-formateur.md).
