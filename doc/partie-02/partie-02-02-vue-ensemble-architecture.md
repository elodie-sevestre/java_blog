# Partie 02 — Étape 02
# Vue d'ensemble — architecture et rôle des fichiers

> 📘 **Document optionnel (~10 min).** Il complète `partie-02-03-connexion-bdd.md` et `partie-02-04-premiere-route-bdd.md`. Lis-le **avant** ou **après** pour te repérer dans le projet.  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> 🌿 **Branche Git :** tu dois être sur **`partie-02`** (créée dans `partie-02-01-install-postgresql-pgadmin.md`).

---

## 1. L'évolution du projet

| Moment | Ce qu'on ajoute | Métaphore |
|---|---|---|
| **Partie 01** | API en mémoire (`/ping`, `/articles`) | Des articles écrits sur un post-it |
| **Partie 02 — étape 03** | Connexion PostgreSQL (`/db/ping`) | On pose le **câble** vers la base |
| **Partie 02 — étape 04** | Première route qui lit la base (`/articles/recents`) | On **envoie** de vraies données dans l'API |

> 💡 **Plus tard (partie 03) :** on rangera le code en couches (repository, DTO…) puis on automatisera le SQL avec JPA (partie 04).

---

## 2. Architecture globale

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NAVIGATEUR (port 8080)                          │
│   /ping   /articles   /articles/{n}   /db/ping   /articles/recents     │
└──────┬─────────┬──────────────┬────────────┬──────────────┬───────────┘
       │         │              │            │              │
       ▼         ▼              ▼            ▼              ▼
┌──────────┐ ┌──────────────┐              ┌──────────────┐ ┌─────────────────┐
│  Ping    │ │   Article    │              │  Database    │ │   ArticleBdd    │
│Controller│ │ Controller   │              │ Controller   │ │  Controller     │
└────┬─────┘ └──────┬───────┘              └──────┬───────┘ └────────┬────────┘
     │              │                             │                  │
     │         Article, Auteur                    │                  │
     │         (en mémoire — partie 01)           │                  │
     │              │                             │                  │
     │              │                      JdbcTemplate ◄────────────┘
     │              │                             │
     │              │                             ▼
     │              │              ┌──────────────────────────┐
     │              │              │   application.yaml       │
     │              │              │   (url, user, password)    │
     │              │              └─────────────┬────────────┘
     │              │                            │
     │              │                            ▼
     │              │              ┌──────────────────────────┐
     │              │              │   PostgreSQL :5432       │
     │              │              │   base java_blog         │
     │              │              │   table articles, …      │
     │              │              └──────────────────────────┘
     ▼              ▼
  "pong"      JSON en dur
