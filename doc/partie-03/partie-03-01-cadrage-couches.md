# Partie 03 — Étape 01
# Cadrage : pourquoi séparer les couches

> 📘 **Lis ce doc en premier.** Pas de code ici : on pose le vocabulaire.  
> Ensuite tu codes **un fichier Java à la fois** (`partie-03-02` → `partie-03-05`).  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** partie 02 terminée (`partie-02-05` + `/articles/recents` OK, branche `partie-02` commitée).

## Objectif de cette étape

**Comprendre le plan de la partie 03** avant d'écrire du code : pourquoi on découpe le projet en fichiers, et qui fait quoi (controller, DTO, model, repository, mapper).

---

## Todo

- [ ] Comprendre les couches et les 2 mappings
- [ ] Créer la branche Git `partie-03` depuis `partie-02`
- [ ] Passer à `partie-03-02-model-et-dtos.md`

---

> **Encadré continuité — de la partie 02 à la partie 03**  
> **Partie 02** : tu as branché PostgreSQL (`/db/ping`), lu des articles avec du SQL **dans le controller** (`ArticleBddController`), puis **conçu sur papier** toute l'API (`partie-02-05`).  
> **Partie 03** : on **refactorise** avant d'aller plus loin :  
> - **`Article`** = **seul model** — classe + getters/setters (enrichi des colonnes BDD) ;  
> - **DTO** = **records** pour le JSON ;  
> - **SQL** = uniquement dans **`ArticleRepository`** ;  
> - **INSERT** : PostgreSQL renvoie l'id via **`RETURNING id`** → `article.setId(id)`.  
> On supprime le code « post-it » de la partie 01 et le SQL inline de la partie 02, puis on code le **CRUD admin** (POST / PUT / DELETE).  
> **Partie 04** : frontend **React** back-office (consomme cette API).  
> **Partie 05** : authentification JWT et sécurisation de `/admin`.  
> **Partie 06** : tests, CI et documentation.  
> **Partie 07** *(TP)* : routes restantes (commentaires, catégories…) + front-office public.

---

## Parcours de la partie 03

| Doc | Tu crées… |
|---|---|
| **partie-03-01** *(ici)* | Comprendre les couches + branche Git |
| [partie-03-02-model-et-dtos.md](partie-03-02-model-et-dtos.md) | `Article` + 3 DTO + nettoyage partie 01 |
| [partie-03-03-mapper-et-repository.md](partie-03-03-mapper-et-repository.md) | `ArticleMapper` + `ArticleRepository` |
| [partie-03-04-controller-get-public.md](partie-03-04-controller-get-public.md) | `ArticleController` (GET) + fin du nettoyage |
| [partie-03-05-controller-admin-crud.md](partie-03-05-controller-admin-crud.md) | `AdminArticleController` (POST / PUT / DELETE) |

---

## Où on en est — pourquoi cette partie existe

| Moment | GET (lecture) | POST / PUT / DELETE (écriture) |
|---|---|---|
| Partie 01–02 | Codé (souvent SQL **dans** le contrôleur) | Conçu sur papier (`partie-02-05`) |
| **Partie 03** | Recodé avec **couches** | **Codé pour la 1ʳᵉ fois** |

**Pourquoi changer ?**  
À la partie 02 (`ArticleBddController`), une seule classe faisait tout : recevoir l'HTTP, exécuter le SQL, renvoyer le JSON. Ça marche pour une route — pas pour dix. Ici, **chaque métier a son fichier**.

---

## 1 fichier `.java` = 1 classe Java

**Pourquoi c'est important :** en Java, on ne mélange pas plusieurs classes dans un même fichier. Quand tu cherches « où est le SQL ? », tu vas directement dans `ArticleRepository.java`.

| Fichier | Classe | Rôle | Pourquoi ce fichier ? |
|---|---|---|---|
| `model/Article.java` | `Article` | Une ligne BDD | Représenter la table en Java |
| `dto/ArticleResponse.java` | `ArticleResponse` | JSON **sortant** | Ne pas exposer toute la BDD au client |
| `dto/ArticleCreateRequest.java` | `ArticleCreateRequest` | JSON **entrant** (POST) | Décrire ce qu'on envoie pour créer |
| `dto/ArticleUpdateRequest.java` | `ArticleUpdateRequest` | JSON **entrant** (PUT) | Décrire ce qu'on envoie pour modifier |
| `mapper/ArticleMapper.java` | `ArticleMapper` | Model → DTO | Filtrer les champs avant le JSON |
| `repository/ArticleRepository.java` | `ArticleRepository` | **Tout le SQL** | Un seul endroit pour la base |
| `controller/ArticleController.java` | `ArticleController` | GET publics | Routes de lecture |
| `controller/AdminArticleController.java` | `AdminArticleController` | CRUD admin | Routes d'écriture séparées |

