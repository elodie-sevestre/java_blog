# Partie 06 — Étape 05
# Makefile, documentation et récap DevOps

> 📘 **Dernière étape DevOps** : raccourcis locaux, **documentation du projet** + récap.  
> 🗣️ **On vulgarise :** la doc DevOps = la **notice de montage** versionnée dans Git — un nouvel arrivant (ou toi dans 6 mois) sait **installer, tester et appeler l'API** sans deviner.  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** [partie-06-04-pipeline-github-actions.md](partie-06-04-pipeline-github-actions.md) (CI verte sur GitHub).

## Ce que tu auras à la fin de cette étape

- **`Makefile`** — `make test`, `make ci`, `make backend`, `make frontend`.
- **`README.md`** — porte d'entrée du dépôt GitHub.
- **`doc/API.md`** — routes HTTP **implémentées** (contrat pour le front et le TP).
- **Récap partie 06** — tests + CI + doc.

> ⏱️ **Durée estimée :** 45 à 60 minutes.

---

## Todo

- [ ] Créer `Makefile`
- [ ] Rédiger `README.md` à la racine
- [ ] Créer `doc/API.md` (routes codées parties 03–05)
- [ ] Vérifier les liens (`doc/INDEX.md`, badge CI)
- [ ] Committer `06-05`

---

## Branche Git

Branche active : **`partie-06`** (créée en [partie-06-01-cadrage-devops.md](partie-06-01-cadrage-devops.md)).

```bash
git branch   # * partie-06
git log --oneline   # commits 06-02 … 06-05 attendus
```

Si besoin : `git checkout partie-06`

---

## 0. Docker — hors scope

> 📌 **Docker = cours dédié.** PostgreSQL en dev = **partie 02** ; tests = **`java_blog_test`** ; CI = **service PostgreSQL** GitHub (pas H2).

---

## 1. Documentation — pourquoi c'est du DevOps

| Sans doc | Avec doc |
|---|---|
| « Comment je lance déjà ? » | `README.md` → 3 commandes |
| « Quelle route pour créer un article ? » | `doc/API.md` → POST `/admin/articles` |
| Supports éparpillés | `doc/INDEX.md` → parcours formation |

> 💡 **Doc as Code** : la documentation vit **dans le repo**, revue en PR comme le code, versionnée avec les branches `partie-*`.

### Les 3 niveaux de doc du projet

| Fichier | Public | Contenu |
|---|---|---|
| **`README.md`** | Visiteur GitHub, recruteur, toi | Installer, lancer, tester — **1 page** |
| **`doc/API.md`** | Dev front / TP partie 07 | Routes HTTP, JSON, auth — **contrat technique** |
| **`doc/INDEX.md`** | Élèves | Supports pédagogiques parties 01–07 — **déjà existant** |

---

## 2. `README.md` — modèle

**Chemin :** `README.md` (racine du projet)

```markdown
# Blog Java — Spring Boot + React

API REST + back-office admin pour un blog (formation ADA).

![CI](https://github.com/USER/REPO/actions/workflows/ci.yml/badge.svg)

## Prérequis

- **Java 21** + Maven Wrapper (`./mvnw`)
- **Node.js 20+** (dossier `admin/`)
- **PostgreSQL** — base `java_blog` + upgrades [doc/sql/README.md](sql/README.md)

## Démarrage rapide

**Deux terminaux :**

```bash
# Terminal 1 — API (port 8080)
./mvnw spring-boot:run

# Terminal 2 — Admin React (port 5173)
cd admin && npm install && npm run dev
```

Compte admin démo (après `upgrade-05-01-bcrypt-alice.sql`) : `alice@example.com` / `demo1234`

## Tests et qualité

```bash
make test    # JUnit + PostgreSQL java_blog_test (PostgreSQL allumé)
make ci      # backend + build frontend admin (comme GitHub Actions)
```

## Documentation

| Document | Description |
|---|---|
| [doc/INDEX.md](doc/INDEX.md) | Parcours de formation (parties 01–07) |
| [doc/API.md](doc/API.md) | Routes HTTP implémentées |
| [doc/blog.sql](doc/blog.sql) | Schéma PostgreSQL + données de test |

## Branches Git

| Branche | Contenu |
|---|---|
| `main` | Référence implémentée (backend 02–06 + admin React 04–05) |
| `partie-03` | API articles (couches + CRUD) |
| `partie-04` | Back-office React |
| `partie-05` | Auth JWT |
| `partie-06` | Tests + CI + doc |

## Stack

- Backend : Spring Boot 3, JDBC, PostgreSQL, Spring Security, JWT
- Frontend : React (Vite), composants + props
```

> ⚠️ Remplace `USER/REPO` par ton dépôt GitHub pour le badge CI.

---

## 3. `doc/API.md` — contrat HTTP

