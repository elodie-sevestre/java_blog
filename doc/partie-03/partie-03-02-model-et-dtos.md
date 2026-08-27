# Partie 03 — Étape 02
# Model `Article` et DTOs

> 📘 **Tu crées 4 fichiers Java** et tu **supprimes** 3 fichiers obsolètes de la partie 01.  
> Chaque ligne de code est expliquée.  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** [partie-03-01-cadrage-couches.md](partie-03-01-cadrage-couches.md) (branche `partie-03` active).

## Objectif de cette étape

Créer les **objets de données** de la partie 03 :

- **`Article`** → ce qu'on manipule en interne (aligné sur la table PostgreSQL).
- **3 DTO** → ce qu'on envoie / reçoit en JSON (plus simple, plus sûr).

**Pourquoi maintenant ?** Sans model et DTO, le repository et les controllers n'ont rien à manipuler. C'est la **fondation** avant le SQL et les routes.

> 💡 **Deux syntaxes dans cette étape :**  
> - **`Article`** (model) → classe + getters/setters (`getTitre()`, `setId()`…).  
> - **DTO** → **records** (`body.titre()` pour lire le JSON entrant).

## Todo de cette étape

- [ ] Supprimer `ArticleController.java`, `Auteur.java`, `Demo.java`, `controller/AuteurController.java` si créé en 7B (partie 01)
- [ ] Créer le dossier `dto/` (s'il n'existe pas)
- [ ] Remplacer `model/Article.java` (nouvelle version BDD)
- [ ] Créer `dto/ArticleResponse.java`
- [ ] Créer `dto/ArticleCreateRequest.java`
- [ ] Créer `dto/ArticleUpdateRequest.java`
- [ ] Vérifier que le projet compile
- [ ] Committer l'étape sur `partie-03`

---

## Branche Git

Branche active : **`partie-03`** (créée en [partie-03-01-cadrage-couches.md](partie-03-01-cadrage-couches.md)).

```bash
git branch   # * partie-03
```

Si besoin : `git checkout partie-03`

---

Après cette étape :

| Route | Statut |
|---|---|
| `/ping`, `/db/ping`, `/articles/recents` | ✅ Encore actives (`ArticleBddController` de la partie 02) |
| `/articles`, `/articles/{numero}` | ❌ Supprimées (ancien `ArticleController` effacé) |

> ❓ **Pourquoi supprimer l'ancien controller maintenant ?** Le nouveau `Article.java` n'est **plus compatible** avec le code partie 01 (autre constructeur, plus de `publier()`). On retire le vieux code tout de suite pour éviter une compilation cassée. Les GET publics reviendront à l'**étape 04**, propres, via le repository.

---

## Rappel : model vs DTO

| | Model `Article` | DTO |
|---|---|---|
| **Rôle** | Reflète la **table** BDD | Reflète le **JSON** HTTP |
| **Qui le voit ?** | Repository, controller (en interne) | Le navigateur / Insomnia |
| **Exemple** | contient `userId`, `update` | `ArticleResponse` sans ces champs |

> 💡 **Model** = cuisine (fiche complète). **DTO** = assiette servie au client (moins de détails).

---

## Étape 0 — Supprimer le code partie 01 devenu incompatible

Supprime ces fichiers :

| Fichier | Pourquoi |
|---|---|
| `controller/ArticleController.java` | Articles en dur — remplacé à l'étape 04 |
| `controller/AuteurController.java` | Exercice 7B partie 01 — importe `Auteur` ; supprimer **avec** `Auteur.java` |
| `model/Auteur.java` | Démo partie 01, plus utilisé |
| `model/Demo.java` | Démo console partie 01, plus utilisé |

**Ne supprime pas encore :**

| Fichier | Pourquoi on le garde |
|---|---|
| `ArticleBdd.java` | Encore utilisé par `/articles/recents` |
| `ArticleBddController.java` | Route BDD partie 02, remplacée à l'étape 04 |
| `PingController.java`, `DatabaseController.java` | Toujours utiles |