> 💡 **`Article.java`** contient **`public class Article`** avec getters/setters (comme aux parties 01–02).  
> Les **DTO** sont des **records** (syntaxe plus courte).  
> Le nom du fichier = le nom de la classe.

---

## Les couches — pourquoi les séparer ?

**Objectif :** chaque couche ne fait **qu'une chose**. Plus facile à lire, à tester, à faire évoluer.

```
Navigateur
    │  JSON (DTO)
    ▼
Controller     → routes HTTP, status 200 / 404 / 201…
    │
    ▼
Mapper         → Article → ArticleResponse
    │
    ▼
Repository     → SQL + RowMapper
    │
    ▼
PostgreSQL
```

| Couche | Contient du SQL ? | Gère le 404 ? |
|---|---|---|
| Controller | Non | **Oui** |
| Repository | **Oui** | Non |
| Mapper / DTO | Non | Non |

> 🗣️ **`Optional`** (dans `findById`) = une boîte qui contient un article… ou est **vide**. Le repository tend la boîte ; le **controller** décide du 404 si elle est vide.

---

## Les deux mappings — pourquoi deux traductions ?

**Objectif :** savoir **où** modifier si la BDD change vs si le JSON change.

| # | Traduction | Où ? |
|---|---|---|
| ① | Ligne SQL → `Article` | `RowMapper` dans le **repository** | Comme « lire une ligne pgAdmin → remplir une fiche Article » |
| ② | `Article` → `ArticleResponse` | **`ArticleMapper`** (appelé par le controller) | Comme « dresser l'assiette client à partir de la fiche cuisine » |

```
PostgreSQL ─①─► Article ─②─► ArticleResponse ─► JSON
```

> ❓ **Quiz :** tu changes la colonne SQL `statut` en `published` → tu modifies le mapping **①** seulement.

---

## Model `Article` — même syntaxe qu'avant

**Objectif :** le model reste une **classe** avec champs `private`, constructeur, **getters** et **setters** — comme `ArticleBdd` à la partie 02.

| Action | Syntaxe |
|---|---|
| Lire le titre | `article.getTitre()` |
| Lire si publié | `article.isPublie()` |
| Modifier (PUT) | `article.setTitre("…")`, `article.setPublie(true)`… |
| Id après INSERT | `article.setId(id)` dans `save()` |

Les **3 DTO** (`ArticleResponse`, etc.) sont des **records** : `body.titre()` pour lire le JSON entrant.

---

## Règles d'or

1. **SQL** → uniquement dans `ArticleRepository`.
2. **404 / 201 / 204** → uniquement dans les **controllers**.
3. **JSON public** → toujours via un **DTO** (`ArticleMapper.toResponse`).

---

## Périmètre de la partie 03

| Route / sujet | Partie 03 |
|---|---|
| GET publics (`/articles`, `/{id}`, `/recents`, `/recents/count`) | ✅ Codé étape 04 |
| POST / PUT / DELETE `/admin/articles` | ✅ Codé étape 05 |
| GET `/admin/articles` (liste brouillons…) | 💡 Partie 04 back-office — optionnel avant auth |
| Commentaires, catégories, médias, users | 📋 Partie 07 (TP) |
| Auth `/auth/login` | 🔐 Partie 05 |

---

## Commits Git attendus (`partie-03`)

| Commit | Document |
|---|---|
| `03-02` | [partie-03-02-model-et-dtos.md](partie-03-02-model-et-dtos.md) |
| `03-03` | [partie-03-03-mapper-et-repository.md](partie-03-03-mapper-et-repository.md) |
| `03-04` | [partie-03-04-controller-get-public.md](partie-03-04-controller-get-public.md) |
| `03-05` | [partie-03-05-controller-admin-crud.md](partie-03-05-controller-admin-crud.md) |

> 💡 **`partie-03-01`** = cadrage + création branche — pas de commit dédié.

---

## Créer la branche Git `partie-03`

Comme aux parties 01 et 02 : **une branche = une étape**. Le refactor vit sur **`partie-03`** ; `partie-02` reste figée.

> ⚠️ **Prérequis :** branche `partie-02` commitée (au minimum les commits `02-03` et `02-04`).

Ouvre un terminal **à la racine du projet** (là où se trouve `pom.xml`) :

```bash
git checkout partie-02
git checkout -b partie-03
git branch
```

**Explication :**

- `git checkout partie-02` → tu repars de l'état validé en fin de partie 02.
- `git checkout -b partie-03` → crée et active la branche **`partie-03`**.
- `git branch` → vérifie que la `*` est sur `partie-03`.

> 💡 **Pas de commit ici :** le premier commit viendra à l'étape 02 (model + DTO).

> ✅ **Vérifie :** `git branch` affiche `* partie-03`. `/db/ping` et `/articles/recents` fonctionnent encore.

---

## Suite

👉 Passe à **[partie-03-02-model-et-dtos.md](partie-03-02-model-et-dtos.md)** : tu crées `Article` et les 3 DTO.
