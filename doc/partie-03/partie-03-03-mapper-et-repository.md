# Partie 03 — Étape 03
# `ArticleMapper` et `ArticleRepository`

> 📘 **Tu crées 2 fichiers Java.** Tout le SQL vit dans le repository.  
> Objectif + pourquoi + explication ligne par ligne.  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** [partie-03-02-model-et-dtos.md](partie-03-02-model-et-dtos.md) (commit `03-02` OK).

## Objectif de cette étape

1. **`ArticleMapper`** — convertir `Article` → `ArticleResponse` (mapping ②).
2. **`ArticleRepository`** — parler à PostgreSQL (mapping ① + tout le SQL).

**Pourquoi maintenant ?** Les controllers (étapes 04 / 05) ne doivent **plus** contenir de SQL. On prépare d'abord la « cuisine » (repository) et le « dressage » (mapper).

---

## Todo de cette étape

- [ ] Créer le dossier `mapper/` (s'il n'existe pas)
- [ ] Créer `mapper/ArticleMapper.java`
- [ ] Créer le dossier `repository/` (s'il n'existe pas)
- [ ] Créer `repository/ArticleRepository.java`
- [ ] Vérifier la compilation
- [ ] Confirmer : **aucun** `jdbcTemplate` dans un controller
- [ ] Committer l'étape sur `partie-03`

---

## Branche Git

Branche active : **`partie-03`** (créée en [partie-03-01-cadrage-couches.md](partie-03-01-cadrage-couches.md)).

```bash
git branch
```

Résultat attendu : `* partie-03`

Si besoin : `git checkout partie-03`

> 💡 Branche introuvable ? Reprends **partie-03-01**, section « Créer la branche Git ».

---

## Objectif

Transformer un **`Article`** (model complet) en **`ArticleResponse`** (JSON public) — sans toucher à la base ni à HTTP.

**Chemin :** `src/main/java/fr/ada/java_blog/mapper/ArticleMapper.java`

```java
package fr.ada.java_blog.mapper;

import fr.ada.java_blog.dto.ArticleResponse;
import fr.ada.java_blog.model.Article;

public final class ArticleMapper {

    private ArticleMapper() {
    }

    public static ArticleResponse toResponse(Article article) {
        return new ArticleResponse(
                article.getId(),
                article.getTitre(),
                article.getContenu(),
                article.isPublie(),
                article.getDate()
        );
    }
}
```

**Explication ligne par ligne :**

