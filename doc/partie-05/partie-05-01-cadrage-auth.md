# Partie 05 — Étape 01
# Cadrage : authentification et verrouillage de l'admin

> 📘 **Lis ce doc en premier.** Pas de code ici : on pose le **vocabulaire**, le **choix technique** (JWT) et le **plan** des 3 étapes.  
> 🗣️ **On vulgarise :** l'auth = prouver **qui tu es** ; la sécurité Spring = le **videur** qui bloque `/admin` sans badge.  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** partie 04 terminée (back-office React CRUD articles, branche `partie-04` commitée).

## Objectif de cette étape

Comprendre **pourquoi** et **comment** on va sécuriser le blog **avant** d'ajouter Spring Security et le login React :

- différence **authentification** / **autorisation** ;
- pourquoi `/admin` est ouvert aujourd'hui (et pourquoi ce n'est plus acceptable) ;
- choix retenu : **JWT** (pas de session serveur) ;
- quels **fichiers Java** et **composants React** seront créés ;
- branche Git **`partie-05`**.

---

## Todo

- [ ] Comprendre auth vs autorisation
- [ ] Retenir le flux login → token → appels `/admin`
- [ ] Retenir la liste des fichiers à créer (Java + React)
- [ ] Créer la branche Git `partie-05` depuis `partie-04`
- [ ] Passer à `partie-05-02-login-api-jwt.md`

---

> **Encadré continuité — de l'API ouverte au verrou**  
> **Partie 03** : CRUD admin codé (`POST / PUT / DELETE /admin/articles`) — **sans** vérifier l'identité.  
> **Partie 04** : React appelle ces routes en `fetch` — **n'importe qui** peut le faire avec curl.  
> **Partie 05** : on ajoute **`POST /auth/login`**, un **token JWT**, et Spring **refuse** `/admin/**` sans token valide.  
> **Partie 06** : tests + CI sur ce socle sécurisé.  
> **Partie 07** : TP routes restantes (commentaires, catégories…).

---

## Parcours de la partie 05

| Doc | Tu fais… |
|---|---|
| **partie-05-01** *(ici)* | Cadrage + branche Git |
| [partie-05-02-login-api-jwt.md](partie-05-02-login-api-jwt.md) | `User`, repository, `POST /auth/login`, génération JWT |
| [partie-05-03-securiser-admin-spring.md](partie-05-03-securiser-admin-spring.md) | Spring Security : filtre JWT + `/admin/**` protégé |
| [partie-05-04-login-react.md](partie-05-04-login-react.md) | Écran login React + token dans les `fetch` |

Chaque support : **objectif**, **pourquoi**, **code commenté**, **todo**, **commit Git**.

---

## 1. Le problème aujourd'hui

```
curl -X DELETE http://localhost:8080/admin/articles/1
```

→ **Fonctionne** sans login. En production, ce serait une **faille grave**.

| Route | Aujourd'hui | Après partie 05 |
|---|---|---|
| `GET /articles/**` | Public ✅ | Public ✅ |
| `GET /ping`, `/db/ping` | Public ✅ | Public ✅ |
| `POST /auth/login` | N'existe pas | Public ✅ (pour obtenir un token) |
| `POST/PUT/DELETE /admin/**` | **Ouvert** ❌ | **Token obligatoire** ✅ |

> 💡 Le préfixe `/admin` **préparait** le back-office ; la **partie 05** ajoute le **verrou**.

---

## 2. Authentification vs autorisation

| Mot | Question | Exemple blog |
|---|---|---|
| **Authentification** (*authN*) | **Qui es-tu ?** | Mail + mot de passe → login OK |
| **Autorisation** (*authZ*) | **As-tu le droit ?** | Token valide → accès `/admin` |

**Métaphore — boîte de nuit :**

1. **Authentification** = montrer ta carte d'identité à l'entrée.
2. **Autorisation** = le videur te laisse entrer dans la **loge admin** (pas tout le monde).

