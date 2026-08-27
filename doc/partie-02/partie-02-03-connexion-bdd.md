# Partie 02 — Étape 03
# pgAdmin et connexion Spring Boot → PostgreSQL

> 📘 **Ce document est ton support.** On le déroule ensemble en cours, mais tu pourras le reprendre seul pour **tout refaire de ton côté**. Chaque ligne de code y est expliquée, imports compris.  
> 📋 **Ordre de tous les supports :** `INDEX.md`

## Ce que tu vas savoir faire à la fin de cette étape

- **Comprendre pgAdmin** : naviguer dans l'interface, lire une table, exécuter une requête SQL.
- Configurer la **première connexion** entre Spring Boot et PostgreSQL.
- Coder sur la branche Git **`partie-02`** et **committer** cette étape.
- **Prouver** que Java parle bien à la base avec l'endpoint `/db/ping`.

> 🧵 **Le fil rouge :** à la partie 01, les articles venaient du code Java. Ici, on pose le **câble** entre Spring Boot et PostgreSQL. On ne lit **pas encore** les articles dans `/articles` — ce sera l'étape 04.

> 🗺️ **Vue d'ensemble :** pour comprendre l'architecture de la partie 02 et le rôle de chaque fichier, voir **`partie-02-02-vue-ensemble-architecture.md`**.

> ⚙️ **Prérequis :** PostgreSQL, pgAdmin et branche `partie-02` → **`partie-02-01-install-postgresql-pgadmin.md`**. Ordre complet des docs → **`INDEX.md`**.

---

## Todo

Coche au fur et à mesure :

### Partie A — Comprendre pgAdmin

- [ ] Ouvrir pgAdmin et se connecter au serveur PostgreSQL
- [ ] Repérer la base `java_blog` dans l'arborescence
- [ ] Lister les tables du schéma `public`
- [ ] Afficher les données de la table `articles`
- [ ] Exécuter `SELECT COUNT(*) FROM articles` dans le Query Tool
- [ ] Noter les **4 paramètres de connexion** (hôte, port, base, utilisateur)

### Partie B — Première connexion Spring Boot → PostgreSQL

- [ ] Vérifier la branche Git `partie-02`
- [ ] Ajouter les dépendances JDBC + driver PostgreSQL dans `pom.xml`
- [ ] Configurer `application.yaml` (url, username, password)
- [ ] Configurer `src/test/resources/application.yaml` (PostgreSQL — pas H2)
- [ ] Créer `DatabaseController` avec `/db/ping`
- [ ] Lancer l'app et vérifier `http://localhost:8080/db/ping`
- [ ] Comparer le nombre affiché avec celui vu dans pgAdmin
- [ ] Committer l'étape sur `partie-02`

---

## 0. Avant de commencer : où on en est

> **Encadré continuité — de la partie 01 à la partie 02**  
> À la partie 01, tu as construit une API **en mémoire** : la classe `Article`, les routes `/ping` et `/articles`. Les articles étaient des **post-its dans le code**.  
> PostgreSQL contient déjà de **vrais articles** (`doc/blog.sql`). On pose le **câble JDBC** : d'abord `/db/ping` pour prouver la connexion, puis `/articles/recents` à l'étape 04.  
> Pour ne pas casser la partie 01, on introduira temporairement **`ArticleBdd`** (article lu en base).

À la partie 01, `/articles` renvoyait des articles créés **en dur** dans `ArticleController`. PostgreSQL existait peut-être déjà sur ta machine, mais Java **ne lui parlait pas**.

Ici, en deux temps :

1. **pgAdmin** — tu apprends à **voir** et **interroger** la base à la main.
2. **Spring Boot** — tu configures la **première connexion** automatique depuis Java.

```
Partie A (pgAdmin)          Partie B (Spring Boot)
     |                              |
  Tu explores                  Tu configures
  la base à la main            application.yaml
     |                              |
     v                              v
  SELECT COUNT(*)              GET /db/ping
  FROM articles          →     (même résultat)
```

> ✅ **Vérifie :** ton projet de la partie 01 démarre toujours (`./mvnw spring-boot:run`) et `/ping` répond `pong`.

---

# Partie A — Comprendre pgAdmin

## 1. C'est quoi pgAdmin ?

**pgAdmin** est l'outil graphique pour administrer **PostgreSQL**. C'est l'équivalent d'un « explorateur de fichiers », mais pour une **base de données** :

