# Partie 02 — Étape 04
# Route `/articles/recents` — lire PostgreSQL en JSON

> 📘 **Ce document est ton support.** On le déroule ensemble en cours, mais tu pourras le reprendre seul pour **tout refaire de ton côté**. Chaque ligne de code y est expliquée, imports compris.  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** `partie-02-03-connexion-bdd.md` terminée (`/db/ping` OK, branche `partie-02`).

## Ce que tu vas savoir faire à la fin de cette étape

- Comprendre ce qu'est une **route** (URL + méthode HTTP + code Java associé).
- Écrire une **requête SQL** avec `ORDER BY` et `LIMIT`.
- Créer une route **`GET /articles/recents`** qui renvoie les **5 derniers articles** de PostgreSQL en JSON.
- **Committer** cette étape sur la branche `partie-02`.

> 🧵 **Le fil rouge :** à l'étape 03, tu as branché le câble (`/db/ping`). Ici, tu utilises ce câble pour **renvoyer de vraies données** au navigateur.

> 🗺️ **Vue d'ensemble :** pour comprendre l'architecture de la partie 02 et le rôle de chaque fichier, voir **`partie-02-02-vue-ensemble-architecture.md`**.

---

## Todo

- [ ] Vérifier la branche Git `partie-02`
- [ ] Comprendre la différence entre route, URL et endpoint
- [ ] Tester la requête SQL des 5 derniers articles dans pgAdmin
- [ ] Créer la classe `ArticleBdd` (article lu depuis la base)
- [ ] Créer `ArticleBddController` avec la route `/articles/recents`
- [ ] Vérifier le JSON dans le navigateur
- [ ] Comparer avec les dates visibles dans pgAdmin
- [ ] Committer l'étape sur `partie-02`

---

## 0. Avant de commencer : où on en est

| Route | Source des données | Depuis |
|---|---|---|
| `GET /ping` | Texte fixe `"pong"` | Partie 01 |
| `GET /articles` | Liste **en dur** en Java | Partie 01 |
| `GET /db/ping` | Compteur SQL `COUNT(*)` | Partie 02 — étape 03 |
| `GET /articles/recents` | **5 lignes** de la table `articles` | **Cette étape** |

> ✅ **Vérifie :** `/db/ping` fonctionne encore (`connexion ok — … article(s) en base`).

> 🌿 **Branche Git :** reste sur **`partie-02`**. Vérifie avec `git branch` — la `*` doit être sur cette branche.

---

# Partie 1 — Comprendre la notion de route

## 1. Route, URL, endpoint : trois mots pour la même idée

Quand tu ouvres **`http://localhost:8080/articles`** dans le navigateur, il se passe ceci :

```
Navigateur                    Spring Boot
    |                              |
    |  GET /articles               |
    |----------------------------->|
    |                              |  ArticleController.lister()
    |                              |  exécute le code Java
    |  JSON en réponse             |
    |<-----------------------------|
```

Une **route**, c'est la **correspondance** entre :

| Élément | Exemple | Rôle |
|---|---|---|
| **Méthode HTTP** | `GET` | Le **type** de demande (lire, pas modifier) |
| **Chemin (URL)** | `/articles` | L'**adresse** demandée |
| **Code Java** | `lister()` | Ce que l'application **exécute** pour répondre |

En cours, on utilise souvent **route**, **URL** et **endpoint** comme synonymes. Techniquement :

- **URL** = l'adresse complète (`http://localhost:8080/articles/recents`)
- **Route** = le chemin + la méthode (`GET /articles/recents`)
- **Endpoint** = le point d'accès côté API (souvent = la route)

> ❓ **Pourquoi `GET` ?** Le navigateur envoie toujours des requêtes **GET** quand tu tapes une adresse. C'est une **lecture** : tu demandes des données, tu n'en modifies pas.

---

## 2. Comment Spring définit une route (rappel partie 01)

Tu connais déjà ces deux annotations :

