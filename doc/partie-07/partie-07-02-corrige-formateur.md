# Partie 07 — Corrigé formateur
# Backend complet + front-office React (`site/`)

> 📘 **Document formateur / correction.** À distribuer **après** le TP ou pour préparer la correction.  
> ⚠️ **Ne pas donner aux élèves** avant la remise — renvoie-les vers [partie-07-01-enonce-tp-routes.md](partie-07-01-enonce-tp-routes.md).

---

## Comment utiliser ce corrigé

| Usage | Action |
|---|---|
| **Correction rapide** | Section 9 — checklist « ont-ils tout couvert ? » |
| **Démo live** | Phase commentaires (section 3) — modèle reproductible |
| **SQL piège** | Section 2 — noms de tables accentués |
| **Front minimal** | Section 8 — arborescence `site/` |

> 💡 Les URL peuvent varier légèrement ; l'important : **même comportement HTTP** et **couches respectées**.

---

## 1. Arborescence Java cible (ajouts)

```
src/main/java/fr/ada/java_blog/
├── controller/
│   ├── AdminArticleController.java      ← compléter GET
│   ├── AdminCategorieController.java    ← nouveau
│   ├── AdminCommentaireController.java  ← nouveau
│   ├── AdminMediaController.java        ← nouveau
│   ├── AdminUserController.java         ← nouveau
│   ├── CategorieController.java         ← nouveau (GET public)
│   ├── CommentaireController.java       ← nouveau (GET + POST public)
│   ├── MediaController.java             ← nouveau (GET public)
│   └── UserController.java              ← nouveau (GET profil public)
├── dto/ …
├── mapper/ …
├── model/
│   ├── Categorie.java
│   ├── Commentaire.java
│   └── Media.java                       ← User.java existe (partie 05)
└── repository/ …
```

---

## 2. Pièges SQL PostgreSQL

| Table | Syntaxe JDBC |
|---|---|
| `commentaires`, `articles`, `users` | Sans guillemets |
| **`"catégories"`** | Guillemets doubles obligatoires |
| **`"médias"`** | Idem |
| Colonne `"type"` sur médias | `"type"` (mot réservé) |

**Exemple :**

```sql
SELECT id, nom, description FROM "catégories" ORDER BY nom
```

```sql
SELECT m.id, m."type", m.url
FROM "médias" m
INNER JOIN articles_medias am ON am.media_id = m.id
WHERE am.article_id = ?
```

---

## 3. Commentaires — corrigé détaillé (modèle pour les autres ressources)

### 3.1 `Commentaire.java`

```java
package fr.ada.java_blog.model;

import java.time.LocalDateTime;

public class Commentaire {

    private Integer id;
    private String contenu;
    private Integer userId;
    private Integer articleId;
    private LocalDateTime date;

    public Commentaire(Integer id, String contenu, Integer userId, Integer articleId, LocalDateTime date) {
        this.id = id;
        this.contenu = contenu;
        this.userId = userId;
        this.articleId = articleId;
        this.date = date;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getContenu() { return contenu; }
    public void setContenu(String contenu) { this.contenu = contenu; }
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public Integer getArticleId() { return articleId; }
    public void setArticleId(Integer articleId) { this.articleId = articleId; }
    public LocalDateTime getDate() { return date; }
    public void setDate(LocalDateTime date) { this.date = date; }
}
```

### 3.2 DTO

```java
// dto/CommentaireResponse.java
package fr.ada.java_blog.dto;

import java.time.LocalDateTime;

public record CommentaireResponse(
        Integer id,
        String contenu,
        Integer userId,
        LocalDateTime date
) {}
```

```java
// dto/CommentaireCreateRequest.java
package fr.ada.java_blog.dto;

public record CommentaireCreateRequest(String contenu, Integer userId) {}
```

### 3.3 `CommentaireMapper.java`

```java
package fr.ada.java_blog.mapper;

import fr.ada.java_blog.dto.CommentaireResponse;
import fr.ada.java_blog.model.Commentaire;

public final class CommentaireMapper {

    private CommentaireMapper() {}

    public static CommentaireResponse toResponse(Commentaire c) {
        return new CommentaireResponse(c.getId(), c.getContenu(), c.getUserId(), c.getDate());
    }
}
```

### 3.4 `CommentaireRepository.java`

