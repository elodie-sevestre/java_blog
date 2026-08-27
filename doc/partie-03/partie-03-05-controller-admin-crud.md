# Partie 03 — Étape 05
# Controller admin : CRUD (POST / PUT / DELETE)

> 📘 **Tu crées 1 fichier Java.** C'est la **1ʳᵉ fois** que tu codes l'écriture.  
> Objectif + pourquoi + explication ligne par ligne.  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** [partie-03-04-controller-get-public.md](partie-03-04-controller-get-public.md) (commit `03-04` OK).

## Objectif de cette étape

Implémenter les routes admin conçues à **`partie-02-05-concevoir-les-routes.md`** :

- **POST** — créer un article ;
- **PUT** — modifier un article ;
- **DELETE** — supprimer un article.

> 💡 **Hors scope partie 03** (voir `INDEX.md`) : GET `/admin/articles`, commentaires, catégories… → **partie 07 (TP)** ; auth → **partie 05**.

**Pourquoi un controller séparé ?**

| Public (`ArticleController`) | Admin (`AdminArticleController`) |
|---|---|
| Lecture seule (GET) | Écriture (POST / PUT / DELETE) |
| `/articles/…` | `/admin/articles/…` |
| Demain : ouvert à tous | Demain : protégé par auth |

---

## Todo de cette étape

- [ ] Créer `AdminArticleController.java`
- [ ] Tester POST, PUT, DELETE avec curl ou Insomnia
- [ ] Vérifier le CRUD complet
- [ ] Committer l'étape sur `partie-03`

---

## Branche Git

Branche active : **`partie-03`** (créée en [partie-03-01-cadrage-couches.md](partie-03-01-cadrage-couches.md)).

```bash
git branch   # * partie-03
```

Si besoin : `git checkout partie-03`

---

## Verbes HTTP — pourquoi le navigateur ne suffit pas

| Verbe | Action | Test |
|---|---|---|
| GET | Lire | Navigateur ✅ |
| POST | Créer | Insomnia / curl |
| PUT | Modifier | Insomnia / curl |
| DELETE | Supprimer | Insomnia / curl |

Le navigateur tape une URL → toujours un **GET**. Pour écrire, il faut un outil qui envoie POST / PUT / DELETE.

---

# Fichier 8 — `AdminArticleController.java`

**Chemin :** `src/main/java/fr/ada/java_blog/controller/AdminArticleController.java`

```java
package fr.ada.java_blog.controller;

import fr.ada.java_blog.dto.ArticleCreateRequest;
import fr.ada.java_blog.dto.ArticleResponse;
import fr.ada.java_blog.dto.ArticleUpdateRequest;
import fr.ada.java_blog.mapper.ArticleMapper;
import fr.ada.java_blog.model.Article;
import fr.ada.java_blog.repository.ArticleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/admin/articles")
public class AdminArticleController {

    private final ArticleRepository articleRepository;

    public AdminArticleController(ArticleRepository articleRepository) {
        this.articleRepository = articleRepository;
    }

    @PostMapping
    public ResponseEntity<ArticleResponse> creer(@RequestBody ArticleCreateRequest body) {
        LocalDateTime maintenant = LocalDateTime.now();
        Article article = new Article(
                null, body.titre(), body.contenu(),
                false, maintenant, maintenant, body.userId()
        );
        Article sauve = articleRepository.save(article);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ArticleMapper.toResponse(sauve));
    }

    @PutMapping("/{id}")
    public ArticleResponse modifier(@PathVariable int id, @RequestBody ArticleUpdateRequest body) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Article introuvable"));

        article.setTitre(body.titre());
        article.setContenu(body.contenu());
        article.setPublie(body.publie());
        article.setUpdate(LocalDateTime.now());

        if (!articleRepository.update(id, article)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Article introuvable");
        }
        return ArticleMapper.toResponse(article);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable int id) {
        if (!articleRepository.deleteById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Article introuvable");
        }
        return ResponseEntity.noContent().build();
    }
}
```

**Explication — points clés :**

- `@RequestBody ArticleCreateRequest body` → Spring lit le JSON et remplit le DTO (`body.titre()`).
- `new Article(null, …, false, …)` → brouillon (`publie = false`), pas d'id encore.
- `articleRepository.save(article)` → INSERT + `setId` via `RETURNING id`.
- `ResponseEntity.status(CREATED)` → status **201**.
- `article.setTitre(body.titre())`… → **setters** sur le model chargé depuis la base.
- `ResponseEntity.noContent().build()` → **204** après DELETE.

| Verbe | URL | Status OK |
|---|---|---|
| POST | `/admin/articles` | 201 |
| PUT | `/admin/articles/{id}` | 200 |
| DELETE | `/admin/articles/{id}` | 204 |

> 🔐 Pas d'authentification pour l'instant : le préfixe `/admin` prépare la partie 05.

---

## 🆘 DELETE — erreur 500 ?

| Symptôme | Cause | Solution |
|---|---|---|
| HTTP **500** à la suppression | Clés étrangères (`commentaires`, `articles_categories`, …) | [partie-04-06 § Backend — lignes liées (FK)](partie-04-06-suppression-et-recap.md) |

---

## Tester le CRUD

```bash
# 1. Create
curl -X POST http://localhost:8080/admin/articles \
  -H "Content-Type: application/json" \
  -d '{"titre":"Test partie 03","contenu":"Couches OK","userId":1}'

# 2. Read (public)
curl http://localhost:8080/articles/recents

# 3. Update (publier)
curl -X PUT http://localhost:8080/admin/articles/1 \
  -H "Content-Type: application/json" \
  -d '{"titre":"MAJ","contenu":"Texte modifié","publie":true}'

# 4. Delete
curl -X DELETE http://localhost:8080/admin/articles/1
```

---

## 🆘 En cas de problème

| Symptôme | Pourquoi | Fix |
|---|---|---|
| `setId()` introuvable | `Article` incomplet | Getters/setters complets (étape 02) |
| `titre()` sur un `Article` | Confusion model / DTO | Model → `getTitre()` ; DTO → `titre()` |
| JSON avec `userId` | Model renvoyé sans mapper | `ArticleMapper.toResponse` |
| SQL dans le controller | Refactor incomplet | Tout dans `ArticleRepository` |
| 404 dans le repo | Mauvaise couche | 404 = controller uniquement |

---

## Enregistrer l'étape dans Git

```bash
git status
git add .
git commit -m "03-05 — AdminArticleController : POST / PUT / DELETE"
git log --oneline
```

> ✅ **Vérifie :** 4 commits sur `partie-03` (`03-02` … `03-05`).

---

## ✅ Récapitulatif partie 03

| # | Fichier | Rôle |
|---|---|---|
| 1 | `Article.java` | Ligne BDD en Java |
| 2–4 | 3 DTO | Contrat JSON entrée/sortie |
| 5 | `ArticleMapper.java` | Model → DTO |
| 6 | `ArticleRepository.java` | SQL centralisé |
| 7 | `ArticleController.java` | GET publics |
| 8 | `AdminArticleController.java` | CRUD admin |

- [ ] 1 fichier = 1 classe
- [ ] Deux mappings (RowMapper + ArticleMapper)
- [ ] SQL dans le repository seulement
- [ ] GET publics + CRUD admin OK
- [ ] Branche `partie-03` commitée

---

## Suite

Consulte **`INDEX.md`** pour la **partie 04** — frontend React back-office.