```java
@RestController
public class PingController {

    @GetMapping("/ping")
    public String ping() {
        return "pong";
    }
}
```

**Explication :**

- `@RestController` → cette classe **expose des routes**.
- `@GetMapping("/ping")` → associe la méthode à la route **`GET /ping`**.
- `public String ping()` → le code exécuté quand quelqu'un appelle cette route.
- `return "pong"` → ce qui est renvoyé au client (ici du texte).

**Une route = une annotation `@GetMapping` + une méthode Java.**

---

## 3. Plusieurs routes dans une même application

Ton application peut avoir **autant de routes que tu veux**, réparties dans **plusieurs contrôleurs** :

| Contrôleur | Route | Action |
|---|---|---|
| `PingController` | `GET /ping` | Test serveur |
| `ArticleController` | `GET /articles` | Articles en dur (partie 01) |
| `DatabaseController` | `GET /db/ping` | Test connexion BDD |
| `ArticleBddController` | `GET /articles/recents` | 5 derniers articles en base |

> 💡 **Convention :** on regroupe les routes qui parlent du **même sujet** dans le même contrôleur. Les articles « en dur » restent dans `ArticleController`. Les articles **depuis la base** vont dans `ArticleBddController` (nouveau).

---

## 4. Route fixe vs route avec paramètre (rappel)

| Type | Exemple | Signification |
|---|---|---|
| **Route fixe** | `/articles/recents` | Toujours la même adresse |
| **Route avec paramètre** | `/articles/{numero}` | Le `{numero}` change (`/articles/0`, `/articles/1`…) |

Dans cette étape, on crée une **route fixe** : `/articles/recents` renvoie toujours les 5 articles les plus récents.

> ✅ **Vérifie :** tu peux expliquer avec tes mots : « une route, c'est une URL qui déclenche une méthode Java ».

---

# Partie 2 — La requête SQL des 5 derniers articles

## 5. Tester d'abord dans pgAdmin

Avant d'écrire du Java, on valide le SQL dans le **Query Tool** (comme à l'étape 03).

1. pgAdmin → base **`java_blog`** → **Query Tool**
2. Tape :

```sql
SELECT id, titre, contenu, statut, date
FROM articles
ORDER BY date DESC, id DESC
LIMIT 5;
```

3. **Execute** (`F5`)

**Explication de la requête :**

| Morceau | Signification |
|---|---|
| `SELECT id, titre, …` | Les colonnes qu'on veut récupérer |
| `FROM articles` | Dans la table `articles` |
| `ORDER BY date DESC` | Tri par date **décroissante** (le plus récent en premier) |
| `id DESC` | En cas d'égalité de date, le plus grand `id` en premier |
| `LIMIT 5` | On ne garde que **5 lignes** |

Tu dois voir 5 lignes, avec les dates les plus récentes en haut (ex. articles de février 2026).

> ✅ **Todo :** la requête renvoie exactement 5 lignes dans pgAdmin.

---

## 6. Pourquoi une nouvelle classe `ArticleBdd` ?

La classe `Article` de la partie 01 sert aux articles **en mémoire** (`titre`, `contenu`, `publie`).

En base, un article a aussi un **`id`**, une **`date`**, et `statut` au lieu de `publie`. On crée donc une classe dédiée :

**`model/ArticleBdd.java`** — article **lu depuis PostgreSQL**.

> ❓ **Pourquoi ne pas réutiliser `Article` ?** Pour ne pas mélanger deux mondes (mémoire vs base) et casser `/articles` de la partie 01. Plus tard, un seul `Article` enrichi remplacera les deux.

---

## 7. Créer `ArticleBdd`

Crée **`src/main/java/fr/ada/java_blog/model/ArticleBdd.java`** :

