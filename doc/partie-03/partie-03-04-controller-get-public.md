# Partie 03 — Étape 04
# Controller public : les GET

> 📘 **Tu crées 1 fichier** et tu **supprimes** le code BDD inline de la partie 02.  
> Objectif + pourquoi + explication ligne par ligne.  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** [partie-03-03-mapper-et-repository.md](partie-03-03-mapper-et-repository.md) (commit `03-03` OK).

## Objectif de cette étape

Refactorer **`ArticleController`** pour que les routes GET :

1. appellent le **repository** (plus de SQL ici) ;
2. passent par le **mapper** (JSON via DTO) ;
3. gèrent le **404** si un id n'existe pas.

**Pourquoi refactorer ?** Les URLs ne changent pas pour le client (`/articles/recents`…), mais le code devient **lisible** et prêt pour le CRUD admin.

> **Où on en est :** à la partie 02, `/articles/recents` passait par `ArticleBddController` (SQL inline). Tu viens de créer `ArticleRepository` et `ArticleMapper` (étapes 02–03). Ici, tu **remplaces** l'ancien controller BDD par une version propre.  
> **Changement d'URL :** `/articles/{numero}` (position, partie 01) disparaît → `/articles/{id}` (id en base).

---

## Todo de cette étape

- [ ] Supprimer `ArticleBddController.java` et `ArticleBdd.java` **en premier**
- [ ] Créer `ArticleController.java` (nouvelle version)
- [ ] Tester les GET dans le navigateur
- [ ] Committer l'étape sur `partie-03`

> ⚠️ **Ne lance pas** `./mvnw spring-boot:run` tant que **les deux** controllers mappent `GET /articles/recents` — supprime l'ancien **avant** de démarrer l'appli (ou enchaîne suppression + création sans redémarrage entre les deux).

---

## Branche Git

Branche active : **`partie-03`** (créée en [partie-03-01-cadrage-couches.md](partie-03-01-cadrage-couches.md)).

```bash
git branch   # * partie-03
```

Si besoin : `git checkout partie-03`

---

```
1. articleRepository.findById(id)   → Optional<Article>   (données)
2. ArticleMapper.toResponse(…)      → ArticleResponse     (JSON métier)
3. return …                         → réponse HTTP
```

Le controller **orchestre** : il ne cuisine pas (SQL) et ne filtre pas seul (mapper).

---

# Fichier 7 — `ArticleController.java`

**Chemin :** `src/main/java/fr/ada/java_blog/controller/ArticleController.java`

```java
package fr.ada.java_blog.controller;

import fr.ada.java_blog.dto.ArticleResponse;
import fr.ada.java_blog.mapper.ArticleMapper;
import fr.ada.java_blog.repository.ArticleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/articles")
public class ArticleController {

    private static final int LIMITE_RECENTS = 5;

    private final ArticleRepository articleRepository;

    public ArticleController(ArticleRepository articleRepository) {
        this.articleRepository = articleRepository;
    }

    @GetMapping
    public List<ArticleResponse> listerPublies() {
        return articleRepository.findPublies().stream()
                .map(ArticleMapper::toResponse)
                .toList();
    }

    @GetMapping("/recents")
    public List<ArticleResponse> recents() {
        return articleRepository.findRecents(LIMITE_RECENTS).stream()
                .map(ArticleMapper::toResponse)
                .toList();
    }

    @GetMapping("/recents/count")
    public Integer countRecents() {
        return articleRepository.countRecents(LIMITE_RECENTS);
    }

    @GetMapping("/{id}")
    public ArticleResponse un(@PathVariable int id) {
        return articleRepository.findById(id)
                .map(ArticleMapper::toResponse)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Article introuvable"));
    }
}
```

**Explication ligne par ligne :**

- `@RequestMapping("/articles")` → préfixe commun : `/articles`, `/articles/recents`…
- `private static final int LIMITE_RECENTS = 5;` → constante (évite le « 5 » en dur).
- `ArticleRepository articleRepository` → injecté par Spring au démarrage.

**Méthode `listerPublies` :**

- `@GetMapping` → route `GET /articles` (sans chemin supplémentaire).
- `findPublies()` → articles **publiés** depuis la base (remplace la liste en dur partie 01).

**Méthode `recents` :**

- `@GetMapping("/recents")` → `GET /articles/recents` (même URL qu'à la partie 02).
- SQL dans le repo ; JSON **sans** `userId` / `update` grâce au mapper.

**Méthode `countRecents` :**

- `@GetMapping("/recents/count")` → renvoie un **nombre** (pas une liste).

**Méthode `un` :**

- `@GetMapping("/{id}")` → **en dernier** pour ne pas capturer `recents` ou `recents/count`.
- `.orElseThrow(… NOT_FOUND …)` → **404** si id inconnu (décision du controller).

| Route | Action | Remarque |
|---|---|---|
| GET `/articles` | Publiés seulement | Depuis la base |
| GET `/articles/recents` | 5 plus récents (tous statuts) | Comme partie 02 |
| GET `/articles/recents/count` | Nombre | Bonus partie 02 |
| GET `/articles/{id}` | Détail | 404 si id inconnu |

> ✅ **Todo :** JSON **sans** `userId` / `update`.

---

## Fichiers à supprimer — pourquoi ?

| Fichier | Pourquoi le supprimer |
|---|---|
| `ArticleBddController.java` | SQL + routes → remplacé par controller + repository |
| `ArticleBdd.java` | Remplacé par `Article` |

`PingController` et `DatabaseController` **restent**.

---

## Tester

```bash
./mvnw spring-boot:run
```

- http://localhost:8080/articles — articles publiés depuis PostgreSQL
- http://localhost:8080/articles/recents
- http://localhost:8080/articles/recents/count
- http://localhost:8080/articles/1
- http://localhost:8080/articles/999 → **404**

---

## Enregistrer l'étape dans Git

```bash
git status
git add .
git commit -m "03-04 — ArticleController GET + suppression ArticleBdd"
git log --oneline
```

---

## 🆘 Dépannage

| Erreur | Cause | Action |
|---|---|---|
| `IllegalStateException: Ambiguous mapping … GET /articles/recents` | Tu as encore **`ArticleBddController`** **et** le nouveau **`ArticleController`** | Supprime `ArticleBddController.java` (et `ArticleBdd.java`) |
| Whitelabel 404 sur `/articles/recents` | Ancien supprimé, nouveau pas encore créé | Crée `ArticleController.java` puis relance Spring |

---

## Suite

👉 **[partie-03-05-controller-admin-crud.md](partie-03-05-controller-admin-crud.md)** — POST / PUT / DELETE admin.