- tu **vois** les bases, les tables, les données ;
- tu **écris** du SQL pour interroger ou modifier la base ;
- tu **vérifies** que tout est en place avant de coder en Java.

> ❓ **PostgreSQL vs pgAdmin ?** **PostgreSQL** est le moteur qui **stocke** les données (il tourne en arrière-plan). **pgAdmin** est la **fenêtre** pour le regarder et lui parler en SQL.

---

## 2. Ouvrir pgAdmin et se connecter au serveur

1. Lance **pgAdmin 4** (icône éléphant).
2. Dans le panneau de gauche, déroule **Servers**.
3. Clique sur ton serveur (chez toi : **`serveur_bdd`**). Si un mot de passe est demandé, c'est celui de l'utilisateur `postgres`.
4. Une fois connecté, l'icône du serveur n'a plus de croix rouge.

> ✅ **Todo :** tu es connecté au serveur PostgreSQL.

---

## 3. Lire l'arborescence (le « chemin » vers tes données)

Dans le panneau de gauche, la hiérarchie ressemble à ceci :

```
Servers
└── serveur_bdd                    ← le serveur PostgreSQL (la machine)
    └── Databases
        └── java_blog              ← LA base de notre projet
            └── Schemas
                └── public         ← le schéma par défaut
                    └── Tables     ← les tableaux de données
                        ├── articles
                        ├── users
                        ├── commentaires
                        ├── catégories
                        ├── médias
                        ├── articles_categories
                        └── articles_medias
```

**Vocabulaire à retenir :**

| Élément pgAdmin | Analogie | Chez nous |
|---|---|---|
| **Server** | L'ordinateur qui héberge PostgreSQL | `serveur_bdd` / `localhost` |
| **Database** | Un « dossier » de données isolé | `java_blog` |
| **Schema** | Un sous-dossier logique dans la base | `public` |
| **Table** | Un tableau (lignes + colonnes) | `articles`, `users`… |
| **Row** (ligne) | Un enregistrement | Un article précis |
| **Column** (colonne) | Un champ | `titre`, `contenu`, `statut`… |

> ✅ **Todo :** tu vois bien `java_blog → Schemas → public → Tables`.

---

## 4. Si la base `java_blog` n'existe pas encore

Si tu ne vois pas `java_blog` sous **Databases** :

1. Clic droit sur **Databases** → **Create** → **Database…**
2. Nom : `java_blog` → **Save**
3. Clic droit sur `java_blog` → **Query Tool**
4. Ouvre le fichier **`doc/blog.sql`** du projet dans un éditeur de texte
5. Copie tout le contenu, colle-le dans le Query Tool
6. Clique sur le bouton **▶ Execute** (ou `F5`)

Tu dois voir un message de succès. Rafraîchis l'arborescence : les tables apparaissent.

> ✅ **Todo :** la base `java_blog` existe avec au moins la table `articles`.

---

## 5. Explorer la table `articles` sans SQL

1. Déroule **Tables** sous `public`
2. Clic droit sur **`articles`**
3. Choisis **View/Edit Data** → **All Rows**

Tu vois un tableau avec les colonnes :

| Colonne | Signification |
|---|---|
| `id` | Identifiant unique (clé primaire) |
| `titre` | Titre de l'article |
| `contenu` | Texte de l'article |
| `date` | Date de création |
| `statut` | `true` = publié, `false` = brouillon |
| `update` | Date de dernière modification |
| `user_id` | Lien vers l'auteur (table `users`) |

> 💡 **Lien avec la partie 01 :** tu avais `titre`, `contenu`, `publie` en Java. En base, c'est `titre`, `contenu`, `statut`. Même idée, noms légèrement différents.

> ✅ **Todo :** tu vois au moins une ligne (ex. « Introduction à PostgreSQL »).

---

## 6. Exécuter ta première requête SQL (Query Tool)

Le **Query Tool** est l'endroit où tu écris du **SQL** à la main.

1. Clic droit sur la base **`java_blog`** → **Query Tool**
2. Tape cette requête :

```sql
SELECT COUNT(*) FROM articles;
```

3. Clique **▶ Execute** (ou `F5`)

**Résultat attendu :** un nombre (ex. `3`) dans l'onglet **Data Output**.

**Explication de la requête :**

- `SELECT` → « je veux récupérer… »
- `COUNT(*)` → « …le **nombre** de lignes »
- `FROM articles` → « …dans la table `articles` »

**Autres requêtes utiles pour explorer :**