```java
package fr.ada.java_blog.model;

import java.time.LocalDateTime;

public class ArticleBdd {

    private int id;
    private String titre;
    private String contenu;
    private boolean publie;
    private LocalDateTime date;

    public ArticleBdd(int id, String titre, String contenu, boolean publie, LocalDateTime date) {
        this.id = id;
        this.titre = titre;
        this.contenu = contenu;
        this.publie = publie;
        this.date = date;
    }

    public int getId() {
        return id;
    }

    public String getTitre() {
        return titre;
    }

    public String getContenu() {
        return contenu;
    }

    public boolean isPublie() {
        return publie;
    }

    public LocalDateTime getDate() {
        return date;
    }
}
```

**Explication ligne par ligne :**

- `package fr.ada.java_blog.model;` → package des classes « données ».
- `import java.time.LocalDateTime;` → type pour une date+heure (colonne `date` en SQL).
- `public class ArticleBdd {` → déclare la classe.
- `private int id;` → identifiant en base (colonne `id`).
- `private String titre;` → colonne `titre`.
- `private String contenu;` → colonne `contenu`.
- `private boolean publie;` → on mappe la colonne SQL `statut` vers `publie` (comme à la partie 01 pour le JSON).
- `private LocalDateTime date;` → colonne `date`.
- `public ArticleBdd(...)` → constructeur : fabrique un objet à partir des valeurs lues en SQL.
- `this.id = id;` etc. → range chaque valeur dans l'attribut correspondant.
- Les **getters** → permettent à Spring de construire le JSON (`getId` → `"id"`, `isPublie` → `"publie"`).

> ✅ **Todo :** le fichier compile sans erreur.

---

# Partie 3 — Créer la route `/articles/recents`

## 8. Créer `ArticleBddController`

Crée **`src/main/java/fr/ada/java_blog/controller/ArticleBddController.java`** :

```java
package fr.ada.java_blog.controller;

import fr.ada.java_blog.model.ArticleBdd;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

@RestController
public class ArticleBddController {

    private final JdbcTemplate jdbcTemplate;

    public ArticleBddController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/articles/recents")
    public List<ArticleBdd> cinqDerniers() {
        return jdbcTemplate.query(
                """
                SELECT id, titre, contenu, statut, date
                FROM articles
                ORDER BY date DESC, id DESC
                LIMIT 5
                """,
                (rs, rowNum) -> {
                    Timestamp timestamp = rs.getTimestamp("date");
                    LocalDateTime date = timestamp != null ? timestamp.toLocalDateTime() : null;
                    return new ArticleBdd(
                            rs.getInt("id"),
                            rs.getString("titre"),
                            rs.getString("contenu"),
                            rs.getBoolean("statut"),
                            date
                    );
                }
        );
    }
}
```

**Explication ligne par ligne :**

