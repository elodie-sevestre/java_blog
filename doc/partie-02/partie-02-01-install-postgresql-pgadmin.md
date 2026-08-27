# Partie 02 — Étape 01
# Installer PostgreSQL et pgAdmin

> 📘 **Prérequis de la partie 02** (en classe ou à la maison). Sans PostgreSQL et pgAdmin, tu ne pourras pas suivre la suite (`partie-02-03-connexion-bdd.md`).  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> **Rappel partie 01 :** ton API `/ping` et `/articles` (en mémoire) doit toujours fonctionner — on **ajoute** PostgreSQL sans tout casser.

## Ce que tu auras à la fin

- **PostgreSQL** installé et démarré (port `5432`)
- **pgAdmin 4** installé
- Un **serveur enregistré** dans pgAdmin (ex. `serveur_bdd`)
- La base **`java_blog`** créée avec les tables (`doc/blog.sql`)
- La branche Git **`partie-02`** créée et active (prête pour le code Java de cette partie)

> ⏱️ **Durée estimée :** 30 à 45 minutes (première installation).

---

## Todo installation

- [ ] Installer PostgreSQL
- [ ] Noter le mot de passe de l'utilisateur `postgres`
- [ ] Vérifier que PostgreSQL tourne (port `5432`)
- [ ] Installer pgAdmin 4
- [ ] Enregistrer le serveur dans pgAdmin
- [ ] Créer la base `java_blog`
- [ ] Exécuter `doc/blog.sql`
- [ ] Vérifier : `SELECT COUNT(*) FROM articles` renvoie un nombre > 0
- [ ] Créer la branche Git `partie-02` depuis `partie-01`

---

## 1. PostgreSQL et pgAdmin : c'est quoi ?

| Logiciel | Rôle |
|---|---|
| **PostgreSQL** | Le **moteur** qui stocke les données (tourne en arrière-plan) |
| **pgAdmin** | L'**interface graphique** pour voir la base et écrire du SQL |

Tu as besoin des **deux**.

---

## 2. Installer PostgreSQL

### macOS

**Option A — Installateur officiel (recommandé débutant)**

1. Va sur **https://www.postgresql.org/download/macosx/**
2. Télécharge l'installateur (EDB ou Postgres.app selon ce que propose le site)
3. Lance l'installateur et suis les étapes
4. **Note le mot de passe** que tu choisis pour l'utilisateur `postgres` → tu en auras besoin partout
5. Laisse le port par défaut : **`5432`**

**Option B — Homebrew** *(si tu utilises déjà Homebrew)*

```bash
brew install postgresql@16
brew services start postgresql@16
```

### Windows

1. Va sur **https://www.postgresql.org/download/windows/**
2. Télécharge l'installateur proposé (souvent via EDB)
3. Lance l'installateur
4. Composants à garder cochés : **PostgreSQL Server**, **pgAdmin 4**, **Command Line Tools**
5. Port : **`5432`** (par défaut)
6. **Mot de passe `postgres`** : choisis-en un et **note-le**
7. Locale : français ou défaut — les deux conviennent

> ✅ **Vérifie :** l'installation se termine sans erreur.

---

## 3. Vérifier que PostgreSQL tourne

### macOS / Linux (terminal)

```bash
# Vérifie que le port 5432 répond
nc -zv localhost 5432
```

Ou, si `psql` est installé :

```bash
psql -U postgres -h localhost -c "SELECT version();"
```