```sql
-- Voir tous les titres
SELECT id, titre, statut FROM articles;

-- Compter les utilisateurs
SELECT COUNT(*) FROM users;

-- Voir la version de PostgreSQL
SELECT version();
```

> 📝 **Important :** note le résultat de `SELECT COUNT(*) FROM articles` sur un papier ou un post-it. Tu le reverras tout à l'heure dans le navigateur via `/db/ping`.

> ✅ **Todo :** `SELECT COUNT(*) FROM articles` renvoie un nombre ≥ 1.

---

## 7. Retenir les paramètres de connexion (pour Java)

Pour que Spring Boot se connecte, il a besoin des mêmes informations que toi dans pgAdmin :

| Paramètre | Où le trouver | Valeur typique en local |
|---|---|---|
| **Hôte** (host) | Propriétés du serveur | `localhost` |
| **Port** | Propriétés du serveur | `5432` |
| **Base** (database) | Nom sous Databases | `java_blog` |
| **Utilisateur** | Utilisateur de connexion | `postgres` |
| **Mot de passe** | Celui saisi à la connexion | *(le tien)* |

Spring regroupe tout ça dans une **URL JDBC** :

```
jdbc:postgresql://localhost:5432/java_blog
```

Décomposition :

| Morceau | Signification |
|---|---|
| `jdbc:postgresql://` | Protocole JDBC pour PostgreSQL |
| `localhost` | Le serveur (ta machine) |
| `5432` | Le port |
| `java_blog` | Le nom de la base |