```java
package fr.ada.java_blog.repository;

import fr.ada.java_blog.model.Commentaire;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class CommentaireRepository {

    private final JdbcTemplate jdbcTemplate;

    private static final RowMapper<Commentaire> ROW_MAPPER = (rs, rowNum) -> new Commentaire(
            rs.getInt("id"),
            rs.getString("contenu"),
            rs.getObject("user_id", Integer.class),
            rs.getObject("article_id", Integer.class),
            rs.getTimestamp("date").toLocalDateTime()
    );

    public CommentaireRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Commentaire> findByArticleId(int articleId) {
        String sql = """
                SELECT id, contenu, user_id, article_id, date
                FROM commentaires
                WHERE article_id = ?
                ORDER BY date DESC
                """;
        return jdbcTemplate.query(sql, ROW_MAPPER, articleId);
    }

    public Optional<Commentaire> findById(int id) {
        String sql = """
                SELECT id, contenu, user_id, article_id, date
                FROM commentaires WHERE id = ?
                """;
        return jdbcTemplate.query(sql, ROW_MAPPER, id).stream().findFirst();
    }

    public Commentaire save(int articleId, String contenu, int userId) {
        String sql = """
                INSERT INTO commentaires (contenu, user_id, article_id, date)
                VALUES (?, ?, ?, ?)
                RETURNING id, contenu, user_id, article_id, date
                """;
        LocalDateTime now = LocalDateTime.now();
        return jdbcTemplate.queryForObject(sql, ROW_MAPPER, contenu, userId, articleId, now);
    }

    public boolean deleteById(int id) {
        return jdbcTemplate.update("DELETE FROM commentaires WHERE id = ?", id) > 0;
    }
}
```

### 3.5 Controllers

```java
// controller/CommentaireController.java
package fr.ada.java_blog.controller;

import fr.ada.java_blog.dto.CommentaireCreateRequest;
import fr.ada.java_blog.dto.CommentaireResponse;
import fr.ada.java_blog.mapper.CommentaireMapper;
import fr.ada.java_blog.repository.ArticleRepository;
import fr.ada.java_blog.repository.CommentaireRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/articles/{articleId}/commentaires")
public class CommentaireController {

    private final CommentaireRepository commentaireRepository;
    private final ArticleRepository articleRepository;

    public CommentaireController(CommentaireRepository commentaireRepository,
                                 ArticleRepository articleRepository) {
        this.commentaireRepository = commentaireRepository;
        this.articleRepository = articleRepository;
    }

    @GetMapping
    public List<CommentaireResponse> lister(@PathVariable int articleId) {
        verifierArticleExiste(articleId);
        return commentaireRepository.findByArticleId(articleId).stream()
                .map(CommentaireMapper::toResponse)
                .toList();
    }

    @PostMapping
    public ResponseEntity<CommentaireResponse> creer(
            @PathVariable int articleId,
            @RequestBody CommentaireCreateRequest body) {
        verifierArticleExiste(articleId);
        var saved = commentaireRepository.save(articleId, body.contenu(), body.userId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(CommentaireMapper.toResponse(saved));
    }

    private void verifierArticleExiste(int articleId) {
        articleRepository.findById(articleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article introuvable"));
    }
}
```

```java
// controller/AdminCommentaireController.java
package fr.ada.java_blog.controller;

import fr.ada.java_blog.repository.CommentaireRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/admin/commentaires")
public class AdminCommentaireController {

    private final CommentaireRepository commentaireRepository;

    public AdminCommentaireController(CommentaireRepository commentaireRepository) {
        this.commentaireRepository = commentaireRepository;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable int id) {
        if (!commentaireRepository.deleteById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Commentaire introuvable");
        }
    }
}
```

### 3.6 Tests curl

```bash
curl -s http://localhost:8080/articles/1/commentaires
curl -s -X POST http://localhost:8080/articles/1/commentaires \
  -H "Content-Type: application/json" \
  -d '{"contenu":"Super article !","userId":2}'
curl -s -X DELETE http://localhost:8080/admin/commentaires/1 \
  -H "Authorization: Bearer <token>"
```

---

## 4. Admin articles — compléter

Ajouter dans **`AdminArticleController`** (JWT déjà requis via `/admin/**`) :

```java
@GetMapping
public List<ArticleResponse> listerTous() {
    return articleRepository.findAll().stream()
            .map(ArticleMapper::toResponse)
            .toList();
}

@GetMapping("/{id}")
public ArticleResponse detail(@PathVariable int id) {
    Article article = articleRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    return ArticleMapper.toResponse(article);
}
```