Dans notre projet, on simplifie : **un utilisateur connecté = admin** (pas de rôles `ADMIN` / `USER` pour l'instant).

---

## 3. Session vs JWT — pourquoi JWT ?

Deux approches classiques :

| Approche | Principe | Avantage | Inconvénient |
|---|---|---|---|
| **Session serveur** | Spring garde un id en mémoire ; le navigateur envoie un **cookie** | Simple en monolithique | Cookie + CORS entre ports 5173 et 8080 = config délicate |
| **JWT** | Le serveur signe un **jeton** ; le client le renvoie à chaque requête | Adapté au **React** sur un autre port | Token volé = accès tant qu'il est valide |

**Choix du cours : JWT**

- React (`admin/`, port **5173**) et Spring (**8080**) = **origines différentes**.
- On envoie le token dans l'en-tête HTTP :  
  `Authorization: Bearer eyJhbGciOiJIUzI1NiIs…`
- **Logout** côté React = **supprimer le token** du `localStorage` (pas de session serveur à invalider en v1).

> ❓ **JWT en une phrase :** une **carte plastifiée signée** par le serveur — le client la présente à chaque appel `/admin` ; Spring vérifie la signature.

---

## 4. Flux complet (vue d'ensemble)

```
┌─────────────┐                    ┌─────────────┐
│  React      │  POST /auth/login  │  Spring     │
│  LoginForm  │  { mail, mdp }     │  AuthCtrl   │
└──────┬──────┘ ─────────────────► └──────┬──────┘
       │                                  │
       │◄──────── { token, pseudo } ──────┤  vérifie mdp (BCrypt)
       │                                  │  génère JWT
       ▼
  localStorage.token = "eyJ…"
       │
       │  GET/POST /admin/articles
       │  Header: Authorization: Bearer eyJ…
       ▼
┌─────────────┐                    ┌─────────────┐
│  api/       │ ─────────────────► │  Filtre JWT │
│  articles.js│                    │  + Security │
└─────────────┘                    └──────┬──────┘
                                          │
                              token OK ? ─┼─► controller admin
                              token KO ? ─┼─► 401 Unauthorized
```

**Étapes élève :**

1. **05-02** — route login + génération JWT (API testable avec curl).
2. **05-03** — filtre qui lit le header ; `/admin/**` exige un token.
3. **05-04** — écran login React ; `fetch` admin envoie le header.

---

## 5. Routes auth (conçues en partie 02)

D'après [partie-02-06-corrige-routes-blog.md](partie-02-06-corrige-routes-blog.md) :

| URL | Verbe | Qui | Action | Partie 05 |
|---|---|---|---|---|
| `/auth/login` | POST | Public | Mail + mdp → token | ✅ 05-02 |
| `/auth/logout` | POST | Connecté | Déconnexion | 💡 Optionnel — logout = effacer le token côté React |

**Corps JSON login (entrée) :**

```json
{
  "mail": "alice@example.com",
  "mdp": "demo1234"
}
```

**Réponse OK (200) :**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…",
  "pseudo": "alice_dev",
  "userId": 1
}
```

> ⚠️ **Jamais** renvoyer le champ `mdp` de la table `users` en JSON.

---

## 6. Table `users` — rappel BDD

D'après [blog.sql](blog.sql) :

| Colonne | Rôle |
|---|---|
| `id` | Identifiant |
| `pseudo` | Nom affiché |
| `mail` | Login (unique en pratique) |
| `mdp` | Mot de passe **hashé** (BCrypt) |

Les données de démo utilisent `hash_placeholder_1` — **pas utilisable** pour un vrai login.  
À l'étape **05-02**, exécute [doc/sql/upgrade-05-01-bcrypt-alice.sql](sql/upgrade-05-01-bcrypt-alice.sql) (mot de passe démo **`demo1234`**).

> 🔐 **Règle production :** ne **jamais** stocker un mot de passe en clair en base.

---

## 7. Fichiers Java prévus

Même logique **couches** qu'en partie 03 :

| Fichier | Rôle |
|---|---|
| `model/User.java` | Ligne table `users` |
| `dto/LoginRequest.java` | JSON entrant login (`mail`, `mdp`) |
| `dto/LoginResponse.java` | JSON sortant (`token`, `pseudo`, `userId`) |
| `repository/UserRepository.java` | SQL : `findByMail` |
| `service/JwtService.java` | Créer / valider un JWT |
| `controller/AuthController.java` | `POST /auth/login` |
| `config/SecurityConfig.java` | Règles : public vs `/admin/**` |
| `config/JwtAuthFilter.java` | Lire le header `Authorization` |

> 💡 **Pas de JPA** — on reste en **JDBC** comme pour `ArticleRepository`.

**Dépendances Maven** (ajoutées à l'étape 05-02 — confirmation avant modification du `pom.xml`) :

| Dépendance | Rôle |
|---|---|
| `spring-boot-starter-security` | Filtres, BCrypt, config |
| `jjwt-api` + `jjwt-impl` + `jjwt-jackson` | Créer / parser les JWT |

Secret JWT : variable d'environnement ou `application.yaml` (**jamais** committer un secret de prod).

---

## 8. Côté React — ce qui change (étape 05-04)

| Avant (partie 04) | Après (partie 05) |
|---|---|
| `App` affiche directement la liste | `App` vérifie si un **token** existe |
| `fetch` sans header auth | `fetch` avec `Authorization: Bearer …` |
| Pas d'écran login | **`LoginForm.jsx`** (mail + mdp) |

**Nouveaux fichiers React prévus :**

```
admin/src/
├── api/
│   ├── articles.js    ← ajout header Authorization
│   └── auth.js        ← login(), logout(), getToken()
├── components/
│   └── LoginForm.jsx
└── App.jsx            ← if (!token) → LoginForm else → CRUD
```

> 💡 **Pas de React Router** — une seule page : soit login, soit back-office (comme en partie 04).

---

## 9. Ce qu'on ne fait PAS (partie 05)

| Sujet | Pourquoi pas maintenant |
|---|---|
| Inscription publique `POST /users` | Partie 07 (TP) |
| Rôles `ADMIN` / `EDITOR` | Un user connecté = admin suffit pour le cours |
| Refresh token | Complexité inutile à ce stade |
| OAuth / Google login | Hors périmètre |
| CRUD `/admin/users` | Partie 07 |
| Hash des 10 users du seed | Un seul compte démo (`alice`) suffit |

---

## 10. Status HTTP à connaître

| Code | Situation |
|---|---|
| **200** | Login OK — token renvoyé |
| **401** | Mail/mdp incorrect **ou** token absent/invalide sur `/admin` |
| **403** | Token valide mais pas le droit (rare ici — on simplifie) |

---

## Commits Git attendus (`partie-05`)

| Commit | Document |
|---|---|
| `05-02` | [partie-05-02-login-api-jwt.md](partie-05-02-login-api-jwt.md) |
| `05-03` | [partie-05-03-securiser-admin-spring.md](partie-05-03-securiser-admin-spring.md) |
| `05-04` | [partie-05-04-login-react.md](partie-05-04-login-react.md) |

> 💡 **`partie-05-01`** = cadrage + création branche — pas de commit dédié.

---

## Créer la branche Git `partie-05`

Comme aux parties précédentes : **une branche = une étape**.

```bash
git checkout partie-04
git checkout -b partie-05
git branch
```

**Explication :**

- `git checkout partie-04` → état validé (React CRUD + API partie 03).
- `git checkout -b partie-05` → nouvelle branche pour l'auth.
- `git branch` → la `*` doit être sur `partie-05`.

> 💡 **Pas de commit ici** — le premier commit viendra à l'étape 05-02 (login API).

> ✅ **Vérifie :** Spring Boot + React admin fonctionnent encore **sans** auth (normal — le verrou arrive en 05-03).

---

## ✅ Récapitulatif

- [ ] **AuthN** = qui tu es ; **AuthZ** = as-tu le droit
- [ ] **JWT** retenu pour React + API sur deux ports
- [ ] **`POST /auth/login`** → token ; **`/admin/**`** protégé ensuite
- [ ] Mots de passe **BCrypt** ; jamais `mdp` dans le JSON de réponse
- [ ] Branche **`partie-05`** créée

---

## Suite

👉 **[partie-05-02-login-api-jwt.md](partie-05-02-login-api-jwt.md)** — `User`, repository, BCrypt, `AuthController`, génération JWT.