**Objectif :** lister **uniquement ce qui est codé** — pas les routes du TP partie 07.

**Chemin :** `doc/API.md`

```markdown
# API Blog Java — routes implémentées

> Base URL : `http://localhost:8080`  
> Auth admin : header `Authorization: Bearer <token>` (obtenu via login)  
> Corrigé complet des routes prévues : [partie-02-06-corrige-routes-blog.md](partie-02-06-corrige-routes-blog.md)

## Santé

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/ping` | Non | API vivante |
| GET | `/db/ping` | Non | Connexion PostgreSQL |

## Articles (public)

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/articles` | Non | Articles **publiés** |
| GET | `/articles/{id}` | Non | Détail par id |
| GET | `/articles/recents` | Non | 5 derniers (tous statuts) |
| GET | `/articles/recents/count` | Non | Nombre d'articles récents |

## Authentification

| Méthode | Route | Auth | Corps JSON | Réponse |
|---|---|---|---|---|
| POST | `/auth/login` | Non | `{ "mail", "mdp" }` | `{ "token", "pseudo", "userId" }` |

## Admin — articles

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/admin/articles` | **JWT** | Créer (brouillon) — `{ "titre", "contenu", "userId" }` |
| PUT | `/admin/articles/{id}` | **JWT** | Modifier — `{ "titre", "contenu", "publie" }` |
| DELETE | `/admin/articles/{id}` | **JWT** | Supprimer — 204 |

## Codes HTTP usuels

| Code | Situation |
|---|---|
| 200 | OK (GET, PUT, login) |
| 201 | Article créé (POST) |
| 204 | Supprimé (DELETE) |
| 401 | Non authentifié (login KO ou token absent/invalide) |
| 404 | Ressource introuvable |

## Exemples curl

```bash
# Login
curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mail":"alice@example.com","mdp":"demo1234"}'

# Articles récents (public)
curl -s http://localhost:8080/articles/recents
```
```

**Explication :**

- Tableaux **méthode / route / auth** → lecture rapide pour le front.
- Lien vers **02-06** → routes **futures** (commentaires, catégories…) sans les mélanger.
- Exemples **curl** → testables sans React.

> ✅ **Todo :** chaque route listée existe **vraiment** dans le code (parties 03–05).

---

## 4. `Makefile` — raccourcis

**Chemin :** `Makefile`

```makefile
# Raccourcis DevOps — Blog Java

.PHONY: test ci backend frontend

test:
	./mvnw test

ci:
	./mvnw -B test
	cd admin && npm ci && npm run build && npm run test --if-present

backend:
	./mvnw spring-boot:run

frontend:
	cd admin && npm run dev
```

---

## 5. (Optionnel) Vérifier la doc en CI

Dans **`.github/workflows/ci.yml`**, tu peux ajouter un contrôle minimal :

```yaml
  doc-check:
    name: Documentation — fichiers présents
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: README et API.md existent
        run: |
          test -f README.md
          test -f doc/API.md
          test -f doc/INDEX.md
```

> 💡 Pas de linter Markdown obligatoire — on vérifie surtout que la doc **n'a pas disparu**.

---

## 6. Schéma DevOps complet

```
Code + Tests (06-02 → 06-03)
        │
        ▼
CI GitHub Actions (06-04)
        │
        ▼
Documentation (06-05)  ← README + API.md
        │
        ▼
Nouvel arrivant : clone → README → make test → make backend
```

---

## 7. Commit final

```bash
git add Makefile README.md doc/API.md
# + .github/workflows/ci.yml si job doc-check
git commit -m "06-05 — Makefile + README + doc/API.md"
git log --oneline
```

---

## ✅ Récapitulatif partie 06 — DevOps

| Étape | Livrable | Pilier DevOps |
|---|---|---|
| 06-01 | Cadrage | Culture qualité |
| 06-02 | Tests unitaires + PostgreSQL | **Shift-left** |
| 06-03 | MockMvc + JWT | Intégration |
| 06-04 | GitHub Actions | **CI** |
| 06-05 | Makefile + README + API | **Documentation** + DX |

### Fichiers clés

| Fichier | Rôle |
|---|---|
| `src/test/…` | Tests automatisés |
| `.github/workflows/ci.yml` | Pipeline |
| `README.md` | Onboarding projet |
| `doc/API.md` | Contrat HTTP |
| `doc/INDEX.md` | Parcours cours |
| `Makefile` | Raccourcis |

### Ce que tu maîtrises

- [ ] Tests + CI avant merge
- [ ] README exploitable sans oral
- [ ] API documentée pour le front / TP
- [ ] Doc versionnée avec le code (**Doc as Code**)

---

## Suite

👉 **Partie 07** — TP : compléter les routes manquantes ; mets à jour **`doc/API.md`** au fur et à mesure.
