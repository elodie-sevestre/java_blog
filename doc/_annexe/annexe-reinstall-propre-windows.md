# Annexe — Réinstallation propre (Windows)

> 📘 **Quand l'utiliser :** ancienne copie du projet, mélange de branches, ou tu veux repartir de zéro **sans réinstaller** PostgreSQL sur la machine.  
> 📋 **Ordre du parcours :** [INDEX.md](INDEX.md)  
> 🍎 **macOS / Linux :** [annexe-reinstall-propre.md](annexe-reinstall-propre.md)

---

## Principe

1. **Renommer** (ou abandonner) l'ancien dossier — ne pas « réparer » dedans.
2. **Cloner** une version à jour dans un **nouveau** répertoire (ex. `C:\Dev\java_blog`).
3. **Recréer** la base PostgreSQL `java_blog` avec `blog.sql`.
4. Relancer **Spring Boot** puis **React** (partie 04+) dans **deux terminaux**.

> 💡 Utilise **PowerShell** ou **Git Bash** (installé avec Git for Windows). Les commandes ci-dessous sont données pour **PowerShell** ; l'équivalent **cmd** est indiqué quand c'est différent.

---

## 0. Où en es-tu dans le cours ?

| Étape actuelle | Branche après clone |
|---|---|
| **Partie 04** (React admin) | `partie-03` → puis `git checkout -b partie-04` |
| **Partie 05** (auth JWT) | `partie-04` locale si tu l'as ; sinon repartir de `partie-03` |
| **Référence formateur** | `main` (React + auth déjà inclus — **pas** pour suivre le cours pas à pas) |

---

## 1. Sauvegarder l'ancien dossier (optionnel)

**PowerShell :**

```powershell
Rename-Item -Path "$env:USERPROFILE\java_blog" -NewName "java_blog_OLD_$(Get-Date -Format yyyyMMdd)"
```

**Explorateur Windows :** clic droit sur le dossier → **Renommer** → `java_blog_OLD`.

---

## 2. Vérifier les outils

Ouvre **PowerShell** ou **cmd** :

```powershell
java -version          # → 21
node -v                # → 20+  (obligatoire dès la partie 04)
psql --version         # → PostgreSQL installé (sinon voir ci-dessous)
git --version
```

### PostgreSQL doit tourner (port 5432)

- **Services Windows :** `Win + R` → `services.msc` → service **postgresql-x64-…** → **Démarré**.
- Ou pgAdmin : si tu te connectes au serveur local, PostgreSQL tourne.

### `psql` introuvable

Ajoute le dossier **bin** de PostgreSQL au PATH, par ex. :

`C:\Program Files\PostgreSQL\16\bin`