- `package fr.ada.java_blog.mapper;` → package des convertisseurs model → DTO.
- `import …ArticleResponse;` / `import …Article;` → les deux types qu'on relie.
- `public final class ArticleMapper` → classe utilitaire (pas d'héritage).
- `private ArticleMapper() { }` → constructeur privé : on n'instancie pas le mapper.
- `public static ArticleResponse toResponse(Article article)` → méthode **statique** : `ArticleMapper.toResponse(…)` sans `new`.
- `article.getId(),` … `article.getDate()` → copie les champs publics via les getters.
- *(pas de `getUpdate()` ni `getUserId()`)* → ces champs **ne sortent pas** en JSON public.

> ✅ **Todo :** compile.

---

# Fichier 6 — `ArticleRepository.java`

## Objectif

Centraliser **tout** l'accès à la table `articles` : SELECT, INSERT, UPDATE, DELETE.

**Pourquoi ce fichier ?** À la partie 02, le SQL était dans `ArticleBddController`. Ici : **une classe = la base**.

**Chemin :** `src/main/java/fr/ada/java_blog/repository/ArticleRepository.java`

---

## Partie A — En-tête et `RowMapper`

```java
package fr.ada.java_blog.repository;

import fr.ada.java_blog.model.Article;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class ArticleRepository {

    private static final RowMapper<Article> ROW_MAPPER = (rs, rowNum) -> {
        Timestamp dateTs = rs.getTimestamp("date");
        Timestamp updateTs = rs.getTimestamp("update");
        Integer userId = rs.getObject("user_id", Integer.class);
        return new Article(
                rs.getInt("id"),
                rs.getString("titre"),
                rs.getString("contenu"),
                rs.getBoolean("statut"),
                dateTs != null ? dateTs.toLocalDateTime() : null,
                updateTs != null ? updateTs.toLocalDateTime() : null,
                userId
        );
    };

    private final JdbcTemplate jdbcTemplate;

    public ArticleRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
```

**Explication :**

- `@Repository` → Spring crée cette classe ; elle parle à la **BDD**.
- `RowMapper<Article> ROW_MAPPER` → mapping **①** : une ligne SQL → un `Article`. Réutilisé par tous les SELECT.
- `rs.getBoolean("statut")` → colonne SQL `statut` → champ Java `publie`.
- `JdbcTemplate` injecté par Spring (déjà configuré à la partie 02).

---

## Partie B — Lecture (Read)

```java
    public List<Article> findRecents(int limit) {
        return jdbcTemplate.query(
                """
                SELECT id, titre, contenu, statut, date, "update", user_id
                FROM articles
                ORDER BY date DESC, id DESC
                LIMIT ?
                """,
                ROW_MAPPER,
                limit
        );
    }

    public int countRecents(int limit) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM (
                    SELECT 1 FROM articles
                    ORDER BY date DESC, id DESC
                    LIMIT ?
                ) AS recents
                """,
                Integer.class,
                limit
        );
        return count != null ? count : 0;
    }

    public List<Article> findPublies() {
        return jdbcTemplate.query(
                """
                SELECT id, titre, contenu, statut, date, "update", user_id
                FROM articles
                WHERE statut = true
                ORDER BY date DESC, id DESC
                """,
                ROW_MAPPER
        );
    }

    public Optional<Article> findById(int id) {
        List<Article> articles = jdbcTemplate.query(
                """
                SELECT id, titre, contenu, statut, date, "update", user_id
                FROM articles
                WHERE id = ?
                """,
                ROW_MAPPER,
                id
        );
        return articles.stream().findFirst();
    }
```

**Pourquoi ces méthodes ?**

| Méthode | Route (étape 04) | Remarque |
|---|---|---|
| `findRecents` | GET `/articles/recents` | Même logique qu'à la partie 02 : **tous statuts**, 5 derniers |
| `countRecents` | GET `/articles/recents/count` | Bonus partie 02, intégré ici |
| `findPublies` | GET `/articles` | Articles **publiés** seulement |
| `findById` | GET `/articles/{id}` | Un article par id ; `Optional` vide → 404 au controller |

> 💡 **`findRecents` ne filtre pas par `statut`** — comportement identique à `ArticleBddController` (partie 02). Seul `GET /articles` ne montre que les publiés.

---

## Partie C — Écriture (Create / Update / Delete)

```java
    public Article save(Article article) {
        Integer id = jdbcTemplate.queryForObject(
                """
                INSERT INTO articles (titre, contenu, date, statut, "update", user_id)
                VALUES (?, ?, ?, ?, ?, ?)
                RETURNING id
                """,
                Integer.class,
                article.getTitre(),
                article.getContenu(),
                toTimestamp(article.getDate()),
                article.isPublie(),
                toTimestamp(article.getUpdate()),
                article.getUserId()
        );
        article.setId(id);
        return article;
    }

    public boolean update(int id, Article article) {
        int rows = jdbcTemplate.update(
                """
                UPDATE articles
                SET titre = ?, contenu = ?, statut = ?, "update" = ?
                WHERE id = ?
                """,
                article.getTitre(),
                article.getContenu(),
                article.isPublie(),
                toTimestamp(article.getUpdate()),
                id
        );
        return rows > 0;
    }

    public boolean deleteById(int id) {
        int rows = jdbcTemplate.update("DELETE FROM articles WHERE id = ?", id);
        return rows > 0;
    }

    private static Timestamp toTimestamp(LocalDateTime value) {
        return value != null ? Timestamp.valueOf(value) : null;
    }
}
```

> ⚠️ **Avec `blog.sql` complet :** un article peut avoir des **commentaires**, des **liaisons catégories/médias**, etc. PostgreSQL **refuse** alors un `DELETE` direct (erreur **500** — violation de clé étrangère).  
> 👉 Correction dans [partie-04-06-suppression-et-recap.md](partie-04-06-suppression-et-recap.md) § **« Backend — lignes liées (FK) »** : supprimer ou détacher les enfants **avant** l'article.

**Lignes clés — `save` :**

- `RETURNING id` → PostgreSQL renvoie le nouvel `id` dans la **même** requête.
- `article.setId(id)` → remplit l'id sur l'objet (setter du model).

> ✅ **Todo :** compile. Aucun SQL hors de ce fichier.

---

## Vérifier

```bash
./mvnw compile
```

Les routes `/articles/recents` passent encore par `ArticleBddController` — **normal** jusqu'à l'étape 04.

---

## Enregistrer l'étape dans Git

```bash
git status
git add .
git commit -m "03-03 — ArticleMapper + ArticleRepository (SQL centralisé)"
git log --oneline
```

---

## Suite

👉 **[partie-03-04-controller-get-public.md](partie-03-04-controller-get-public.md)** — refactorer `ArticleController`.
