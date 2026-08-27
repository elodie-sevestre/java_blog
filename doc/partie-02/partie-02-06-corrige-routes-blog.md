# Partie 02 — Corrigé
# Routes du blog (exercice étape 05)

> 📘 **Document formateur / correction.** À distribuer **après** l'exercice `partie-02-05-concevoir-les-routes.md`, ou à projeter pour la mise en commun.

---

## Comment utiliser ce corrigé

- Il n'y a pas **une seule** bonne réponse : les URL peuvent varier (`/articles/5` vs `/article/5`).
- L'important : **couvrir les besoins métier** et être **cohérent**.
- Les verbes HTTP sont indiqués : c'est ce qu'on verra **en détail à la partie 03**.

**Légende :**

| Symbole | Signification |
|---|---|
| ✅ | Attendu / essentiel à ce stade |
| 💡 | Variante acceptable |
| ⭐ | Bonus (bon réflexe, pas obligatoire partie 02) |

---

## 1. Routes déjà en place dans le projet

| URL | Verbe | Qui | Action | Statut |
|---|---|---|---|---|
| `/ping` | GET | Public | Vérifier que l'API répond | ✅ Codé partie 01 |
| `/articles` | GET | Public | Lister des articles (en dur, partie 01) | ✅ Codé partie 01 |
| `/articles/{numero}` | GET | Public | Un article par position en mémoire | ✅ Codé partie 01 → remplacé par `/articles/{id}` à la **partie 03** |
| `/db/ping` | GET | Admin / technique | Tester la connexion PostgreSQL | ✅ Codé étape 03 |
| `/articles/recents` | GET | Public | 5 derniers articles en base (tous statuts) | ✅ Codé étape 04 |

---

## 2. Vue d'ensemble par ressource

```
PUBLIC                          ADMIN
──────                          ─────
GET  /articles                  POST   /admin/articles
GET  /articles/{id}             PUT    /admin/articles/{id}
GET  /articles/recents          DELETE /admin/articles/{id}
GET  /articles/publies          PATCH  /admin/articles/{id}/publier
GET  /articles/{id}/commentaires       /admin/articles/{id}/depublier
POST /articles/{id}/commentaires
GET  /categories
GET  /categories/{id}/articles
GET  /articles/{id}/medias
```

---

## 3. Articles

### Public (lecture)

| URL | Verbe | Action | Note |
|---|---|---|---|
| `/articles` | GET | Lister les articles **publiés** | Remplacera la version en dur |
| `/articles/{id}` | GET | Détail d'un article publié | Par **id** base, pas position 0/1 |
| `/articles/recents` | GET | Les N derniers articles (tous statuts) | ✅ Déjà codé (5 fixes) |
| `/articles/publies` | GET | Tous les articles publiés | 💡 ou filtre `?statut=publie` |
| `/articles/recents/count` | GET | Nombre d'articles récents | ⭐ Bonus exercice étape 04 |

### Admin (gestion)

| URL | Verbe | Action | Note |
|---|---|---|---|
| `/admin/articles` | GET | Lister **tous** les articles (brouillons inclus) | Espace admin |
| `/admin/articles/{id}` | GET | Voir un article même en brouillon | |
| `/admin/articles` | POST | **Créer** un article | Corps JSON : titre, contenu… |
| `/admin/articles/{id}` | PUT | **Modifier** un article entier | |
| `/admin/articles/{id}` | PATCH | Modifier un champ (ex. titre seul) | ⭐ Bonus |
| `/admin/articles/{id}` | DELETE | **Supprimer** un article | |
| `/admin/articles/{id}/publier` | PATCH | Passer `statut` à publié | 💡 ou `PUT` avec statut |
| `/admin/articles/{id}/depublier` | PATCH | Repasser en brouillon | |

> ❓ **Pourquoi `/admin/...` ?** Pour séparer clairement public et back-office. Variante acceptable : `/articles` avec authentification admin (on verra plus tard).

---

## 4. Commentaires

| URL | Verbe | Qui | Action |
|---|---|---|---|
| `/articles/{id}/commentaires` | GET | Public | Lister les commentaires d'un article |
| `/articles/{id}/commentaires` | POST | Public* | Ajouter un commentaire |
| `/commentaires/{id}` | GET | Public | Voir un commentaire |
| `/admin/commentaires/{id}` | DELETE | Admin | Modérer / supprimer |
| `/admin/commentaires` | GET | Admin | Tous les commentaires (modération) | ⭐ |

\* *En production, souvent réservé aux utilisateurs connectés — pas encore géré.*

**Ce que les élèves oublient souvent :**

- La route est **imbriquée** sous l'article (`/articles/{id}/commentaires`), pas seulement `/commentaires`.
- La **suppression** est admin (modération).

---

## 5. Catégories