(Panneau de configuration → Variables d'environnement → **Path** → **Modifier** → **Nouveau**.)

Installation PostgreSQL + pgAdmin : [partie-02-01-install-postgresql-pgadmin.md](partie-02-01-install-postgresql-pgadmin.md) (section Windows).

---

## 3. Cloner dans un nouveau dossier

**PowerShell :**

```powershell
New-Item -ItemType Directory -Force -Path C:\Dev
Set-Location C:\Dev
git clone https://github.com/ZoliveAllegret/java_blog.git
Set-Location java_blog
git fetch --all
git checkout partie-03
git pull origin partie-03
git branch                      # * partie-03
```

Vérifications :

```powershell
if (-not (Test-Path admin)) { Write-Host "OK : pas de dossier admin/ — normal avant partie 04-02" }
.\mvnw.cmd -v
```

> ⚠️ Sous Windows, le Maven Wrapper s'appelle **`mvnw.cmd`** (pas `./mvnw`).

---

## 4. Réinitialiser PostgreSQL (`java_blog`)

Tu **gardes** PostgreSQL installé ; tu **recrées** seulement la base de données.

### pgAdmin (recommandé sous Windows)

1. Connecte-toi au serveur local (utilisateur **`postgres`**, mot de passe choisi à l'installation).
2. Clic droit sur la base **`java_blog`** → **Delete/Drop** (si elle existe).
3. Clic droit sur **Databases** → **Create** → **Database** → nom : **`java_blog`**.
4. Clic droit sur **`java_blog`** → **Query Tool**.
5. **File → Open** → `C:\Dev\java_blog\doc\blog.sql` → **Execute** (F5).
6. Vérifier : `SELECT COUNT(*) FROM articles;` → nombre > 0.

### PowerShell + `psql`

```powershell
Set-Location C:\Dev\java_blog
$env:PGPASSWORD = "postgres"    # adapter si ton mot de passe diffère

psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS java_blog;"
psql -U postgres -h localhost -c "CREATE DATABASE java_blog;"
psql -U postgres -h localhost -d java_blog -f doc\blog.sql
```

**cmd (équivalent) :**

```cmd
set PGPASSWORD=postgres
psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS java_blog;"
psql -U postgres -h localhost -c "CREATE DATABASE java_blog;"
psql -U postgres -h localhost -d java_blog -f doc\blog.sql
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

**Terminal 1** (PowerShell ou cmd) — **laisser ouvert** :

```powershell
Set-Location C:\Dev\java_blog

# Si ton mot de passe postgres n'est PAS "postgres" :
$env:POSTGRES_PASSWORD = "ton_mot_de_passe"

.\mvnw.cmd spring-boot:run
```

**cmd :**

```cmd
cd C:\Dev\java_blog
set POSTGRES_PASSWORD=ton_mot_de_passe
mvnw.cmd spring-boot:run
```

| URL | Attendu |
|---|---|
| http://localhost:8080/ping | `pong` |
| http://localhost:8080/db/ping | connexion OK + compteur articles |
| http://localhost:8080/articles/recents | JSON |

Mot de passe JDBC : `src/main/resources/application.yaml` → `password: ${POSTGRES_PASSWORD:postgres}`.

> 💡 La **première** exécution de `mvnw.cmd` peut télécharger Maven — patiente.

---

## 6. Partie 04 — branche de travail + React

**Terminal 2** (Spring toujours lancé en T1) :

```powershell
Set-Location C:\Dev\java_blog
git checkout -b partie-04
```

Suivre dans l'ordre :

1. [partie-04-01-cadrage-react-composants.md](partie-04-01-cadrage-react-composants.md)
2. [partie-04-02-setup-react-vite.md](partie-04-02-setup-react-vite.md) → crée le dossier **`admin/`**

Après le setup Vite :

```powershell
Set-Location admin
npm install
npm run dev
```

| URL | Rôle |
|---|---|
| http://localhost:5173 | Admin React (Vite) |
| http://localhost:8080 | API Spring |

> 💡 Si Windows Defender ou un antivirus bloque `npm`, autorise le dossier `C:\Dev\java_blog`.

---

## 7. Checklist

- [ ] Nouveau dossier (ex. `C:\Dev\java_blog`, pas l'ancien réutilisé)
- [ ] Branche `partie-03` ou `partie-04` — pas `main` pour le cours
- [ ] Base `java_blog` rechargée avec `blog.sql`
- [ ] Spring sur `:8080` sans erreur JDBC
- [ ] React sur `:5173` après `npm install` + `npm run dev` (partie 04+)
- [ ] Deux terminaux : `mvnw.cmd spring-boot:run` + `npm run dev`

---

## 8. Dépannage (Windows)

| Problème | Action |
|---|---|
| `'mvnw' n'est pas reconnu` | Utilise **`.\mvnw.cmd`** (pas `./mvnw`) |
| `'psql' n'est pas reconnu` | Ajoute `C:\Program Files\PostgreSQL\16\bin` au PATH |
| `Connection refused` `:8080` | Relancer `.\mvnw.cmd spring-boot:run` |
| `Connection refused` `:5432` | Démarrer le service PostgreSQL (`services.msc`) |
| `password authentication failed` | `$env:POSTGRES_PASSWORD = "…"` puis relancer Spring |
| `database "java_blog" does not exist` | Refaire § 4 (pgAdmin ou psql) |
| CORS / `Failed to fetch` | Spring relancé ; front sur `:5173` ; voir [partie-04-02](partie-04-02-setup-react-vite.md) § CORS |
| `npm` introuvable | Réinstaller [Node.js 20+](https://nodejs.org/) (cocher « Add to PATH ») |
| Script PowerShell bloqué | Ouvre PowerShell **en administrateur** ou utilise **cmd** / **Git Bash** |
| Chemin avec espaces | Évite `C:\Users\Mon Nom\...` ; préfère `C:\Dev\java_blog` |

---

## 9. Récupérer d'anciens commits (optionnel)

```powershell
Set-Location C:\Users\...\java_blog_OLD
git log --oneline -5

Set-Location C:\Dev\java_blog
git cherry-pick <hash>    # un commit à la fois, si compatible
```

Sinon : repartir de `partie-03` est plus simple.

---

## Message court (Slack / Moodle)

> 1. Renommer l'ancien dossier.  
> 2. `git clone https://github.com/ZoliveAllegret/java_blog.git` dans `C:\Dev\java_blog`  
> 3. `git checkout partie-03` puis `git checkout -b partie-04`  
> 4. pgAdmin : drop/create `java_blog` + `doc/blog.sql`  
> 5. T1 : `.\mvnw.cmd spring-boot:run` → `/articles/recents`  
> 6. T2 : `doc/partie-04-02-setup-react-vite.md` puis `cd admin`, `npm install`, `npm run dev`  
> Guide Windows : [annexe-reinstall-propre-windows.md](annexe-reinstall-propre-windows.md)