```

**Comment lire ce schéma :**

- **À gauche** (`PingController`, `ArticleController`) : routes de la **partie 01** — données **en mémoire**, dans le code Java. **Aucun passage par PostgreSQL.**
- **À droite** (`DatabaseController`, `ArticleBddController`) : routes de la **partie 02** — données lues **en base** via **`JdbcTemplate`** (classe Spring qui exécute du SQL à notre place ; voir aussi `annexe-01-glossaire.md`).
- **Au centre du chemin BDD :** `application.yaml` contient les identifiants de connexion (équivalent de ce que tu as saisi dans pgAdmin).
- **Spring Boot** (non dessiné) écoute sur le port **8080** : il reçoit l'URL du navigateur, appelle la **bonne méthode** du **bon controller**, puis renvoie la réponse (texte ou JSON). C'est le même principe qu'à la partie 01 — on ajoute seulement de nouvelles routes et une connexion BDD.

> ⚠️ **Piège classique :** le port **5432** = PostgreSQL (pas une page web). Le navigateur parle **toujours** à Spring Boot sur le port **8080** ; c'est Spring qui parle à PostgreSQL en interne.

---

## 3. Arborescence du projet (partie 02)

```
java_blog/
├── pom.xml                              ← Maven : dépendances (Web, JDBC, PostgreSQL…)
├── doc/
│   ├── blog.sql
│   ├── INDEX.md
│   ├── partie-01-01-installation-spring-boot.md
│   ├── annexe-01-glossaire.md
│   ├── partie-01-02-corriges-exercices.md
│   ├── partie-02-01-install-postgresql-pgadmin.md
│   ├── partie-02-02-vue-ensemble-architecture.md   ← CE fichier
│   ├── partie-02-03-connexion-bdd.md
│   ├── partie-02-04-premiere-route-bdd.md
│   ├── partie-02-05-concevoir-les-routes.md
│   ├── partie-02-06-corrige-routes-blog.md
│   └── …
└── src/
    ├── main/
    │   ├── java/fr/ada/java_blog/
    │   │   ├── JavaBlogApplication.java
    │   │   ├── controller/
    │   │   │   ├── PingController.java           ← partie 01 : GET /ping
    │   │   │   ├── ArticleController.java        ← partie 01 : GET /articles (en dur)
    │   │   │   ├── DatabaseController.java       ← partie 02 : GET /db/ping
    │   │   │   └── ArticleBddController.java     ← partie 02 : GET /articles/recents
    │   │   └── model/
    │   │       ├── Article.java                  ← partie 01 : article en mémoire
    │   │       ├── Auteur.java                   ← partie 01 : auteur en mémoire
    │   │       ├── ArticleBdd.java               ← partie 02 : article lu en base
    │   │       └── Demo.java                     ← partie 01 : tests console (main)
    │   └── resources/
    │       └── application.yaml                  ← partie 02 : connexion PostgreSQL
    └── test/
        └── resources/
            └── application.yaml                  ← PostgreSQL (même moteur qu'en dev — voir 02-03)
```

**Organisation des packages Java :**

| Dossier | Rôle | Règle simple |
|---|---|---|
| `controller/` | Routes HTTP (URL → méthode Java) | Une classe = un sujet (`Article`, base de données…) |
| `model/` | Données métier (`Article`, `ArticleBdd`…) | Pas de SQL ici — juste des champs + getters |

**Deux fichiers `application.yaml` — ne pas les confondre :**

| Fichier | Quand il s'applique | Contenu |
|---|---|---|
| `src/main/resources/application.yaml` | Quand tu lances l'app (`./mvnw spring-boot:run`) | Connexion **PostgreSQL** (vraie base) |
| `src/test/resources/application.yaml` | Quand tu lances les tests (`./mvnw test`) | Connexion **PostgreSQL** — PostgreSQL doit être **lancé** |

> 💡 **Pourquoi PostgreSQL aussi pour les tests ?** On reste sur le **même moteur SQL** qu'en dev et en prod — pas de surprise « ça marche en test, pas en vrai ». Tant que les tests se limitent à `contextLoads()`, la base **`java_blog`** suffit. En **partie 06**, on créera une base dédiée **`java_blog_test`** + seed automatique.

---

## 4. Tableau des fichiers : rôle de chacun

### Fichiers de la partie 01 (inchangés)

| Fichier | Rôle |
|---|---|
| `JavaBlogApplication.java` | Point de départ : lance Spring Boot et le serveur web |
| `PingController.java` | Route `GET /ping` → renvoie `"pong"` |
| `ArticleController.java` | Routes `GET /articles` et `/articles/{numero}` → articles **codés en dur** |
| `Article.java` | Modèle « post-it » : `titre`, `contenu`, `publie` |
| `Auteur.java` | Modèle auteur en mémoire : `nom`, `email` |
| `Demo.java` | Exercices console (`main` séparé) |

### Fichiers ajoutés en partie 02

| Fichier | Ajouté | Rôle |
|---|---|---|
| `pom.xml` | Étape 03 | + `spring-boot-starter-jdbc` + driver `postgresql` |
| `application.yaml` | Étape 03 | Configure `datasource` : URL, utilisateur, mot de passe |
| `DatabaseController.java` | Étape 03 | Route `GET /db/ping` → teste la connexion (`COUNT(*)` sur `articles`) |
| `ArticleBdd.java` | Étape 04 | Modèle article **depuis la base** : `id`, `titre`, `contenu`, `publie`, `date` |
| `ArticleBddController.java` | Étape 04 | Route `GET /articles/recents` → 5 derniers articles (SQL `ORDER BY` + `LIMIT`) |
| `src/test/resources/application.yaml` | Étape 03 | PostgreSQL pour `./mvnw test` (PostgreSQL allumé) |

---

## 5. Toutes les routes de l'application

| Route | Méthode | Contrôleur | Données | Depuis |
|---|---|---|---|---|
| `/ping` | GET | `PingController` | Texte `"pong"` | Partie 01 |
| `/articles` | GET | `ArticleController` | Liste JSON (en dur) | Partie 01 |
| `/articles/{numero}` | GET | `ArticleController` | Un article par position 0, 1, 2… | Partie 01 |
| `/db/ping` | GET | `DatabaseController` | `"connexion ok — N article(s) en base"` | Partie 02 |
| `/articles/recents` | GET | `ArticleBddController` | 5 articles JSON depuis PostgreSQL | Partie 02 |

---

## 6. Deux mondes : mémoire vs base de données

Pour l'instant, le projet utilise **deux modèles** pour un article :

| | `Article` (partie 01) | `ArticleBdd` (partie 02) |
|---|---|---|
| **Où vivent les données ?** | En mémoire (dans le code Java) | Dans PostgreSQL |
| **Utilisé par** | `ArticleController` | `ArticleBddController` |
| **Champs** | `titre`, `contenu`, `publie` | `id`, `titre`, `contenu`, `publie`, `date` |
| **Route** | `/articles` | `/articles/recents` |

> 💡 **Pourquoi deux classes en partie 02 ?** Pour ne pas casser la partie 01 et bien séparer « exercice en mémoire » et « lecture en base ». Plus tard, on fusionnera en un seul modèle `Article` et on sortira le SQL du contrôleur.

---

## 7. Parcours d'une requête (partie 02)

> 📖 **`JdbcTemplate` en bref :** objet Spring créé automatiquement grâce à `application.yaml`. Tu lui passes du SQL ; il l'envoie à PostgreSQL et te renvoie le résultat. C'est le pendant programmatique du Query Tool de pgAdmin.

### Connexion — `GET /db/ping`

```
1. Navigateur → http://localhost:8080/db/ping
2. Spring appelle DatabaseController.ping()
3. JdbcTemplate exécute : SELECT COUNT(*) FROM articles
4. PostgreSQL renvoie un nombre (ex. 12)
5. Java renvoie : "connexion ok — 12 article(s) en base"
```

### Première lecture — `GET /articles/recents`

```
1. Navigateur → http://localhost:8080/articles/recents
2. Spring appelle ArticleBddController.cinqDerniers()
3. JdbcTemplate exécute :
   SELECT id, titre, contenu, statut, date
   FROM articles ORDER BY date DESC LIMIT 5
4. PostgreSQL renvoie 5 lignes
5. Chaque ligne devient un objet ArticleBdd
6. Spring transforme la liste en JSON
```

---

## 8. Fichiers de configuration

### `pom.xml` — les bibliothèques

| Dépendance | Rôle |
|---|---|
| `spring-boot-starter-web` | Serveur web + contrôleurs (partie 01) |
| `spring-boot-starter-jdbc` | Connexion BDD + `JdbcTemplate` (partie 02) |
| `postgresql` | Driver JDBC pour PostgreSQL (partie 02 — dev **et** tests) |

### `application.yaml` — la connexion *(fichier `src/main/resources/`)*

| Clé | Valeur | Équivalent pgAdmin |
|---|---|---|
| `datasource.url` | `jdbc:postgresql://localhost:5432/java_blog` | Hôte + port + base |
| `datasource.username` | `postgres` | Utilisateur de connexion |
| `datasource.password` | `${POSTGRES_PASSWORD:postgres}` | Mot de passe |

> 💡 **`${POSTGRES_PASSWORD:postgres}`** : Spring lit d'abord la variable d'environnement `POSTGRES_PASSWORD` ; si elle n'existe pas, il utilise `postgres` par défaut.

---

## 9. Où lire le détail ?

| Sujet | Document |
|---|---|
| **Ordre de tous les supports** | `INDEX.md` |
| Installation PostgreSQL + branche Git | `partie-02-01-install-postgresql-pgadmin.md` |
| pgAdmin, JDBC, `/db/ping` | `partie-02-03-connexion-bdd.md` |
| Notion de route, `/articles/recents` | `partie-02-04-premiere-route-bdd.md` |
| Concevoir l'API (sans code) | `partie-02-05-concevoir-les-routes.md` |
| Corrigé routes (formateur) | `partie-02-06-corrige-routes-blog.md` |
| Vue d'ensemble (ce fichier) | `partie-02-02-vue-ensemble-architecture.md` |
| Bases Java / Spring (partie 01) | `partie-01-01-installation-spring-boot.md` |

---

## 10. Récapitulatif formateur

**Partie 02 en une phrase :** on connecte Spring Boot à PostgreSQL, puis on crée la première route qui lit de vraies lignes — sans toucher aux routes de la partie 01.

**Fichiers clés à montrer en live :**
1. `application.yaml` (connexion)
2. `DatabaseController.java` (preuve du câble)
3. `ArticleBdd.java` + `ArticleBddController.java` (première vraie route BDD)

**Branche Git :** tout le code de la partie 02 est sur **`partie-02`**.