(On te demandera le mot de passe choisi à l'installation.)

### Windows (PowerShell)

```powershell
Test-NetConnection -ComputerName localhost -Port 5432
```

### Via pgAdmin

Si tu arrives à te connecter au serveur à l'étape 5, PostgreSQL tourne.

---

## 4. Installer pgAdmin 4

### Si pgAdmin n'est pas déjà installé avec PostgreSQL (Windows souvent inclus)

1. Va sur **https://www.pgadmin.org/download/**
2. Télécharge **pgAdmin 4** pour ton système
3. Installe et lance pgAdmin

### Premier lancement

pgAdmin peut demander un **mot de passe maître** : c'est un mot de passe **local** pour chiffrer tes connexions sauvegardées dans pgAdmin. Ce n'est **pas** le mot de passe PostgreSQL. Choisis-en un et retiens-le.

---

## 5. Enregistrer le serveur PostgreSQL dans pgAdmin

Si tu ne vois **pas** encore de serveur sous **Servers** :

1. Clic droit sur **Servers** → **Register** → **Server…**
2. Onglet **General** :
   - **Name** : `serveur_bdd` *(ou un nom de ton choix — c'est juste une étiquette)*
3. Onglet **Connection** :
   - **Host name/address** : `localhost`
   - **Port** : `5432`
   - **Maintenance database** : `postgres`
   - **Username** : `postgres`
   - **Password** : le mot de passe choisi à l'installation
   - Coche **Save password** si tu es sur ta machine perso
4. Clique **Save**

> ✅ **Vérifie :** le serveur apparaît sans croix rouge, tu peux le dérouler.

### Retrouver les paramètres plus tard

Clic droit sur le serveur → **Properties** → onglet **Connection** → hôte, port, utilisateur.

---

## 6. Créer la base `java_blog`

1. Déroule **Servers** → ton serveur → **Databases**
2. Clic droit sur **Databases** → **Create** → **Database…**
3. **Database** : `java_blog`
4. **Save**

> ✅ **Vérifie :** `java_blog` apparaît dans la liste des bases.

---

## 7. Exécuter `blog.sql` (tables + données de test)

1. Clic droit sur la base **`java_blog`** → **Query Tool**
2. Ouvre le fichier **`doc/blog.sql`** du projet `java_blog` dans un éditeur de texte
3. **Sélectionne tout** le contenu (`Ctrl/Cmd + A`) et **copie**
4. **Colle** dans le Query Tool de pgAdmin
5. Clique **▶ Execute** (ou `F5`)

Tu dois voir des messages de succès. Rafraîchis l'arborescence :

```
java_blog → Schemas → public → Tables (7)
```

Tables attendues : `articles`, `users`, `commentaires`, `catégories`, `médias`, `articles_categories`, `articles_medias`.

> 📌 **Plus tard :** des scripts **`doc/sql/upgrade-*.sql`** complètent la base au fil du cours (ex. BCrypt partie 05) — voir [sql/README.md](sql/README.md). **Ne pas** ré-exécuter `blog.sql` entier.

---

## 8. Vérification finale

Dans le Query Tool sur `java_blog` :

```sql
SELECT COUNT(*) FROM articles;
SELECT COUNT(*) FROM users;
```

Résultats attendus : des nombres **≥ 1** (le script insère des données de démo).

Clic droit sur `articles` → **View/Edit Data** → tu dois voir des titres comme « Introduction à PostgreSQL ».

> ✅ **Vérifie :** les requêtes renvoient bien des lignes.

---

## 9. Paramètres à garder sous la main (pour Java)

| Paramètre | Valeur |
|---|---|
| Hôte | `localhost` |
| Port | `5432` |
| Base | `java_blog` |
| Utilisateur | `postgres` |
| Mot de passe | *(celui noté à l'installation)* |

URL JDBC (utilisée dans `partie-02-03-connexion-bdd.md`, fichier `application.yaml`) :

```
jdbc:postgresql://localhost:5432/java_blog
```

---

## 10. Créer la branche Git `partie-02`

L'installation PostgreSQL se passe **sur ta machine** — rien à committer pour l'instant. En revanche, on prépare le dépôt : tout le **code Java** de la partie 02 vivra sur une **nouvelle branche**, comme à la partie 01.

> ⚠️ **Prérequis :** tu dois avoir terminé la partie 01 (branche `partie-01` commitée). Si ce n'est pas le cas, retourne à `partie-01-01-installation-spring-boot.md`.

Ouvre un terminal **à la racine du projet** (là où se trouve `pom.xml`) :

```bash
git checkout partie-01
git checkout -b partie-02
git branch
```

**Explication :**

- `git checkout partie-01` → tu repars de l'état **validé** à la fin de la partie 01 (API en mémoire).
- `git checkout -b partie-02` → crée et active la branche **`partie-02`**. Le code JDBC et PostgreSQL que tu écriras ensuite sera commité ici.
- `git branch` → vérifie que la branche active est bien `partie-02`.

Résultat attendu (l'étoile `*` indique la branche active) :

```
  main
  partie-01
* partie-02
```

> ❓ **Pourquoi créer la branche maintenant ?** Comme à la partie 01 : une branche = une étape. `partie-01` reste figée (API en mémoire) ; `partie-02` accueillera la connexion BDD et les routes qui lisent PostgreSQL.

> 💡 **Pas de commit ici :** tu n'as pas encore modifié le code Java. Le premier commit sur `partie-02` viendra quand tu auras codé la connexion (`partie-02-03-connexion-bdd.md`).

> ✅ **Vérifie :** `git branch` affiche `* partie-02`. Ton projet Java démarre toujours (`./mvnw spring-boot:run`) et `/ping` répond `pong`.

---

## 🆘 En cas de problème

| Problème | Solution |
|---|---|
| `Connection refused` sur le port 5432 | PostgreSQL n'est pas démarré → relance le service ou l'installateur |
| Mot de passe `postgres` refusé | Retente le mot de passe noté ; sinon réinitialisation via formateur |
| pgAdmin : pas de serveur visible | Étape 5 : Register Server |
| Erreur en exécutant `blog.sql` | Vérifie que tu es bien connecté à **`java_blog`** (pas `postgres`) |
| `blog.sql` : erreur « already exists » | Base déjà peuplée → OK si les tables existent ; sinon supprime et recrée la base |
| Page vide sur `http://localhost:5432` | **Normal** — ce n'est pas une page web. Utilise **pgAdmin** |
| `error: pathspec 'partie-01' did not match` | La partie 01 n'est pas terminée ou pas commitée → reprends `partie-01-01-installation-spring-boot.md` |
| `fatal: not a git repository` | Tu n'es pas à la racine du projet → place-toi dans le dossier qui contient `pom.xml` |

---

## ✅ Récapitulatif

- [ ] PostgreSQL et pgAdmin installés, base `java_blog` peuplée
- [ ] Paramètres JDBC notés (hôte, port, base, utilisateur, mot de passe)
- [ ] Branche Git `partie-02` créée et active

---

## Suite

Consulte **`INDEX.md`** pour l'étape suivante de la partie 02.
