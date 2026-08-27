# Partie 02 — Étape 05
# Concevoir les routes du blog (sans coder)

> 📘 **Exercice de réflexion.** Tu ne codes **rien** ici : tu listes les **routes** (URL + action) dont l'application aura besoin pour gérer un vrai blog. À la partie 03, vous les implémenterez et on parlera des **verbes HTTP** (`GET`, `POST`, `PUT`, `DELETE`).  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** `partie-02-04-premiere-route-bdd.md` terminée (`/articles/recents` OK).

---

## Objectif

À la fin de cet exercice, tu dois avoir une **carte des routes** couvrant :

- la partie **publique** (lecture du blog) ;
- la partie **admin** (gestion du contenu) ;
- les **commentaires**, **catégories**, **médias** et **utilisateurs**.

> 🧵 **Fil rouge :** à l'étape 03, tu as testé le câble (`/db/ping`). À l'étape 04, tu as créé une première route qui lit la base (`/articles/recents`). Maintenant, tu **planifies** le reste de l'API avant de coder.

---

## Rappel : qu'est-ce qu'une route ?

Une route = **une adresse** + **une action** + (bientôt) **un verbe HTTP**.

| Exemple | Action |
|---|---|
| `GET /articles` | Lister les articles |
| `GET /articles/5` | Voir l'article n°5 |
| `POST /articles` | Créer un article *(à implémenter plus tard)* |

Tu peux noter le verbe HTTP si tu le devines. Ce n'est pas grave si tu n'es pas sûr : on corrigera ensemble.

---

## Rappel : les tables de notre base (`blog.sql`)

| Table | Contenu |
|---|---|
| `users` | Utilisateurs (pseudo, mail, mdp) |
| `articles` | Articles (titre, contenu, date, statut publié/brouillon, auteur) |
| `commentaires` | Commentaires sur un article |
| `catégories` | Catégories (nom, description) |
| `médias` | Fichiers (image, vidéo, gif, musique + URL) |
| `articles_categories` | Lien article ↔ catégorie (plusieurs catégories par article) |
| `articles_medias` | Lien article ↔ média |

---

## Consigne principale

**En binôme ou petit groupe**, remplis un tableau avec **toutes les routes** dont tu penses avoir besoin.

Pour chaque route, indique :

| Colonne | Exemple |
|---|---|
| **URL** | `/articles/{id}/commentaires` |
| **Verbe HTTP** *(si tu sais)* | `GET` |
| **Qui ?** | Public / Admin |
| **Action en français** | Lister les commentaires d'un article |

### Règles du jeu

1. **Pas de code Java** — uniquement des routes sur papier ou dans un tableur.
2. Pense **public** ET **admin** (un admin publie, modère, supprime…).
3. Pense aux **relations** : un article a des commentaires, des catégories, des médias, un auteur.
4. N'oublie pas les routes **techniques** déjà vues (`/ping`, `/db/ping`…).
5. Ose proposer des routes même si tu n'es pas sûr du verbe — on discutera.

---

## Grille de travail (à compléter)

### A — Routes déjà en place (à ne pas oublier)

| URL | Verbe | Public / Admin | Action |
|---|---|---|---|
| `/ping` | GET | Public | … |
| `/db/ping` | GET | ? | … |
| `/articles` | GET | Public | … |
| `/articles/{numero}` | GET | Public | … |
| `/articles/recents` | GET | Public | … |
| | | | |
| *(ajoute les tiennes)* | | | |

### B — Articles

| URL | Verbe | Public / Admin | Action |
|---|---|---|---|
| | | | |
| | | | |

**Pistes :** lister, voir un article par id, les récents, les publiés seulement, créer, modifier, supprimer, publier/dépublier…

### C — Commentaires

| URL | Verbe | Public / Admin | Action |
|---|---|---|---|
| | | | |

**Pistes :** commentaires d'un article, ajouter un commentaire, supprimer (modération)…

### D — Catégories

| URL | Verbe | Public / Admin | Action |
|---|---|---|---|
| | | | |

**Pistes :** lister les catégories, articles d'une catégorie, CRUD admin…

### E — Médias

| URL | Verbe | Public / Admin | Action |
|---|---|---|---|
| | | | |

**Pistes :** médias d'un article, upload, suppression…

### F — Utilisateurs & admin

| URL | Verbe | Public / Admin | Action |
|---|---|---|---|
| | | | |

**Pistes :** connexion, profil, liste des auteurs, gestion des comptes admin…

---

## Questions pour t'aider à réfléchir

Réponds par écrit avant de rendre ton tableau :

1. Un **visiteur** non connecté peut-il lire un article **non publié** ?
2. Qui peut **poster un commentaire** ?
3. Qui peut **supprimer** un commentaire offensant ?
4. Un article peut avoir **plusieurs catégories** — quelle route liste les articles d'une catégorie ?
5. Faut-il une route pour **compter** les articles ? Les commentaires ?
6. L'admin a-t-il besoin de voir les **brouillons** séparément des articles publiés ?
7. Faut-il une route **santé** pour vérifier que l'API et la base répondent ?

---

## Critères de réussite (auto-évaluation)

Avant de regarder le corrigé, vérifie :

- [ ] Au moins **3 routes articles** (au-delà de celles déjà codées)
- [ ] Au moins **2 routes commentaires**
- [ ] Au moins **2 routes catégories**
- [ ] Au moins **1 route médias**
- [ ] Au moins **2 routes admin ou utilisateurs**
- [ ] Tu as distingué **public** et **admin**
- [ ] Tu as utilisé des **paramètres** dans l'URL (`{id}`, `{slug}`…) quand c'est pertinent

---

## Rendu

- **Format :** tableau papier, Google Sheet, ou fichier Markdown.
- **Nommage :** `routes-blog-[ton-nom].md` ou rendu en fin de séance.
- **Ne consulte pas** le corrigé avant d'avoir fini.

---

## Suite

Consulte **`INDEX.md`** pour la partie 03 (couches, DTO, CRUD admin).

> 👉 **Corrigé formateur :** `partie-02-06-corrige-routes-blog.md` — à ne pas distribuer avant la réflexion.