**Repository — ajouter :**

```java
public List<Article> findAll() {
    String sql = """
            SELECT id, titre, contenu, statut, date, "update", user_id
            FROM articles ORDER BY date DESC
            """;
    return jdbcTemplate.query(sql, ROW_MAPPER);
}
```

> 💡 Variante : DTO admin avec champ `publie` explicite — acceptable si cohérent avec le front.

---

## 5. Catégories — corrigé condensé

### Model + DTO

```java
// model/Categorie.java — id, nom, description (+ getters/setters)
// dto/CategorieResponse.java — record(id, nom, description)
// dto/CategorieCreateRequest.java — record(nom, description)
// dto/CategorieUpdateRequest.java — record(nom, description)
```

### Repository — extraits SQL

```java
public List<Categorie> findAll() {
    return jdbcTemplate.query(
            "SELECT id, nom, description FROM \"catégories\" ORDER BY nom",
            ROW_MAPPER);
}

public List<Article> findArticlesPubliesByCategorieId(int categorieId) {
    String sql = """
            SELECT a.id, a.titre, a.contenu, a.statut, a.date, a."update", a.user_id
            FROM articles a
            INNER JOIN articles_categories ac ON ac.article_id = a.id
            WHERE ac.categorie_id = ? AND a.statut = TRUE
            ORDER BY a.date DESC
            """;
    return jdbcTemplate.query(sql, articleRowMapper, categorieId);
}
```

### Controllers

| Classe | Routes |
|---|---|
| `CategorieController` | `GET /categories`, `GET /categories/{id}/articles` |
| `AdminCategorieController` | `POST/PUT/DELETE /admin/categories` |

**Bonus N-N :** `PUT /admin/articles/{id}/categories` — body `{ "categorieIds": [1, 2] }` → supprimer les liens existants puis `INSERT INTO articles_categories`.

---

## 6. Médias — corrigé condensé

```java
// model/Media.java — id, type (String), url
// dto/MediaResponse.java — record(id, type, url)
// dto/MediaCreateRequest.java — record(type, url)
```

```java
public List<Media> findByArticleId(int articleId) {
    String sql = """
            SELECT m.id, m."type", m.url
            FROM "médias" m
            INNER JOIN articles_medias am ON am.media_id = m.id
            WHERE am.article_id = ?
            """;
    return jdbcTemplate.query(sql, ROW_MAPPER, articleId);
}
```

| Controller | Routes |
|---|---|
| `MediaController` | `GET /articles/{id}/medias`, `GET /medias/{id}` (bonus) |
| `AdminMediaController` | `POST /admin/medias`, `DELETE /admin/medias/{id}` |

**POST `/admin/medias`** : INSERT dans `"médias"` + optionnellement lien dans `articles_medias` si body contient `articleId`.

---

## 7. Utilisateurs — corrigé condensé

```java
// dto/UserPublicResponse.java — record(id, pseudo, mail)
// dto/UserCreateRequest.java — record(pseudo, mail, mdp)
```

```java
// UserRepository — ajouter findAll(), findById(), save(User avec mdp hashé)
// UserMapper.toPublicResponse(User u) — jamais getMdp()
```

| Route | Controller |
|---|---|
| `GET /users/{id}` | `UserController` |
| `GET /admin/users`, `POST /admin/users` | `AdminUserController` |

**POST admin user :**

```java
String hash = passwordEncoder.encode(body.mdp());
userRepository.save(new User(null, body.pseudo(), body.mail(), hash));
```

Réutiliser le `BCryptPasswordEncoder` bean de la partie 05.

---

## 8. Front-office — `site/`

### 8.1 Setup

```bash
npm create vite@latest site -- --template react
cd site && npm install
```

**`site/vite.config.js`** — port 5174 :

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
})
```

**CORS Spring** — ajouter dans la config existante (partie 04) :

```java
.allowedOrigins("http://localhost:5173", "http://localhost:5174")
```

### 8.2 Arborescence cible

```
site/src/
├── api/
│   ├── articles.js       ← fetchArticles(), fetchArticle(id)
│   └── commentaires.js   ← fetchCommentaires(articleId), postCommentaire(...)
├── components/
│   ├── ArticleCard.jsx
│   ├── ArticleList.jsx
│   ├── CommentList.jsx
│   └── CommentForm.jsx
├── pages/
│   ├── HomePage.jsx      ← liste GET /articles
│   └── ArticlePage.jsx   ← GET /articles/{id} + commentaires
├── App.jsx               ← react-router-dom (optionnel mais recommandé)
└── main.jsx
```

### 8.3 Exemple `site/src/api/articles.js`

```javascript
const API = "http://localhost:8080";

