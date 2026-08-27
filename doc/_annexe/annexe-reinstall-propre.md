# Annexe — Réinstallation propre (macOS / Linux)

> 📘 **Quand l'utiliser :** ancienne copie du projet, dossier iCloud corrompu (`package 2.json`, `src 2/`), mélange de branches, ou tu veux repartir de zéro **sans réinstaller** PostgreSQL sur la machine.  
> 📋 **Ordre du parcours :** [INDEX.md](INDEX.md)  
> 🪟 **Windows :** [annexe-reinstall-propre-windows.md](annexe-reinstall-propre-windows.md)

---

## Principe

1. **Renommer** (ou abandonner) l'ancien dossier — ne pas « réparer » dedans.
2. **Cloner** une version à jour dans un **nouveau** répertoire (de préférence **hors iCloud**).
3. **Recréer** la base PostgreSQL `java_blog` avec `blog.sql`.
4. Relancer **Spring Boot** puis **React** (partie 04+) dans **deux terminaux**.

> ⚠️ Évite `~/Library/Mobile Documents/.../Sites/` (iCloud) : synchronisation lente et fichiers dupliqués.

---

## 0. Où en es-tu dans le cours ?

| Étape actuelle | Branche après clone |
|---|---|
| **Partie 04** (React admin) | `partie-03` → puis `git checkout -b partie-04` |
| **Partie 05** (auth JWT) | `partie-04` locale si tu l'as ; sinon repartir de `partie-03` |
| **Référence formateur** | `main` (React + auth déjà inclus — **pas** pour suivre le cours pas à pas) |

---

## 1. Sauvegarder l'ancien dossier (optionnel)

```bash
mv ~/Sites/java_blog ~/Sites/java_blog_OLD_$(date +%Y%m%d)
```

---

## 2. Vérifier les outils

```bash
java -version          # → 21
node -v                # → 20+  (obligatoire dès la partie 04)
psql --version         # → PostgreSQL installé
```

PostgreSQL doit **tourner** (port **5432**). Sous macOS avec Homebrew :

```bash
brew services list | grep postgres
```

Installation PostgreSQL + pgAdmin : [partie-02-01-install-postgresql-pgadmin.md](partie-02-01-install-postgresql-pgadmin.md).

---

## 3. Cloner dans un nouveau dossier

```bash
mkdir -p ~/Dev
cd ~/Dev
git clone https://github.com/ZoliveAllegret/java_blog.git
cd java_blog
git fetch --all
git checkout partie-03
git pull origin partie-03
git branch                      # * partie-03
```

Vérifications :

```bash
test ! -d admin && echo "OK : pas de dossier admin/ — normal avant partie 04-02"
./mvnw -v
```

---

## 4. Réinitialiser PostgreSQL (`java_blog`)

Tu **gardes** PostgreSQL installé ; tu **recrées** seulement la base de données.

### pgAdmin

1. Drop la base `java_blog` si elle existe.
2. **Create** → nom : `java_blog`.
3. Query Tool → exécuter [blog.sql](blog.sql).
4. Vérifier : `SELECT COUNT(*) FROM articles;` → nombre > 0.

### Terminal (macOS / Linux)

```bash
cd ~/Dev/java_blog
export PGPASSWORD="postgres"    # adapter si ton mot de passe diffère

psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS java_blog;"
psql -U postgres -h localhost -c "CREATE DATABASE java_blog;"
psql -U postgres -h localhost -d java_blog -f doc/blog.sql
```

### Scripts SQL selon la partie

| Partie | En plus de `blog.sql` |
|---|---|
| **04** | Rien |
| **05** (login) | [upgrade-05-01-bcrypt-alice.sql](sql/upgrade-05-01-bcrypt-alice.sql) |
| **06** (tests) | [upgrade-06-01-create-java-blog-test.sql](sql/upgrade-06-01-create-java-blog-test.sql) sur la base `postgres` |

Ordre détaillé : [sql/README.md](sql/README.md).

---

## 5. Lancer Spring Boot

**Terminal 1** — laisser ouvert :

```bash
cd ~/Dev/java_blog

# Si ton mot de passe postgres n'est PAS "postgres" :
export POSTGRES_PASSWORD="ton_mot_de_passe"

./mvnw spring-boot:run
```

| URL | Attendu |
|---|---|
| http://localhost:8080/ping | `pong` |
| http://localhost:8080/db/ping | connexion OK + compteur articles |
| http://localhost:8080/articles/recents | JSON |

Mot de passe JDBC : `src/main/resources/application.yaml` → `password: ${POSTGRES_PASSWORD:postgres}`.

---

## 6. Partie 04 — branche de travail + React

**Terminal 2** (Spring toujours lancé en T1) :

```bash
cd ~/Dev/java_blog
git checkout -b partie-04
```

Suivre dans l'ordre :

1. [partie-04-01-cadrage-react-composants.md](partie-04-01-cadrage-react-composants.md)
2. [partie-04-02-setup-react-vite.md](partie-04-02-setup-react-vite.md) → crée le dossier **`admin/`**

Après le setup Vite :

```bash
cd admin
npm install
npm run dev
```

| URL | Rôle |
|---|---|
| http://localhost:5173 | Admin React (Vite) |
| http://localhost:8080 | API Spring |

---

## 7. Checklist

- [ ] Nouveau dossier (pas l'ancien renommé réutilisé par erreur)
- [ ] Branche `partie-03` ou `partie-04` — pas `main` pour le cours
- [ ] Base `java_blog` rechargée avec `blog.sql`
- [ ] Spring sur `:8080` sans erreur JDBC
- [ ] React sur `:5173` après `npm install` + `npm run dev` (partie 04+)
- [ ] Deux terminaux : `./mvnw spring-boot:run` + `npm run dev`

---

## 8. Dépannage

| Problème | Action |
|---|---|
| `Connection refused` `:8080` | Relancer `./mvnw spring-boot:run` |
| `Connection refused` `:5432` | Démarrer PostgreSQL |
| `password authentication failed` | `export POSTGRES_PASSWORD=…` puis relancer Spring |
| `database "java_blog" does not exist` | Refaire § 4 |
| CORS / `Failed to fetch` | Spring relancé ; front sur `:5173` ; voir [partie-04-02](partie-04-02-setup-react-vite.md) § CORS |
| `npm: command not found` | Installer Node.js 20+ |
| Fichiers dupliqués (`src 2/`) | Dossier hors iCloud + re-cloner |

---

## 9. Récupérer d'anciens commits (optionnel)

```bash
cd ~/Sites/java_blog_OLD_...
git log --oneline -5

cd ~/Dev/java_blog
git cherry-pick <hash>    # un commit à la fois, si compatible
```

Sinon : repartir de `partie-03` est plus simple.

---

## Message court (Slack / Moodle)

> 1. Renommer l'ancien dossier.  
> 2. `git clone https://github.com/ZoliveAllegret/java_blog.git` dans `~/Dev/java_blog`  
> 3. `git checkout partie-03` puis `git checkout -b partie-04`  
> 4. pgAdmin : drop/create `java_blog` + `doc/blog.sql`  
> 5. T1 : `./mvnw spring-boot:run` → `/articles/recents`  
> 6. T2 : `doc/partie-04-02-setup-react-vite.md` puis `cd admin && npm install && npm run dev`  
> Guide macOS / Linux : [annexe-reinstall-propre.md](annexe-reinstall-propre.md) — Windows : [annexe-reinstall-propre-windows.md](annexe-reinstall-propre-windows.md)