| URL | Verbe | Qui | Action |
|---|---|---|---|
| `/categories` | GET | Public | Lister toutes les catégories |
| `/categories/{id}` | GET | Public | Détail d'une catégorie |
| `/categories/{id}/articles` | GET | Public | Articles d'une catégorie |
| `/admin/categories` | POST | Admin | Créer une catégorie |
| `/admin/categories/{id}` | PUT | Admin | Modifier |
| `/admin/categories/{id}` | DELETE | Admin | Supprimer |
| `/admin/articles/{id}/categories` | PUT | Admin | Associer des catégories à un article | ⭐ |

**Lien avec la base :** table `catégories` + table de jonction `articles_categories` (N-N).

---

## 6. Médias

| URL | Verbe | Qui | Action |
|---|---|---|---|
| `/articles/{id}/medias` | GET | Public | Médias liés à un article |
| `/medias/{id}` | GET | Public | Détail d'un média |
| `/admin/medias` | POST | Admin | Ajouter un média (URL, type) |
| `/admin/medias/{id}` | DELETE | Admin | Supprimer |
| `/admin/articles/{id}/medias` | POST | Admin | Lier un média à un article | ⭐ |

**Types possibles (enum SQL) :** `image`, `video`, `gif`, `musique`.

---

## 7. Utilisateurs & authentification

| URL | Verbe | Qui | Action |
|---|---|---|---|
| `/users/{id}` | GET | Public | Profil public (pseudo, sans mdp) |
| `/admin/users` | GET | Admin | Lister les utilisateurs |
| `/admin/users/{id}` | GET | Admin | Fiche utilisateur |
| `/admin/users` | POST | Admin | Créer un compte |
| `/auth/login` | POST | Public | Connexion (mail + mdp) | ⭐ Partie ultérieure |
| `/auth/logout` | POST | Connecté | Déconnexion | ⭐ |

> ⚠️ **Jamais** de route qui renvoie le champ `mdp` en JSON.

---

## 8. Routes techniques & santé

| URL | Verbe | Action |
|---|---|---|
| `/ping` | GET | API vivante |
| `/db/ping` | GET | Base accessible + compteur articles |
| `/health` | GET | État global API + BDD | ⭐ |
| `/db/version` | GET | Version PostgreSQL | ⭐ Bonus étape 03 |

---

## 9. Tableau récapitulatif — « ont-ils pensé à tout ? »

| Besoin métier | Route(s) attendue(s) | Souvent oublié ? |
|---|---|---|
| Lire un article par id | `GET /articles/{id}` | Non |
| Distinguer publié / brouillon | `/articles/publies`, `/admin/articles` | **Oui** |
| CRUD article admin | POST, PUT, DELETE sur `/admin/articles` | **Oui** (surtout DELETE) |
| Commentaires d'un article | `GET/POST .../articles/{id}/commentaires` | **Oui** (imbriquation) |
| Modération commentaires | `DELETE /admin/commentaires/{id}` | **Oui** |
| Catégories + filtre articles | `GET /categories`, `GET /categories/{id}/articles` | **Oui** |
| Médias d'un article | `GET /articles/{id}/medias` | **Oui** |
| Utilisateurs sans mot de passe | `GET /users/{id}` (sans mdp) | **Oui** |
| Connexion admin | `POST /auth/login` | ⭐ Bonus |
| Santé technique | `/ping`, `/db/ping` | Parfois oublié `/db/ping` |

---

## 10. Verbes HTTP — teaser partie 03

| Verbe | Rôle | Exemple |
|---|---|---|
| **GET** | **Lire** sans modifier | Lister des articles |
| **POST** | **Créer** une ressource | Nouvel article, nouveau commentaire |
| **PUT** | **Remplacer** une ressource entière | Modifier tout l'article |
| **PATCH** | **Modifier partiellement** | Publier / dépublier |
| **DELETE** | **Supprimer** | Supprimer un commentaire |

> 💬 **« Mode verbeux »** : à la partie 03, on nommera et utilisera explicitement ces verbes dans Spring (`@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`…).

---

## 11. Ordre d'implémentation suggéré

**À la partie 03** (`partie-03-01` → `partie-03-05`), on suit cet ordre :

1. Refactorer les GET publics depuis la base (`GET /articles`, `/articles/{id}`, `/articles/recents`…) — couches repository + mapper *(partie 03)*
2. CRUD admin : `POST` / `PUT` / `DELETE` sur `/admin/articles`
3. *(Partie 07 — TP)* commentaires, catégories, médias, users…

> 💡 Le corrigé ci-dessus liste **toute** l'API du blog. **Partie 03** code le **CRUD articles** ; **partie 07 (TP)** couvrira le reste (commentaires, catégories, médias, users).

---

## 12. Débrief formateur (5 min)

Questions à poser en classe :

1. « Qui a mis une route **sans** verbe HTTP ? » → Normal à ce stade.
2. « Qui a séparé **public** et **admin** ? » → Bon réflexe sécurité.
3. « Qui a pensé aux **brouillons** ? » → Lien avec `statut` en base.
4. « Qui a imbriqué les commentaires sous `/articles/{id}/...` ? » → REST classique.

**Message de clôture :** *« Vous avez conçu l'API ; à la partie 03, vous la coderez proprement — couche par couche, verbe par verbe. »*