export async function fetchArticles() {
  const res = await fetch(`${API}/articles`);
  if (!res.ok) throw new Error("Erreur chargement articles");
  return res.json();
}

export async function fetchArticle(id) {
  const res = await fetch(`${API}/articles/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Erreur article");
  return res.json();
}
```

### 8.4 Exemple `CommentForm.jsx` (props)

```jsx
export function CommentForm({ articleId, userId, onPosted }) {
  const [contenu, setContenu] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    await postCommentaire(articleId, { contenu, userId });
    setContenu("");
    onPosted(); // parent recharge la liste
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea value={contenu} onChange={(e) => setContenu(e.target.value)} />
      <button type="submit">Publier</button>
    </form>
  );
}
```

> 💡 **`userId` fixe** (ex. `2`) acceptable en démo — pas d'inscription visiteur en v1.

### 8.5 Routing minimal (`App.jsx`)

Installer : `npm install react-router-dom`

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { ArticlePage } from "./pages/ArticlePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/articles/:id" element={<ArticlePage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 9. Checklist correction — « ont-ils tout couvert ? »

| Besoin | Route attendue | Oubli fréquent |
|---|---|---|
| Admin voit les brouillons | `GET /admin/articles` | Oui |
| Commentaires imbriqués | `/articles/{id}/commentaires` | Oui (route plate `/commentaires`) |
| Modération | `DELETE /admin/commentaires/{id}` | Oui |
| Catégories | `GET /categories` | Oui |
| Filtre par catégorie | `GET /categories/{id}/articles` | Oui |
| Médias d'un article | `GET /articles/{id}/medias` | Oui |
| Profil sans mdp | `GET /users/{id}` | **Oui — fuite mdp = 0** |
| Doc | `doc/API.md` | Souvent oublié |
| Front public | `site/` distinct de `admin/` | Confusion avec le back-office |

---

## 10. `doc/API.md` — sections à ajouter (extrait)

```markdown
## Commentaires

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/articles/{id}/commentaires` | Non | Liste |
| POST | `/articles/{id}/commentaires` | Non | `{ contenu, userId }` → 201 |
| DELETE | `/admin/commentaires/{id}` | JWT | 204 |

## Catégories

| GET | `/categories` | Non | Liste |
| GET | `/categories/{id}/articles` | Non | Articles publiés |
| POST/PUT/DELETE | `/admin/categories` | JWT | CRUD |

## Médias

| GET | `/articles/{id}/medias` | Non | Liste |
| POST | `/admin/medias` | JWT | `{ type, url }` |
| DELETE | `/admin/medias/{id}` | JWT | 204 |

## Utilisateurs

| GET | `/users/{id}` | Non | `{ id, pseudo, mail }` — pas de mdp |
| GET | `/admin/users` | JWT | Liste |
| POST | `/admin/users` | JWT | Créer (mdp hashé) |
```

---

## 11. Débrief formateur (10 min)

1. « Qui a exposé le **mdp** en JSON ? » → Rappel sécurité.
2. « Qui a mis du SQL dans le **controller** ? » → Retour partie 03.
3. « Pourquoi **deux** apps React (`admin/` et `site/`) ? » → Rôles différents.
4. « Quelle route a été la plus difficile ? » → Souvent N-N catégories ou guillemets SQL.

**Message de clôture :** *« Vous avez une API quasi complète et un site public — c'est le socle d'un vrai produit. La suite : déploiement, Docker, tests E2E. »*

---

## 12. Variantes acceptables

| Sujet | Variante OK |
|---|---|
| URL | `/api/articles/...` avec `@RequestMapping("/api")` global |
| PATCH publier | `PUT` avec `{ "publie": true }` au lieu de route dédiée |
| Front | Pas de router — une seule page avec état `selectedId` |
| Commentaire POST | Auth visiteur future — pas exigé en v1 |

---

## Suite

Fin du parcours **parties 01–07**. Mettre à jour **`INDEX.md`** côté formateur si des routes bonus deviennent obligatoires l'année suivante.

👉 **Bonus tests :** [partie-07-03-tests-tp-commentaires.md](partie-07-03-tests-tp-commentaires.md) — à proposer aux élèves avancés ou en correction guidée.