> ❓ **C'est quoi JDBC ?** L'API standard Java pour parler à une base de données. Le **driver PostgreSQL** (qu'on ajoutera dans Maven) traduit les appels Java vers PostgreSQL.

> ✅ **Todo :** tu as noté hôte, port, base, utilisateur et mot de passe.

---

# Partie B — Première connexion Spring Boot → PostgreSQL

Maintenant que tu **connais** la base dans pgAdmin, on branche Java dessus.

## 8. Vérifier la branche Git `partie-02`

La branche **`partie-02`** a été **créée** dans `partie-02-01-install-postgresql-pgadmin.md`. Avant de modifier le code Java, assure-toi d'être dessus.

Ouvre un terminal **à la racine du projet** (là où se trouve `pom.xml`) :

```bash
git branch
```

Résultat attendu (l'étoile `*` indique la branche active) :

```
  main
  partie-01
* partie-02
```

Si tu n'es **pas** sur `partie-02` :

```bash
git checkout partie-02
```

> ❓ **Pourquoi cette branche ?** `partie-01` reste figée (API en mémoire). Tout le code PostgreSQL / JDBC de la partie 02 vit sur **`partie-02`**.

> ⚠️ **Branche introuvable ?** Retourne à `partie-02-01-install-postgresql-pgadmin.md`, section 10.

> 💡 **Revenir à la partie 01 :** `git checkout partie-01` — tu retrouves le code sans JDBC ni `DatabaseController`.

### Modifications non sauvegardées

Si Git refuse le changement de branche (*« Your local changes would be overwritten »*) :

```bash
git add .
git commit -m "WIP partie 02"
git checkout partie-02
```

> ✅ **Todo :** `git branch` affiche `* partie-02`.

---

## 9. Ajouter les dépendances Maven

Ouvre **`pom.xml`**. Dans `<dependencies>`, **après** `spring-boot-starter-web` (dépendance « Spring Web » ajoutée à l'Initializr), ajoute :

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jdbc</artifactId>
</dependency>

<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>
```

**Explication ligne par ligne :**

- `<dependency>` → décrit une bibliothèque dont le projet a besoin.
- `<groupId>org.springframework.boot</groupId>` → l'organisation Spring.
- `<artifactId>spring-boot-starter-jdbc</artifactId>` → le starter **JDBC** : il configure automatiquement la connexion et fournit **`JdbcTemplate`**, un outil pour exécuter du SQL depuis Java.
- `</dependency>` → ferme le premier bloc.
- `<groupId>org.postgresql</groupId>` → l'organisation PostgreSQL.
- `<artifactId>postgresql</artifactId>` → le **driver JDBC** : le traducteur Java ↔ PostgreSQL.
- `<scope>runtime</scope>` → nécessaire quand l'application **tourne** (dev **et** tests).
- `</dependency>` → ferme le second bloc.

> 💡 **Pas de H2** — on reste 100 % PostgreSQL (dev, tests, CI en partie 06).

> ❓ **Pourquoi pas JPA tout de suite ?** JPA (`@Entity`, repositories…) viendra plus tard. Aujourd'hui, on pose juste le **câble** avec JDBC.

Sauvegarde. Attends la fin de l'import Maven.

> ✅ **Todo :** plus de soulignement rouge sur `pom.xml`.

---

## 10. Configurer `application.yaml` — les identifiants de connexion

Ouvre **`src/main/resources/application.yaml`**. Remplace son contenu par :

```yaml
spring:
  application:
    name: java_blog
  datasource:
    url: jdbc:postgresql://localhost:5432/java_blog
    username: postgres
    password: ${POSTGRES_PASSWORD:postgres}
```

**Explication ligne par ligne :**

- `spring:` → configuration Spring Boot. L'**indentation** compte (espaces, pas de tabulations).
- `application:` → sous-section « application ».
- `name: java_blog` → nom informatif de l'application.
- `datasource:` → la **source de données** : comment Java se connecte à PostgreSQL. C'est ici que tu recopies les paramètres notés à l'étape 7.
- `url: jdbc:postgresql://localhost:5432/java_blog` → l'URL JDBC complète.
- `username: postgres` → l'utilisateur (le même que dans pgAdmin).
- `password: ${POSTGRES_PASSWORD:postgres}` → le mot de passe. `${POSTGRES_PASSWORD:postgres}` signifie : « utilise la variable d'environnement `POSTGRES_PASSWORD` si elle existe, sinon `postgres` ».

> 💡 **Mot de passe différent de `postgres` ?**

```bash
# macOS / Linux — dans le terminal, avant de lancer l'app
export POSTGRES_PASSWORD="ton_mot_de_passe"
./mvnw spring-boot:run
```

> ✅ **Todo :** fichier sauvegardé, les valeurs correspondent à ton pgAdmin.

---

## 10 bis. Configurer les tests (`src/test/resources/application.yaml`)

Quand tu lances **`./mvnw test`**, Spring utilise un **autre** fichier de configuration — pas celui de `src/main/resources/`. Ici aussi : **PostgreSQL**, pas H2.

> ⚠️ **Prérequis :** PostgreSQL **allumé** avec la base **`java_blog`** (comme pour `./mvnw spring-boot:run`).

Crée (ou remplace) **`src/test/resources/application.yaml`** :

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/java_blog
    username: postgres
    password: ${POSTGRES_PASSWORD:postgres}
```

**Explication :**

- Mêmes paramètres que le fichier **main** — suffisant tant que les tests ne font que `contextLoads()`.
- Ce fichier **n'affecte pas** `./mvnw spring-boot:run` — seulement les tests.
- En **partie 06**, on basculera sur une base dédiée **`java_blog_test`** + profil `@ActiveProfiles("test")` + seed SQL.

> 💡 Rappel : voir aussi `partie-02-02-vue-ensemble-architecture.md`, section sur les deux `application.yaml`.

> ✅ **Todo :** PostgreSQL lancé ; `./mvnw test` passe sans erreur de connexion BDD.

---

## 11. Créer `/db/ping` — la première requête Java vers la base

On va exécuter **la même requête** que dans pgAdmin (`SELECT COUNT(*) FROM articles`), mais cette fois **depuis Java**.

Dans `src/main/java/fr/ada/java_blog/controller/`, crée **`DatabaseController.java`** :

```java
package fr.ada.java_blog.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DatabaseController {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/db/ping")
    public String ping() {
        Integer nombreArticles = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM articles",
                Integer.class
        );
        return "connexion ok — " + nombreArticles + " article(s) en base";
    }
}
```

**Explication ligne par ligne :**

- `package fr.ada.java_blog.controller;` → cette classe est dans le package `controller`.
- `import org.springframework.jdbc.core.JdbcTemplate;` → importe **`JdbcTemplate`**, l'outil Spring pour exécuter du SQL (équivalent du Query Tool, mais en Java).
- `import org.springframework.web.bind.annotation.GetMapping;` → importe `@GetMapping`.
- `import org.springframework.web.bind.annotation.RestController;` → importe `@RestController`.
- `@RestController` → cette classe répond à des requêtes web.
- `public class DatabaseController {` → déclare la classe.
- `private final JdbcTemplate jdbcTemplate;` → attribut qui stockera l'outil SQL. `final` = assigné une seule fois.
- `public DatabaseController(JdbcTemplate jdbcTemplate) {` → constructeur. Spring l'appelle au démarrage et y passe un `JdbcTemplate` **déjà connecté** à ta base (grâce au `application.yaml`). C'est l'**injection de dépendances**.
- `this.jdbcTemplate = jdbcTemplate;` → range l'objet reçu dans l'attribut.
- `}` → ferme le constructeur.
- `@GetMapping("/db/ping")` → associe la méthode à l'URL **`/db/ping`**.
- `public String ping() {` → déclare la méthode `ping`, qui renvoie du texte.
- `Integer nombreArticles = jdbcTemplate.queryForObject(` → exécute une requête SQL et récupère un seul résultat.
- `"SELECT COUNT(*) FROM articles",` → **la même requête** que tu as tapée dans pgAdmin à l'étape 6.
- `Integer.class` → on attend un nombre entier en retour.
- `);` → ferme l'appel.
- `return "connexion ok — " + nombreArticles + " article(s) en base";` → construit le message affiché dans le navigateur.
- `}` → ferme la méthode.
- `}` → ferme la classe.

> 💡 **pgAdmin vs Java :** même SQL, deux outils différents. pgAdmin = interface graphique. `JdbcTemplate` = depuis ton code Spring Boot.

> ✅ **Todo :** le fichier compile sans erreur rouge.

---

## 12. Lancer l'app — ta première connexion est réelle quand `/db/ping` répond

PostgreSQL doit être **démarré** (pgAdmin connecté = bon signe). Puis :

```bash
./mvnw spring-boot:run
```

Attends dans le terminal :

```
Started JavaBlogApplication in ... seconds
```

Ouvre **http://localhost:8080/db/ping**.

Tu dois lire :

```
connexion ok — 3 article(s) en base
```

**Le nombre doit être identique** à celui de `SELECT COUNT(*) FROM articles` dans pgAdmin (étape 6).

| Outil | Requête | Résultat attendu |
|---|---|---|
| pgAdmin (Query Tool) | `SELECT COUNT(*) FROM articles` | `3` |
| Navigateur (`/db/ping`) | *(Java exécute la même requête)* | `connexion ok — 3 article(s) en base` |

🎉 **C'est ta première connexion Java → PostgreSQL qui fonctionne.**

> ✅ **Todo :** `/db/ping` affiche `connexion ok` avec le **même** nombre qu'en pgAdmin.

### Ce qui ne change pas à cette étape

- **`/articles`** renvoie toujours les articles **en dur** de la partie 01. Normal : on a branché le câble, pas encore la lecture des articles.
- **`Article.java`** n'a pas bougé. Pas de `@Entity` ici.

---

## 13. Enregistrer l'étape dans Git

Tu as codé la connexion BDD. Il faut **figer** ce travail sur la branche **`partie-02`**.

```bash
git status
git add .
git commit -m "02-03 — Connexion PostgreSQL : JDBC, application.yaml, /db/ping"
git log --oneline
```

**Explication :**

- `git status` → liste les fichiers modifiés (`pom.xml`, `application.yaml`, `DatabaseController.java`…).
- `git add .` → prépare tous les changements.
- `git commit -m "..."` → enregistre l'instantané sur `partie-02`.

Tu dois voir au moins **un commit de plus** sur `partie-02` par rapport à la fin de la partie 01.

> ✅ **Vérifie :** `git branch` affiche `* partie-02` et `git log --oneline` montre ton commit.

---

## 14. Schéma récapitulatif

```
pgAdmin (Partie A)                    Spring Boot (Partie B)
      |                                       |
 Query Tool                          DatabaseController
      |                                       |
 SELECT COUNT(*)                      JdbcTemplate
 FROM articles                              |
      |                              même requête SQL
      v                                       v
  PostgreSQL  <─────── JDBC ──────────  PostgreSQL
  (java_blog)         (câble)           (java_blog)
```

---

## 🆘 En cas de problème

| Ce que tu vois | Pourquoi | Quoi faire |
|---|---|---|
| pgAdmin : impossible de se connecter | PostgreSQL arrêté | Démarre le service PostgreSQL, réessaie |
| pgAdmin : base `java_blog` absente | Base non créée | Étape 4 : exécute `doc/blog.sql` |
| `Connection refused` (Java) | PostgreSQL arrêté ou mauvais port | Vérifie `localhost:5432` |
| `password authentication failed` | Mauvais mot de passe | Corrige le yaml ou `export POSTGRES_PASSWORD=...` |
| `relation "articles" does not exist` | Tables absentes | Exécute `doc/blog.sql` dans pgAdmin |
| `/db/ping` : nombre différent de pgAdmin | Données modifiées entre-temps | Relance la requête dans pgAdmin et compare |
| `Port 8080 was already in use` | Une app tourne déjà | `Ctrl+C` sur l'ancienne |
| Page Whitelabel sur `/db/ping` | URL incorrecte ou fichier non sauvegardé | Vérifie l'URL et recompile |
| `./mvnw test` échoue (connexion BDD) | Fichier test `application.yaml` manquant | Étape 10 bis |
| `error: pathspec 'partie-02' did not match` | Branche non créée | Reprends `partie-02-01`, section 10 |

---

## 🏋️ Exercices

1. Dans pgAdmin, exécute `SELECT id, titre FROM articles` et retrouve ces titres… ailleurs dans le projet (indice : pas encore dans `/articles` — où pourraient-ils être un jour ?).
2. Modifie `/db/ping` pour afficher aussi le nombre d'utilisateurs : `SELECT COUNT(*) FROM users`.
3. **Bonus :** ajoute `/db/version` avec `SELECT version()`.

---

## Corrigés des exercices

> 📘 **À lire après avoir essayé.** Retourne au support et tente d'abord — c'est là que se fait l'apprentissage.

### Corrigé 1 — Où sont les titres des articles ?

Les titres que tu vois dans pgAdmin (`SELECT id, titre FROM articles`) viennent du script **`doc/blog.sql`** (bloc `INSERT INTO articles`).

Ils **ne sont pas encore** dans `/articles` (partie 01 = liste en dur dans `ArticleController`). En revanche :

- dès l'**étape 04**, tu les verras dans **`/articles/recents`** ;
- à la **partie 03**, `/articles` lira aussi la base (plus de post-its en dur).

### Corrigé 2 — Afficher aussi le nombre d'utilisateurs

Dans **`DatabaseController.java`**, modifie la méthode `ping()` :

```java
    @GetMapping("/db/ping")
    public String ping() {
        Integer nombreArticles = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM articles",
                Integer.class
        );
        Integer nombreUsers = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users",
                Integer.class
        );
        return "connexion ok — " + nombreArticles + " article(s), "
                + nombreUsers + " utilisateur(s) en base";
    }
