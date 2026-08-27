# Partie 07 — Étape 01
# TP : compléter l'API et le front-office public

> 📘 **Document élève — énoncé du TP.** Pas de corrigé ici : tu t'appuies sur ce que tu as appris aux parties 03–06.  
> 🗣️ **On vulgarise :** le cours t'a donné **articles + admin + auth + tests** ; le TP = **finir la carte** dessinée en partie 02 et montrer le blog aux visiteurs.  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** parties **01 à 06** terminées (branche `partie-06` commitée, CI verte, `doc/API.md` à jour pour le socle existant).

## Ce que tu dois livrer

| Livrable | Description |
|---|---|
| **Backend** | Routes manquantes (commentaires, catégories, médias, users…) — **même architecture** qu'en partie 03 |
| **Front-office React** | Dossier **`site/`** — lecture publique du blog (pas l'admin) |
| **`doc/API.md`** | Mis à jour avec **chaque** route que tu codes |
| **Branche Git** | `partie-07` — commits réguliers par thème |

> ⏱️ **Durée indicative :** 2 à 4 jours selon le niveau et le nombre de bonus visés.

---

## Todo — vue d'ensemble

- [ ] Créer la branche `partie-07` depuis `partie-06`
- [ ] Relire le corrigé routes [partie-02-06-corrige-routes-blog.md](partie-02-06-corrige-routes-blog.md)
- [ ] Implémenter le **backend** (ordre suggéré ci-dessous)
- [ ] Mettre à jour **`doc/API.md`** au fur et à mesure
- [ ] Créer le front **`site/`** (React + Vite)
- [ ] Vérifier que `./mvnw test` passe toujours
- [ ] (Optionnel) [partie-07-03-tests-tp-commentaires.md](partie-07-03-tests-tp-commentaires.md) — tests JUnit sur les commentaires
- [ ] (Optionnel) Étendre la CI pour builder `site/`

---

## Branche Git

Comme aux parties précédentes : **une branche = une étape du cursus**.

```bash
git checkout partie-06
git checkout -b partie-07
git branch   # * partie-07
```

> 💡 **Pas de commit obligatoire sur ce document** (`07-01` = énoncé). Commits au fil de l'implémentation — voir section « Commits suggérés ».

---

> **Encadré continuité — ce qui est déjà codé**  
> **Partie 03** : articles — GET publics + CRUD admin (POST / PUT / DELETE).  
> **Partie 04** : back-office React dans **`admin/`** (liste, formulaire, suppression).  
> **Partie 05** : `POST /auth/login`, JWT, `/admin/**` protégé.  
> **Partie 06** : tests JUnit, MockMvc, CI GitHub, `README.md`, `doc/API.md`.  
> **Partie 07 (toi)** : tout le reste de [partie-02-06](partie-02-06-corrige-routes-blog.md) + **site public** pour les visiteurs.

---

## 1. Rappel — l'architecture imposée

Tu **reproduis les mêmes couches** que pour les articles (partie 03) :

```
Controller  →  Mapper  →  Repository  →  PostgreSQL
     ↑              ↑
   DTO JSON      Model (classe + getters/setters)
```

| Règle | Pourquoi |
|---|---|
| **SQL uniquement dans les repositories** | Comme `ArticleRepository` |
| **JSON via DTO (records)** | Jamais le model brut en réponse |
| **404 / 201 / 204 dans les controllers** | Comme `AdminArticleController` |
| **Routes admin sous `/admin/...`** | Protégées par JWT (partie 05) |
| **Jamais de `mdp` en JSON** | Même pour `GET /users/{id}` |

> ❓ **Besoin d'un modèle ?** Ouvre ton propre code `Article*` (partie 03) — c'est la **recette** à dupliquer par ressource.

---

## 2. Carte des routes — à implémenter

Référence complète : **[partie-02-06-corrige-routes-blog.md](partie-02-06-corrige-routes-blog.md)**.

### Déjà codé (ne pas refaire)

| Route | Partie |
|---|---|
| `GET /ping`, `GET /db/ping` | 01–02 |
| `GET /articles`, `/articles/{id}`, `/recents`, `/recents/count` | 03 |
| `POST/PUT/DELETE /admin/articles` | 03 |
| `POST /auth/login` | 05 |

### 🔴 Obligatoire — backend

| Ressource | Routes minimum |
|---|---|
| **Admin articles** | `GET /admin/articles`, `GET /admin/articles/{id}` |
| **Commentaires** | `GET /articles/{id}/commentaires`, `POST /articles/{id}/commentaires`, `DELETE /admin/commentaires/{id}` |
| **Catégories** | `GET /categories`, `GET /categories/{id}/articles`, `POST/PUT/DELETE /admin/categories` |
| **Médias** | `GET /articles/{id}/medias`, `POST /admin/medias`, `DELETE /admin/medias/{id}` |
| **Users** | `GET /users/{id}` (sans mdp), `GET /admin/users`, `POST /admin/users` |

### 🟡 Bonus (points supplémentaires)

| Route | Intérêt |
|---|---|
| `GET /admin/commentaires` | Modération globale |
| `GET /commentaires/{id}` | Détail d'un commentaire |
| `GET /medias/{id}` | Détail média |
| `PATCH /admin/articles/{id}/publier` et `/depublier` | Publier sans PUT complet |
| `PUT /admin/articles/{id}/categories` | Lier catégories ↔ article (N-N) |
| `POST /admin/articles/{id}/medias` | Lier média ↔ article |
| `GET /admin/users/{id}` | Fiche admin user |
| Tests JUnit sur une nouvelle ressource | Qualité DevOps — voir [partie-07-03](partie-07-03-tests-tp-commentaires.md) |

---

## 3. Ordre de travail suggéré

```
Phase A — Admin articles manquant     (GET liste + GET détail brouillon)
    │
    ▼
Phase B — Commentaires                (GET imbriqué + POST public + DELETE admin)
    │
    ▼
Phase C — Catégories                  (GET public + CRUD admin)
    │
    ▼
Phase D — Médias                      (GET par article + CRUD admin)
    │
    ▼
Phase E — Users                       (profil public + admin)
    │
    ▼
Phase F — Front-office React (site/)  (liste articles + détail + commentaires)
    │
    ▼
Phase G — doc/API.md + README         (doc à jour)
```

> 💡 **Une ressource à la fois** : model → DTO → repository → mapper → controller(s) → curl → commit → `doc/API.md`.

---

## 4. Backend — consignes par ressource

### 4.1 Admin articles (compléter)

**Besoin métier :** le back-office React (partie 04) liste les articles via l'API — aujourd'hui il n'y a que les GET **publics** (publiés seulement).

| Route | Comportement attendu |
|---|---|
| `GET /admin/articles` | **Tous** les articles (brouillons inclus) — JWT requis |
| `GET /admin/articles/{id}` | Détail même si brouillon — 404 si id inconnu |

**Indice :** réutilise `ArticleRepository` ; ajoute une méthode `findAll()` ou `findAllForAdmin()` si besoin (pas de filtre `statut = true`).

---

### 4.2 Commentaires

**Tables :** `commentaires` (`id`, `contenu`, `user_id`, `article_id`, `date`).

| Route | Qui | Corps JSON (POST) |
|---|---|---|
| `GET /articles/{articleId}/commentaires` | Public | — |
| `POST /articles/{articleId}/commentaires` | Public* | `{ "contenu", "userId" }` |
| `DELETE /admin/commentaires/{id}` | Admin JWT | — → **204** |

\* *Pas d'auth visiteur en v1 — on accepte un `userId` dans le JSON (comme pour créer un article).*

**Pièges fréquents :**

- Route **imbriquée** sous l'article (`/articles/{id}/commentaires`), pas seulement `/commentaires`.
- Vérifier que l'**article existe** avant POST (sinon **404**).
- `DELETE` admin → **204 No Content**.

**Fichiers attendus (exemple) :**

```
model/Commentaire.java
dto/CommentaireResponse.java
dto/CommentaireCreateRequest.java
mapper/CommentaireMapper.java
repository/CommentaireRepository.java
controller/CommentaireController.java          ← GET + POST publics
controller/AdminCommentaireController.java   ← DELETE admin
```

---

### 4.3 Catégories

**Tables :** `"catégories"` + `articles_categories` (liaison N-N).

> ⚠️ Le nom de table **`"catégories"`** contient un accent — en SQL PostgreSQL, entoure-le de **guillemets doubles** : `"catégories"`.

| Route | Action |
|---|---|
| `GET /categories` | Liste `{ id, nom, description }` |
| `GET /categories/{id}/articles` | Articles **publiés** de cette catégorie |
| `POST /admin/categories` | Créer — `{ "nom", "description" }` |
| `PUT /admin/categories/{id}` | Modifier |
| `DELETE /admin/categories/{id}` | Supprimer — 204 |

**Indice SQL (articles d'une catégorie) :**

```sql
SELECT a.id, a.titre, ...
FROM articles a
INNER JOIN articles_categories ac ON ac.article_id = a.id
WHERE ac.categorie_id = ? AND a.statut = TRUE
```

---

### 4.4 Médias

**Tables :** `"médias"` + `articles_medias` ; colonne `"type"` = enum (`image`, `video`, `gif`, `musique`).

| Route | Action |
|---|---|
| `GET /articles/{id}/medias` | Médias liés à l'article |
| `POST /admin/medias` | Créer — `{ "type", "url" }` → **201** |
| `DELETE /admin/medias/{id}` | Supprimer — 204 |

> 💡 Tu peux stocker `type` en **String** côté Java — pas besoin d'enum Java obligatoire.

---

### 4.5 Utilisateurs

**Table :** `users` — le model `User` existe déjà (partie 05).

| Route | Champs JSON |
|---|---|
| `GET /users/{id}` | `{ "id", "pseudo", "mail" }` — **jamais** `mdp` |
| `GET /admin/users` | Liste users (sans mdp) |
| `POST /admin/users` | `{ "pseudo", "mail", "mdp" }` — **hasher** avec BCrypt (comme Alice) |

**Indice :** réutilise `BCryptPasswordEncoder` / la logique de hash de la partie 05.

---

## 5. Front-office React — dossier `site/`

**Objectif :** une app **distincte** de `admin/` — pour les **visiteurs** du blog.

| App | Dossier | Port Vite | Public |
|---|---|---|---|
| Back-office | `admin/` | 5173 | Formateurs / rédacteurs |
| **Front-office** | **`site/`** | **5174** (ou autre) | Visiteurs |

### Pages minimum

| Page | Route React | API utilisée |
|---|---|---|
| Accueil — liste articles publiés | `/` | `GET /articles` |
| Détail article + commentaires | `/articles/:id` | `GET /articles/{id}`, `GET …/commentaires` |
| Formulaire commentaire | (sur la page détail) | `POST /articles/{id}/commentaires` |

### Bonnes pratiques (comme partie 04)

- **1 composant = 1 fichier** dans `site/src/components/`
- Module **`site/src/api/`** pour les `fetch` (pas de SQL, pas de JWT sur les routes publiques)
- **Props down / events up**
- **CORS** : ajoute l'origine `http://localhost:5174` dans la config Spring (comme pour `5173` en partie 04)

### Création du projet

```bash
npm create vite@latest site -- --template react
cd site && npm install && npm run dev -- --port 5174
```

> ✅ **Critère de réussite front :** un visiteur voit les articles publiés, ouvre un article, lit les commentaires et peut en poster un **sans** login admin.

---

## 6. Documentation — `doc/API.md`

Chaque route codée doit apparaître dans **`doc/API.md`** (modèle en [partie-06-05-recap-devops.md](partie-06-05-recap-devops.md)).

Ajoute des sections :

```markdown
## Commentaires
## Catégories
## Médias
## Utilisateurs
```

Et mets à jour le **`README.md`** :

- commande pour lancer `site/` ;
- distinction admin vs site public.

---

## 7. Tests — rappel DevOps

Tu **n'es pas obligé** d'écrire de nouveaux tests, mais :

- `./mvnw test` doit rester **vert** ;
- si tu ajoutes un repository, un `@JdbcTest` (partie 06) est un **bonus** apprécié.

---

## 8. Grille d'évaluation (indicative)

| Critère | Points indicatifs |
|---|---|
| Architecture respectée (couches, DTO, pas de SQL au controller) | /4 |
| Routes **obligatoires** fonctionnelles (curl ou Insomnia) | /6 |
| `doc/API.md` à jour | /2 |
| Front **`site/`** — liste + détail + commentaire | /4 |
| Qualité (404, 201, 204, pas de mdp exposé) | /2 |
| Bonus (routes ⭐, tests, UX soignée) | +2 max |

---

## 9. Commits suggérés

Pas de numérotation stricte — **un commit par bloc cohérent** :

```bash
git commit -m "07 — GET admin articles (liste + détail)"
git commit -m "07 — commentaires (GET/POST public + DELETE admin)"
git commit -m "07 — catégories (GET public + CRUD admin)"
git commit -m "07 — médias"
git commit -m "07 — users (profil public + admin)"
git commit -m "07 — front-office site/ (liste + détail + commentaires)"
git commit -m "07 — doc/API.md + README"
```

---

## 10. Aide et ressources

| Document | Usage |
|---|---|
| [partie-02-06-corrige-routes-blog.md](partie-02-06-corrige-routes-blog.md) | Liste complète des routes |
| [blog.sql](blog.sql) | Schéma + données de test |
| [sql/README.md](sql/README.md) | Upgrades SQL (`upgrade-05-…`, `upgrade-06-…`) |
| [partie-03-03-mapper-et-repository.md](partie-03-03-mapper-et-repository.md) | Patron repository |
| [partie-04-02-setup-react-vite.md](partie-04-02-setup-react-vite.md) | Patron Vite + CORS |
| [partie-05-03-securiser-admin-spring.md](partie-05-03-securiser-admin-spring.md) | Règles JWT `/admin/**` |
| [partie-07-03-tests-tp-commentaires.md](partie-07-03-tests-tp-commentaires.md) | Patron tests TP (commentaires) |

> 🔒 **Corrigé formateur :** [partie-07-02-corrige-formateur.md](partie-07-02-corrige-formateur.md) — **ne pas consulter** avant d'avoir essayé.

---

## ✅ Checklist finale

### Backend

- [ ] `GET /admin/articles` et `GET /admin/articles/{id}` (JWT)
- [ ] Commentaires GET + POST + DELETE admin
- [ ] Catégories GET + CRUD admin
- [ ] Médias GET par article + POST/DELETE admin
- [ ] `GET /users/{id}` sans mdp + admin users
- [ ] `./mvnw test` vert

### Front + doc

- [ ] Dossier `site/` — accueil + détail + poster un commentaire
- [ ] `doc/API.md` complet
- [ ] `README.md` mis à jour
- [ ] Commits sur `partie-07`

---

## Suite

👉 Consulte **`INDEX.md`** — fin du parcours formation. Prolongements possibles : déploiement, Docker (cours dédié), pagination, upload fichiers médias.
