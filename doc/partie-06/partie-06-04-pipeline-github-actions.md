# Partie 06 — Étape 04
# Pipeline CI — GitHub Actions

> 📘 **Tu crées le workflow `.github/workflows/ci.yml`** pour lancer tests Java + build React **automatiquement**.  
> 🗣️ **On vulgarise :** la CI = un **robot GitHub** qui exécute ta checklist à chaque `git push` — tu n'as plus à te dire « ah zut, j'ai oublié de tester ».  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** [partie-06-03-tests-api-mockmvc.md](partie-06-03-tests-api-mockmvc.md) ( `./mvnw test` vert en local).

## Ce que tu auras à la fin de cette étape

- **Workflow GitHub Actions** — 2 jobs parallèles : **backend-test** + **frontend-build**.
- Badge **CI** dans le README (optionnel).
- Test **Vitest** léger sur `auth.js` (optionnel mais recommandé).
- Push → pipeline **verte** ou **rouge** visible sur GitHub.

> ⏱️ **Durée estimée :** 45 à 60 minutes (+ 5 min première exécution CI).

---

## Todo

- [ ] Créer `.github/workflows/ci.yml`
- [ ] Pousser sur GitHub et vérifier l'onglet **Actions**
- [ ] (Optionnel) Ajouter Vitest + `auth.test.js`
- [ ] (Optionnel) Badge CI dans `README.md`
- [ ] Committer `06-04`

---

## Branche Git

Branche active : **`partie-06`** (créée en [partie-06-01-cadrage-devops.md](partie-06-01-cadrage-devops.md)).

```bash
git branch   # * partie-06
```

Si besoin : `git checkout partie-06`

---

## 0. Prérequis GitHub

| Étape | Action |
|---|---|
| 1 | Dépôt sur **GitHub** (pas seulement local) |
| 2 | Branche `partie-06` poussée : `git push -u origin partie-06` |
| 3 | Onglet **Actions** activé (gratuit pour repos publics) |

> 💡 La CI lance un **PostgreSQL éphémère** (service GitHub Actions) — pas H2, pas Docker à installer localement.

---

## 1. Architecture du pipeline

```
         push / pull_request
                 │
     ┌───────────┴───────────┐
     ▼                       ▼
backend-test            frontend-build
Java 21                 Node 20
./mvnw -B test          npm ci && npm run build
     │                       │
     └───────────┬───────────┘
                 ▼
         Les 2 jobs verts = OK
```

**Pourquoi 2 jobs séparés ?**

- **Parallèles** → plus rapide.
- Si le Java casse, tu vois **quel** job a échoué.
- Le front peut build **sans** PostgreSQL ; le job **backend** démarre son propre PostgreSQL.

---

## 2. Fichier workflow — `ci.yml`

**Chemin :** `.github/workflows/ci.yml`

```yaml
# CI — Blog Java / Spring Boot + React admin
# Déclenché à chaque push et pull request

name: CI

on:
  push:
    branches:
      - main
      - "partie-*"
  pull_request:
    branches:
      - main

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  backend-test:
    name: Backend — Maven test
    runs-on: ubuntu-latest
    timeout-minutes: 15

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: java_blog_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres -d java_blog_test"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Java 21
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: "21"
          cache: maven

      - name: Run tests
        run: ./mvnw -B test

  frontend-build:
    name: Frontend — Vite build
    runs-on: ubuntu-latest
    timeout-minutes: 10
    defaults:
      run:
        working-directory: admin

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: admin/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Unit tests (if configured)
        run: npm run test --if-present
```

**Explication ligne par ligne :**

| Bloc | En clair |
|---|---|
| `on: push` / `pull_request` | Quand lancer la CI |
| `branches: partie-*` | Chaque branche pédagogique est testée |
| `concurrency` | Annule la run précédente si tu pushes 2 fois vite |
| `cache: maven` / `cache: npm` | Accélère les runs suivantes |
| `./mvnw -B test` | Mode batch — tests sur PostgreSQL `java_blog_test` (service CI) |
| `working-directory: admin` | Job front dans le dossier React |
| `npm ci` | Install **reproductible** (lock file) |
| `--if-present` | Lance `npm test` seulement si script défini |