```

**Explication :**

- Deux appels `queryForObject` → deux requêtes SQL indépendantes.
- `SELECT COUNT(*) FROM users` → même principe que pour `articles`.
- Le message concatène les deux nombres.

**Vérification :** `http://localhost:8080/db/ping` affiche par ex. `connexion ok — 12 article(s), 4 utilisateur(s) en base` (les chiffres dépendent de `blog.sql`).

### Corrigé 3 — Bonus `/db/version`

Ajoute une **deuxième méthode** dans le même `DatabaseController` :

```java
    @GetMapping("/db/version")
    public String version() {
        return jdbcTemplate.queryForObject("SELECT version()", String.class);
    }
```

**Explication :**

- `SELECT version()` → fonction PostgreSQL qui renvoie la version du moteur (longue chaîne de texte).
- `queryForObject(..., String.class)` → Spring attend une seule valeur texte.

**Vérification :** `http://localhost:8080/db/version` affiche une ligne du type `PostgreSQL 16.x …`.

---

## ✅ Récapitulatif final

### pgAdmin

- [ ] Je sais naviguer : Serveur → Base → Schéma → Tables
- [ ] Je sais afficher les données d'une table
- [ ] Je sais exécuter une requête SQL dans le Query Tool
- [ ] Je connais les paramètres de connexion (hôte, port, base, user, mot de passe)

### Première connexion Java

- [ ] Je suis sur la branche `partie-02`
- [ ] J'ai configuré `application.yaml` avec l'URL JDBC
- [ ] J'ai configuré `src/test/resources/application.yaml` (PostgreSQL)
- [ ] J'ai ajouté JDBC + PostgreSQL dans `pom.xml` (sans H2)
- [ ] `/db/ping` renvoie `connexion ok` avec le bon nombre d'articles
- [ ] J'ai **commité** l'étape sur `partie-02`

---

## Suite

Consulte **`INDEX.md`** pour l'étape suivante : `partie-02-04-premiere-route-bdd.md` — toujours sur la branche **`partie-02`**.