> ✅ **Vérifie :** `./mvnw compile` passe (plus de référence à l'ancien `ArticleController`).

---

# Fichier 1 — `Article.java`

## Objectif

Avoir en Java **exactement** ce qu'il y a dans une ligne de la table `articles`.

## Pourquoi un nouveau fichier ?

| Avant (partie 02) | Maintenant (partie 03) | Pourquoi changer ? |
|---|---|---|
| `ArticleBdd.java` | **`Article.java`** (enrichi) | Un seul model pour toute la partie 03 |
| 5 champs | 7 champs | Colonnes `update`, `user_id` en plus |
| Getters seulement | Getters **+ setters** | Pour modifier (PUT) et `setId` après INSERT |

Tu **remplaces** l'ancien `Article` (partie 01, post-it) par ce fichier. `ArticleBdd` reste en place jusqu'à l'étape 04.

**Chemin :** `src/main/java/fr/ada/java_blog/model/Article.java`

```java
package fr.ada.java_blog.model;

import java.time.LocalDateTime;

public class Article {

    private Integer id;
    private String titre;
    private String contenu;
    private boolean publie;
    private LocalDateTime date;
    private LocalDateTime update;
    private Integer userId;

    public Article(
            Integer id,
            String titre,
            String contenu,
            boolean publie,
            LocalDateTime date,
            LocalDateTime update,
            Integer userId
    ) {
        this.id = id;
        this.titre = titre;
        this.contenu = contenu;
        this.publie = publie;
        this.date = date;
        this.update = update;
        this.userId = userId;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getContenu() { return contenu; }
    public void setContenu(String contenu) { this.contenu = contenu; }

    public boolean isPublie() { return publie; }
    public void setPublie(boolean publie) { this.publie = publie; }

    public LocalDateTime getDate() { return date; }
    public void setDate(LocalDateTime date) { this.date = date; }

    public LocalDateTime getUpdate() { return update; }
    public void setUpdate(LocalDateTime update) { this.update = update; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
}
```

**Explication ligne par ligne :**

- `package fr.ada.java_blog.model;` → package des classes « données métier ».
- `import java.time.LocalDateTime;` → type Java pour une **date + heure** (colonnes `date` et `update` en SQL).
- `public class Article {` → **classe** (pas un record).
- `private Integer id;` → identifiant. **`Integer`** (objet) et non `int` : permet `null` avant l'INSERT.
- `private String titre;` / `contenu;` → colonnes SQL homonymes.
- `private boolean publie;` → en Java `publie` ; en SQL la colonne s'appelle **`statut`**.
- `private LocalDateTime date;` / `update;` → dates création et modification.
- `private Integer userId;` → auteur (`user_id` en SQL).
- `public Article(...)` → constructeur : fabrique un article avec toutes les valeurs.
- `getTitre()`, `isPublie()`, `getId()`… → **getters** (lire un champ).
- `setTitre()`, `setId()`… → **setters** (modifier un champ — utile au PUT et après INSERT).

| Champ Java | Colonne SQL | Remarque |
|---|---|---|
| `id` | `id` | `setId()` après INSERT |
| `titre` | `titre` | |
| `contenu` | `contenu` | |
| `publie` | `statut` | noms différents |
| `date` | `date` | |
| `update` | `"update"` | guillemets en SQL |
| `userId` | `user_id` | camelCase ↔ snake_case |

> ⚠️ **`setId` est indispensable** pour `save()` dans le repository (PostgreSQL renvoie l'id généré).

> ✅ **Todo :** `Article.java` compile sans erreur.

---

# Fichier 2 — `ArticleResponse.java`

## Objectif

Définir **exactement** le JSON renvoyé au client lors d'un GET.

## Pourquoi ce fichier ?

Si on renvoie `Article` directement, le client verrait **`userId`**, **`update`**… — des infos internes.  
Le DTO **filtre** ce qui sort de l'API.

**Chemin :** `src/main/java/fr/ada/java_blog/dto/ArticleResponse.java`

> 📁 Crée le dossier **`dto/`** sous `fr/ada/java_blog/` si besoin.

```java
package fr.ada.java_blog.dto;

import java.time.LocalDateTime;

public record ArticleResponse(
        Integer id,
        String titre,
        String contenu,
        boolean publie,
        LocalDateTime date
) {}
```

**Explication ligne par ligne :**

- `package fr.ada.java_blog.dto;` → package des objets « forme du JSON ».
- `import java.time.LocalDateTime;` → pour le champ `date`.
- `public record ArticleResponse(` → DTO de **sortie** (réponse API).
- `Integer id,` → identifiant renvoyé au client.
- `String titre,` → titre de l'article.
- `String contenu,` → texte de l'article.
- `boolean publie,` → publié ou brouillon.
- `LocalDateTime date` → date affichée dans le JSON.
- `) {}` → fin du record.

**JSON correspondant (exemple) :**

```json
{
  "id": 3,
  "titre": "Mon article",
  "contenu": "Texte…",
  "publie": true,
  "date": "2026-02-10T10:00:00"
}
```

Pas de `userId`, pas de `update` : **volontaire** (API publique).

> ✅ **Todo :** compile.

---

# Fichier 3 — `ArticleCreateRequest.java`

## Objectif

Décrire le JSON que l'admin envoie pour **créer** un article (POST).

**Chemin :** `src/main/java/fr/ada/java_blog/dto/ArticleCreateRequest.java`

```java
package fr.ada.java_blog.dto;

public record ArticleCreateRequest(
        String titre,
        String contenu,
        Integer userId
) {}
```

**Explication :**

- DTO d'**entrée** pour un POST.
- Pas d'`id` dans le JSON : la base le génère à l'INSERT.
- `userId` → colonne `user_id` en base.

**JSON correspondant (exemple) :**

```json
{
  "titre": "Nouvel article",
  "contenu": "Texte du brouillon",
  "userId": 1
}
```

> ✅ **Todo :** compile.

---

# Fichier 4 — `ArticleUpdateRequest.java`

## Objectif

Décrire le JSON que l'admin envoie pour **modifier** un article (PUT).

**Chemin :** `src/main/java/fr/ada/java_blog/dto/ArticleUpdateRequest.java`

```java
package fr.ada.java_blog.dto;

public record ArticleUpdateRequest(
        String titre,
        String contenu,
        boolean publie
) {}
```

**JSON correspondant (exemple) :**

```json
{
  "titre": "Titre modifié",
  "contenu": "Nouveau texte",
  "publie": true
}
```

> 💡 L'**id** de l'article n'est **pas** dans ce JSON : il est dans l'**URL** → `PUT /admin/articles/3`.

---

## Bilan : 4 fichiers créés, 3 supprimés

| Fichier | Classe | Direction | Quand ? |
|---|---|---|---|
| `Article.java` | Model | Interne (BDD) | Toujours en cuisine |
| `ArticleResponse.java` | DTO | **Sortie** | GET → JSON au client |
| `ArticleCreateRequest.java` | DTO | **Entrée** | POST admin |
| `ArticleUpdateRequest.java` | DTO | **Entrée** | PUT admin |

---

## Vérifier

```bash
./mvnw compile
```

| Erreur de compilation | Cause | Fix |
|---|---|---|
| `ArticleController` introuvable | Normal si autre fichier y fait référence | Vérifie que l'ancien controller est bien supprimé |
| `Cannot resolve symbol 'record'` (DTO) | Mauvaise version Java | Java **21** (voir `pom.xml`) |

> ✅ **Todo :** compilation OK. `/articles/recents` fonctionne encore.

---

## Enregistrer l'étape dans Git

```bash
git status
git add .
git commit -m "03-02 — Article + DTOs, suppression code partie 01"
git log --oneline
```

> ✅ **Vérifie :** `git branch` affiche `* partie-03`.

---

## Suite

👉 **[partie-03-03-mapper-et-repository.md](partie-03-03-mapper-et-repository.md)** — `ArticleMapper` + `ArticleRepository` (SQL).