> ✅ **Vérifie :** le fichier est valide YAML (indentation espaces, pas de tab).

---

## 3. (Optionnel) Vitest — test frontend minimal

Objectif DevOps : le front aussi a une **barrière qualité**.

### 3.1 Installer Vitest (dans `admin/`)

```bash
cd admin
npm install -D vitest jsdom
```

### 3.2 Script `package.json`

Ajoute dans **`admin/package.json`** :

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

### 3.3 Test — `admin/src/api/auth.test.js`

```javascript
import { describe, it, expect, beforeEach } from "vitest";
import { getToken, logout, isLoggedIn, getAuthHeaders } from "./auth.js";

describe("auth.js", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("isLoggedIn retourne false sans token", () => {
    expect(isLoggedIn()).toBe(false);
  });

  it("getAuthHeaders retourne Authorization si token présent", () => {
    localStorage.setItem("java_blog_token", "fake-jwt");
    expect(getAuthHeaders()).toEqual({
      Authorization: "Bearer fake-jwt",
    });
  });

  it("logout efface le token", () => {
    localStorage.setItem("java_blog_token", "x");
    logout();
    expect(getToken()).toBeNull();
  });
});
```

Lance en local :

```bash
cd admin && npm test
```

> 💡 Pas de `fetch` ici — tests **unitaires** du module auth (rapides, stables en CI).

---

## 4. Badge CI dans le README (optionnel)

En haut de **`README.md`** (remplace `USER/REPO`) :

```markdown
![CI](https://github.com/USER/REPO/actions/workflows/ci.yml/badge.svg)
```

---

## 5. Premier push et vérification

```bash
git add .github/workflows/ci.yml
# + admin/package.json admin/package-lock.json admin/src/api/auth.test.js si Vitest
git commit -m "06-04 — pipeline GitHub Actions CI"
git push -u origin partie-06
```

Sur GitHub :

1. Onglet **Actions** → workflow **CI** en cours.
2. Attendre **~2–4 min** (première run).
3. ✅ Les deux jobs **verts**.

> ❓ **Job rouge ?** Clique le job → lis les logs (souvent un test JUnit ou `npm run build`).

---

## 6. Bonnes pratiques DevOps (checklist)

| Pratique | Notre projet |
|---|---|
| **Build reproductible** | `mvnw` + `npm ci` (lock file) |
| **Tests avant merge** | CI obligatoire sur PR |
| **Pas de secrets en CI test** | PostgreSQL service + `application-test.yaml` |
| **Fail fast** | `-B test` stoppe au 1er échec |
| **Cache** | Maven + npm dans Actions |
| **Branches courtes** | `partie-06` → merge `main` quand vert |
| **Doc as Code** | `README.md` + `doc/API.md` — voir **06-05** ; job `doc-check` optionnel |

---

## 7. Simuler la CI en local

Avant de push, lance la même chose que GitHub :

```bash
./mvnw -B test && cd admin && npm ci && npm run build && npm test --if-present
```

*(Voir aussi le `Makefile` en 06-05.)*

---

## 8. Commit

Si badge + Vitest dans le même commit ou séparé — au choix pédagogique.

```bash
git commit -m "06-04 — pipeline GitHub Actions CI"
```

---

## 🆘 En cas de problème

| Symptôme | Cause | Solution |
|---|---|---|
| `./mvnw: Permission denied` | Pas exécutable | `git update-index --chmod=+x mvnw` |
| `npm ci` échoue | Pas de `package-lock.json` | `npm install` local puis commit lock |
| Job front ignoré | Pas de dossier `admin/` sur branche | Merger partie 04/05 d'abord |
| Tests OK local, KO CI | Timezone / locale | Rare ; vérifier dates dans tests |
| Actions désactivées | Repo privé / settings | Activer Actions dans Settings |

---

## Suite

👉 **[partie-06-05-recap-devops.md](partie-06-05-recap-devops.md)** — Makefile + récap DevOps.