- `import fr.ada.java_blog.model.ArticleBdd;` → notre classe pour un article lu en base.
- `import org.springframework.jdbc.core.JdbcTemplate;` → outil SQL (déjà utilisé à l'étape 03).
- `import org.springframework.web.bind.annotation.GetMapping;` → définit une route GET.
- `import org.springframework.web.bind.annotation.RestController;` → marque un contrôleur web.
- `import java.sql.Timestamp;` → type intermédiaire pour lire une date SQL.
- `import java.time.LocalDateTime;` → type Java pour la date dans notre objet.
- `import java.util.List;` → la route renvoie une **liste** d'articles.
- `@RestController` → ce contrôleur expose des routes.
- `public class ArticleBddController {` → déclare la classe.
- `private final JdbcTemplate jdbcTemplate;` → outil SQL injecté par Spring.
- `public ArticleBddController(JdbcTemplate jdbcTemplate) {` → constructeur : Spring passe le `JdbcTemplate` connecté à `java_blog`.
- `this.jdbcTemplate = jdbcTemplate;` → stocke l'outil.
- `@GetMapping("/articles/recents")` → **la route** : `GET /articles/recents`.
- `public List<ArticleBdd> cinqDerniers() {` → méthode appelée quand on visite cette URL. Elle renvoie une liste d'`ArticleBdd`.
- `return jdbcTemplate.query(` → exécute une requête SQL et transforme chaque ligne en objet Java.
- `""" SELECT … """` → la requête SQL (la même que dans pgAdmin, étape 5).
- `(rs, rowNum) -> {` → pour **chaque ligne** du résultat SQL, on fabrique un `ArticleBdd`.  
  `rs` = la **ligne courante** du tableau (comme une ligne dans pgAdmin). `rowNum` = numéro de ligne (souvent ignoré).
- `Timestamp timestamp = rs.getTimestamp("date");` → lit la colonne `date`.
- `LocalDateTime date = timestamp != null ? timestamp.toLocalDateTime() : null;` → convertit en `LocalDateTime` (ou `null` si pas de date).
- `return new ArticleBdd(...)` → crée l'objet Java à partir des colonnes de la ligne.
- `rs.getInt("id")` → lit la colonne `id` comme entier.
- `rs.getString("titre")` → lit `titre` comme texte.
- `rs.getBoolean("statut")` → lit `statut` comme booléen (devient `publie` dans l'objet).
- `}` → ferme la transformation d'une ligne.
- `);` → ferme `jdbcTemplate.query`.
- `}` → ferme la méthode.

> 💡 **Fil de la route :** URL `/articles/recents` → méthode `cinqDerniers()` → SQL → liste d'`ArticleBdd` → JSON automatique.

---

## 9. Tester la route

Lance l'application :

```bash
./mvnw spring-boot:run
```

Ouvre **http://localhost:8080/articles/recents**

**Résultat attendu** (exemple) :

```json
[
  {"id":12,"titre":"…","contenu":"…","publie":true,"date":"2026-02-15T09:00:00"},
  {"id":11,"titre":"…","contenu":"…","publie":true,"date":"2026-02-13T08:00:00"},
  …
]
```

**Vérifications :**

1. Tu as **5 objets** dans le tableau JSON.
2. Le premier a la **date la plus récente** (comme dans pgAdmin).
3. `/articles` (partie 01) fonctionne **toujours** — ce sont les articles en dur, pas ceux de la base.

> ✅ **Todo :** 5 articles en JSON, ordre cohérent avec pgAdmin.

---

## 10. Schéma de la route

```
GET /articles/recents
        |
        v
ArticleBddController.cinqDerniers()
        |
        v
JdbcTemplate.query( SQL avec ORDER BY + LIMIT 5 )
        |
        v
PostgreSQL — table articles
        |
        v
List<ArticleBdd>  →  JSON dans le navigateur
```

---

## 11. Enregistrer l'étape dans Git

Tu as ajouté `ArticleBdd` et `ArticleBddController`. Committe sur **`partie-02`** :

```bash
git status
git add .
git commit -m "02-04 — Route /articles/recents : ArticleBdd + SQL ORDER BY LIMIT"
git log --oneline
```

> ✅ **Vérifie :** `git branch` affiche `* partie-02` et ton commit apparaît dans `git log`.

---

## 🆘 En cas de problème

| Ce que tu vois | Pourquoi | Quoi faire |
|---|---|---|
| Whitelabel Error Page | Mauvaise URL | `http://localhost:8080/articles/recents` (avec un **s**) |
| `[]` (tableau vide) | Table `articles` vide | Exécute `doc/blog.sql` |
| Erreur SQL au démarrage | Faute dans la requête | Compare avec l'étape 5 pgAdmin |
| JSON sans `id` ou `date` | Getters manquants | Vérifie `getId()`, `getDate()` dans `ArticleBdd` |
| `Connection refused` | PostgreSQL arrêté | Démarre PostgreSQL |
| Confusion avec `/articles` | Deux routes différentes | `/articles` = en dur ; `/articles/recents` = base |
| `error: pathspec 'partie-02'` | Mauvaise branche | `git checkout partie-02` |

---

## 🏋️ Exercices

1. Modifie `LIMIT 5` en `LIMIT 3` : vérifie que le JSON ne contient plus que 3 articles.
2. Ajoute une route `GET /articles/recents/count` qui renvoie **uniquement un nombre** : le nombre de lignes que renverrait la requête des récents (5 si la table en contient au moins 5, sinon le total). Indice : `SELECT COUNT(*) FROM (SELECT id FROM articles ORDER BY date DESC, id DESC LIMIT 5) AS sub`.
3. **Bonus :** route `GET /articles/recents/publies` — les 5 derniers articles avec `statut = true` uniquement (ajoute `WHERE statut = true`).

---

## Corrigés des exercices

> 📘 **À lire après avoir essayé.** Retourne au support et tente d'abord — c'est là que se fait l'apprentissage.

### Corrigé 1 — `LIMIT 3`

Dans **`ArticleBddController.java`**, change la dernière ligne de la requête :

```sql
                LIMIT 3
```

**Vérification :** `http://localhost:8080/articles/recents` ne renvoie plus que **3** objets JSON.

### Corrigé 2 — `/articles/recents/count`

Ajoute une méthode dans **`ArticleBddController.java`** :

```java
    @GetMapping("/articles/recents/count")
    public Integer compterRecents() {
        return jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM (
                    SELECT id FROM articles
                    ORDER BY date DESC, id DESC
                    LIMIT 5
                ) AS sub
                """,
                Integer.class
        );
    }
```

**Explication :**

- La **sous-requête** reprend exactement la logique des 5 récents (`ORDER BY` + `LIMIT 5`).
- `COUNT(*)` compte les lignes de cette sous-requête → **5** si la table en contient au moins 5, sinon le total (ex. 2 si seulement 2 articles).
- Le type de retour `Integer` → Spring renvoie un **nombre** brut dans le navigateur (pas un JSON objet).

**Vérification :** `http://localhost:8080/articles/recents/count` affiche par ex. `5`.

> 💡 **Ordre des URL :** `/articles/recents/count` est un chemin **fixe** sous `/articles/recents` — pas de conflit avec la route liste.

### Corrigé 3 — Bonus `/articles/recents/publies`

Ajoute une méthode dans le même contrôleur (tu peux **remettre `LIMIT 5`** dans `cinqDerniers()` si tu avais testé le corrigé 1) :

```java
    @GetMapping("/articles/recents/publies")
    public List<ArticleBdd> cinqDerniersPublies() {
        return jdbcTemplate.query(
                """
                SELECT id, titre, contenu, statut, date
                FROM articles
                WHERE statut = true
                ORDER BY date DESC, id DESC
                LIMIT 5
                """,
                (rs, rowNum) -> {
                    Timestamp timestamp = rs.getTimestamp("date");
                    LocalDateTime date = timestamp != null ? timestamp.toLocalDateTime() : null;
                    return new ArticleBdd(
                            rs.getInt("id"),
                            rs.getString("titre"),
                            rs.getString("contenu"),
                            rs.getBoolean("statut"),
                            date
                    );
                }
        );
    }
```

**Explication :**

- `WHERE statut = true` → ne garde que les articles **publiés** (brouillons exclus).
- Le reste est identique à `/articles/recents` : même `RowMapper`, même JSON.

**Vérification :** tous les objets renvoyés ont `"publie":true`. Compare avec pgAdmin :

```sql
SELECT id, titre, statut FROM articles
WHERE statut = true
ORDER BY date DESC, id DESC
LIMIT 5;
```

---

## ✅ Récapitulatif

Tu sais maintenant :

- [ ] Expliquer ce qu'est une **route** (méthode HTTP + chemin + méthode Java)
- [ ] Écrire une requête SQL avec **`ORDER BY`** et **`LIMIT`**
- [ ] Créer une route qui lit PostgreSQL et renvoie du **JSON**
- [ ] Séparer articles **en mémoire** (`Article`) et articles **en base** (`ArticleBdd`)
- [ ] **Committer** l'étape sur `partie-02`

---

## Suite

Étape suivante : **`partie-02-05-concevoir-les-routes.md`** (exercice sans code — concevoir toute l'API du blog). Consulte aussi **`INDEX.md`**.
