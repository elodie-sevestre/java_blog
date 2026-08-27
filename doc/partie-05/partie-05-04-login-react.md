# Partie 05 — Étape 04
# Login React — token, header `Authorization` et récap partie 05

> 📘 **Ce document est ton support.** On branche le **login** sur l'API Java, on stocke le **JWT**, et on l'envoie sur **chaque appel `/admin`**.  
> 🗣️ **On vulgarise :** `localStorage` = le **tiroir** du navigateur où tu ranges le badge ; `Authorization: Bearer …` = le montrer au videur à chaque requête admin.  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** [partie-05-03-securiser-admin-spring.md](partie-05-03-securiser-admin-spring.md) (commit `05-03` OK ; curl admin avec token OK).

## Ce que tu auras à la fin de cette étape

- **`api/auth.js`** — login, logout, lecture du token (`localStorage`).
- **`LoginForm.jsx`** — écran mail + mot de passe.
- **`api/articles.js`** — header **`Authorization`** sur POST / PUT / DELETE admin.
- **`App.jsx`** — pas de token → login ; token OK → back-office CRUD + bouton **Déconnexion**.
- **Partie 05 complète** : Java + React sécurisés.

> ⏱️ **Durée estimée :** 60 à 75 minutes.

---

## Todo

- [ ] Créer `api/auth.js`
- [ ] Créer `LoginForm.jsx`
- [ ] Mettre à jour `api/articles.js` (header sur routes admin)
- [ ] Adapter `App.jsx` (gate login + logout)
- [ ] Tester le flux : login → CRUD → logout → 401 si admin sans reconnecter
- [ ] Committer sur `partie-05`

---

## Branche Git

Branche active : **`partie-05`** (créée en [partie-05-01-cadrage-auth.md](partie-05-01-cadrage-auth.md)).

```bash
git branch   # * partie-05
git log --oneline   # commits 05-02 … 05-04 attendus en fin de partie
```

Si besoin : `git checkout partie-05`

---

## 0. Schéma — deux écrans, une seule page

```
App.jsx
   │
   ├── pas de token ?
   │       └── LoginForm  →  POST /auth/login  →  stocke token
   │
   └── token présent ?
           └── Back-office (liste, formulaire, CRUD admin avec Bearer)
```

> 💡 **Pas de React Router** — comme en partie 04, un `if` dans `App` suffit.

---

## 1. `localStorage` — c'est quoi ?

**`localStorage`** = petit espace de stockage **dans le navigateur**, qui **survit** au F5.

| Clé (exemple) | Valeur |
|---|---|
| `java_blog_token` | Le JWT (`eyJhbGci…`) |
| `java_blog_pseudo` | `alice_dev` (affichage) |

> ⚠️ **Pédagogie :** pratique pour un cours ; en prod on discute aussi **httpOnly cookies** (hors scope).

---

# Module — `api/auth.js`

## Objectif

**Un seul endroit** pour login, logout et lire le token.

**Chemin :** `admin/src/api/auth.js`

```javascript
/**
 * auth.js — login, logout, stockage du JWT (partie 05).
 */

import { API_URL } from "./articles.js";

const TOKEN_KEY = "java_blog_token";
const PSEUDO_KEY = "java_blog_pseudo";

/** @returns {string|null} */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** @returns {string|null} */
export function getPseudo() {
  return localStorage.getItem(PSEUDO_KEY);
}

export function isLoggedIn() {
  return getToken() != null && getToken().length > 0;
}

/**
 * En-têtes Authorization pour les routes /admin.
 * @returns {Record<string, string>}
 */
export function getAuthHeaders() {
  const token = getToken();
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}

/**
 * Connexion — POST /auth/login
 * @param {{ mail: string, mdp: string }} credentials
 * @returns {Promise<{ token: string, pseudo: string, userId: number }>}
 */
export async function login(credentials) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error("Identifiants invalides");
  }

  const data = await response.json();

  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(PSEUDO_KEY, data.pseudo);

  return data;
}

/** Déconnexion — efface le badge côté client (pas d'appel /auth/logout en v1). */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PSEUDO_KEY);
}
```

**Explication vulgarisée :**

| Fonction | Rôle |
|---|---|
| `getToken()` | Lit le badge dans le tiroir |
| `getAuthHeaders()` | Prépare `{ Authorization: "Bearer …" }` pour `fetch` |
| `login()` | Appelle l'API + **enregistre** token et pseudo |
| `logout()` | Vide le tiroir — le JWT côté serveur expire seul |

> 💡 `import { API_URL } from "./articles.js"` — on **réutilise** l'URL déjà définie en partie 04 (pas de duplication).

> ✅ **Todo :** fichier créé sans erreur.

---

## 3. Mettre à jour `api/articles.js`

Seules les routes **`/admin/**`** ont besoin du header.  
**`GET /articles/recents`** reste **public**.

**Remplace** le contenu de **`admin/src/api/articles.js`** par :

```javascript
/**
 * articles.js — appels HTTP vers l'API Spring Boot.
 */

import { getAuthHeaders } from "./auth.js";

export const API_URL = "http://localhost:8080";

/** En-têtes JSON + Authorization pour /admin */
function adminJsonHeaders() {
  return {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
}

/**
 * Récupère les 5 articles les plus récents (GET public).
 */
export async function fetchRecentArticles() {
  const response = await fetch(`${API_URL}/articles/recents`);

  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status}`);
  }

  return response.json();
}

export async function createArticle(payload) {
  const response = await fetch(`${API_URL}/admin/articles`, {
    method: "POST",
    headers: adminJsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new Error("Session expirée — reconnecte-toi.");
  }
  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status} lors de la création`);
  }

  return response.json();
}

export async function updateArticle(id, payload) {
  const response = await fetch(`${API_URL}/admin/articles/${id}`, {
    method: "PUT",
    headers: adminJsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new Error("Session expirée — reconnecte-toi.");
  }
  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status} lors de la modification`);
  }

  return response.json();
}

export async function deleteArticle(id) {
  const response = await fetch(`${API_URL}/admin/articles/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (response.status === 401) {
    throw new Error("Session expirée — reconnecte-toi.");
  }
  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status} lors de la suppression`);
  }
}
```

**Explication :**

| Point | En clair |
|---|---|
| `fetchRecentArticles` sans auth | Route **publique** — liste visible même avant login (mais on n'affichera la liste qu'après login dans `App`) |
| `adminJsonHeaders()` | DRY — JSON + Bearer en une fonction |
| `401` explicite | Token expiré → message clair pour l'utilisateur |

> ✅ **Todo :** pas d'erreur d'import circulaire (`auth` importe `API_URL` depuis `articles` ; `articles` importe `getAuthHeaders` depuis `auth` — OK en ES modules).

---

# Composant — `LoginForm.jsx`

## Objectif

Formulaire **présentationnel** : champs mail/mdp + callback `onSubmit`.

**Chemin :** `admin/src/components/LoginForm.jsx`

```jsx
import { useState } from "react";

/**
 * LoginForm — connexion admin.
 * Props :
 *   - onSubmit : (credentials) => void — parent appelle login()
 *   - errorMessage : string | null — message d'erreur affiché
 *   - isSubmitting : boolean — désactive le bouton pendant l'appel API
 */
function LoginForm({ onSubmit, errorMessage, isSubmitting }) {
  const [mail, setMail] = useState("alice@example.com");
  const [mdp, setMdp] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ mail, mdp });
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h2>Connexion admin</h2>
      <p className="login-hint">
        Compte démo : <strong>alice@example.com</strong> / <strong>demo1234</strong>
      </p>

      {errorMessage && (
        <p className="error-message" role="alert">
          {errorMessage}
        </p>
      )}

      <label>
        Adresse mail
        <input
          type="email"
          value={mail}
          onChange={(e) => setMail(e.target.value)}
          required
          autoComplete="username"
        />
      </label>

      <label>
        Mot de passe
        <input
          type="password"
          value={mdp}
          onChange={(e) => setMdp(e.target.value)}
          required
          autoComplete="current-password"
        />
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}

export default LoginForm;
```

Ajoute dans **`App.css`** :

```css
.login-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 360px;
  margin: 2rem auto;
  padding: 1.5rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #fff;
}

.login-form label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.9rem;
}

.login-form input {
  padding: 0.4rem;
  font: inherit;
}

.login-hint {
  font-size: 0.85rem;
  color: #555;
  margin: 0;
}

.user-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}
```

---

## 5. Mettre à jour `App.jsx`

**Remplace** **`admin/src/App.jsx`** par :

```jsx
import { useCallback, useEffect, useState } from "react";
import PageHeader from "./components/PageHeader.jsx";
import ArticleList from "./components/ArticleList.jsx";
import ArticleForm from "./components/ArticleForm.jsx";
import LoadingMessage from "./components/LoadingMessage.jsx";
import FeedbackMessage from "./components/FeedbackMessage.jsx";
import LoginForm from "./components/LoginForm.jsx";
import {
  fetchRecentArticles,
  createArticle,
  updateArticle,
  deleteArticle,
} from "./api/articles.js";
import {
  login,
  logout,
  isLoggedIn,
  getPseudo,
} from "./api/auth.js";
import "./App.css";

function App() {
  const [authenticated, setAuthenticated] = useState(isLoggedIn());
  const [pseudo, setPseudo] = useState(getPseudo());
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [mode, setMode] = useState("list");
  const [editingArticle, setEditingArticle] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadArticles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchRecentArticles();
      setArticles(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Impossible de joindre l'API.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadArticles();
    }
  }, [authenticated, loadArticles]);

  async function handleLoginSubmit(credentials) {
    try {
      setIsLoggingIn(true);
      setLoginError(null);
      const data = await login(credentials);
      setAuthenticated(true);
      setPseudo(data.pseudo);
    } catch (err) {
      setLoginError(err.message || "Connexion impossible.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleLogout() {
    logout();
    setAuthenticated(false);
    setPseudo(null);
    setArticles([]);
    setMode("list");
    setEditingArticle(null);
    setFeedback(null);
    setError(null);
  }

  function handleSessionExpired(message) {
    if (message.includes("Session expirée")) {
      handleLogout();
      setLoginError("Session expirée — reconnecte-toi.");
    }
  }

  function clearFeedback() {
    setFeedback(null);
  }

  function showList() {
    setMode("list");
    setEditingArticle(null);
  }

  function showCreate() {
    clearFeedback();
    setMode("create");
    setEditingArticle(null);
  }

  function handleEdit(id) {
    clearFeedback();
    const article = articles.find((a) => a.id === id);
    if (article) {
      setEditingArticle(article);
      setMode("edit");
    }
  }

  async function handleCreateSubmit(payload) {
    try {
      await createArticle(payload);
      await loadArticles();
      setFeedback({ type: "success", message: "Article créé." });
      showList();
    } catch (err) {
      handleSessionExpired(err.message);
      setFeedback({
        type: "error",
        message: err.message || "Erreur à la création.",
      });
    }
  }

  async function handleEditSubmit(payload) {
    try {
      await updateArticle(payload.id, {
        titre: payload.titre,
        contenu: payload.contenu,
        publie: payload.publie,
      });
      await loadArticles();
      setFeedback({ type: "success", message: "Article enregistré." });
      showList();
    } catch (err) {
      handleSessionExpired(err.message);
      setFeedback({
        type: "error",
        message: err.message || "Erreur à la modification.",
      });
    }
  }

  async function handleDelete(id) {
    clearFeedback();

    const article = articles.find((a) => a.id === id);
    const titre = article?.titre ?? `#${id}`;

    const confirmed = window.confirm(
      `Supprimer l'article « ${titre} » ?\n\nCette action est définitive.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteArticle(id);
      await loadArticles();
      setFeedback({ type: "success", message: "Article supprimé." });
    } catch (err) {
      handleSessionExpired(err.message);
      setFeedback({
        type: "error",
        message: err.message || "Erreur à la suppression.",
      });
    }
  }

  // ─── Écran login ───
  if (!authenticated) {
    return (
      <div className="app">
        <PageHeader title="Back-office — Blog Java" />
        <main>
          <LoginForm
            onSubmit={handleLoginSubmit}
            errorMessage={loginError}
            isSubmitting={isLoggingIn}
          />
        </main>
      </div>
    );
  }

  // ─── Back-office (partie 04 + auth) ───
  return (
    <div className="app">
      <PageHeader title="Back-office — Blog Java" />

      <main>
        <div className="user-bar">
          <span>Connecté : <strong>{pseudo}</strong></span>
          <button type="button" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>

        {feedback && (
          <FeedbackMessage
            type={feedback.type}
            message={feedback.message}
            onClose={clearFeedback}
          />
        )}

        {mode === "list" && (
          <div className="toolbar">
            <button type="button" onClick={showCreate}>
              + Nouvel article
            </button>
          </div>
        )}

        {mode === "create" && (
          <ArticleForm
            key="create"
            initialValues={null}
            submitLabel="Créer"
            onSubmit={handleCreateSubmit}
            onCancel={showList}
          />
        )}

        {mode === "edit" && editingArticle && (
          <ArticleForm
            key={editingArticle.id}
            initialValues={editingArticle}
            submitLabel="Enregistrer"
            onSubmit={handleEditSubmit}
            onCancel={showList}
          />
        )}

        {mode === "list" && isLoading && <LoadingMessage />}

        {mode === "list" && error && (
          <p className="error-message">{error}</p>
        )}

        {mode === "list" && !isLoading && !error && (
          <ArticleList
            articles={articles}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
}

export default App;
```

**Explication — points clés :**

| Élément | En clair |
|---|---|
| `useState(isLoggedIn())` | Au F5, si le token est dans `localStorage` → reste connecté |
| `if (!authenticated) return … LoginForm` | **Gate** : pas de back-office sans badge |
| `useEffect` + `authenticated` | Charge les articles **après** login seulement |
| `handleLogout` | Efface token + reset state |
| `handleSessionExpired` | Si 401 sur admin → déconnexion + message login |
| Composants `Article*` **inchangés** | Props down / events up — seul `App` gère l'auth |

> ✅ **Todo :** compile ; `npm run dev` sans erreur rouge.

---

## 6. Tester le flux complet

**Prérequis :** Spring Boot (05-03) + React ; hash Alice en base.

### Login

1. Ouvre `http://localhost:5173` → écran **Connexion admin**.
2. Mail `alice@example.com`, mdp `demo1234` → **Se connecter**.
3. Liste articles + « Connecté : **alice_dev** ».

### CRUD avec token

4. **Créer** / **Modifier** / **Supprimer** un article → OK (pas de 401).

### Déconnexion

5. Clic **Déconnexion** → retour écran login.
6. DevTools → Application → Local Storage → clés `java_blog_*` **absentes**.

### Persistance F5

7. Reconnecte-toi → F5 → toujours connecté (token en `localStorage`).

### Mauvais mot de passe

8. Login avec mdp faux → message « Identifiants invalides ».

### Vérifier le header (DevTools)

9. Network → requête `POST /admin/articles` → Request Headers contient  
   `Authorization: Bearer eyJ…`.

> ✅ **Todo :** CRUD admin OK uniquement **connecté**.

---

## 7. Enregistrer l'étape dans Git

```bash
git add admin/src/
git commit -m "05-04 — login React + JWT dans les fetch admin"
git log --oneline
```

> ✅ **Vérifie :** 4 commits sur `partie-05` (`05-02` … `05-04`).  
> `05-01` = cadrage sans code (normal).

---

## 🆘 En cas de problème

| Symptôme | Cause | Solution |
|---|---|---|
| 401 sur CRUD après login | Header absent | Vérifier `getAuthHeaders()` dans `articles.js` |
| Login OK mais liste vide | API down ou erreur load | Console navigateur + Spring Boot |
| Reste connecté avec mauvais token | Token invalide en storage | Déconnexion ou vider localStorage |
| CORS sur `/auth/login` | `WebConfig` | Partie 04-02 — redémarrer Spring |
| Import circulaire | Rare | `auth` ↔ `articles` : structure du doc OK |
| 401 identifiants | Hash BDD | Refaire UPDATE SQL Alice (05-02) |

---

## ✅ Récapitulatif partie 05

### Parcours complet

| Étape | Contenu |
|---|---|
| 05-01 | Cadrage JWT + branche Git |
| 05-02 | `POST /auth/login`, BCrypt, `JwtService` |
| 05-03 | `JwtAuthFilter`, `/admin/**` protégé |
| 05-04 | Login React + Bearer header |

### Commits Git attendus (`partie-05`)

| Commit | Contenu |
|---|---|
| `05-02` | User, login API, JWT |
| `05-03` | Filtre + SecurityConfig |
| `05-04` | React auth |

*(Les changements Java de 05-02/03 peuvent être un seul commit si tu préfères — l'idéal pédagogique = 3 commits.)*

### Ce que tu maîtrises

- [ ] **BCrypt** — mots de passe hashés en base
- [ ] **JWT** — badge signé, stateless
- [ ] **Filtre Spring** — vérifie le token avant `/admin`
- [ ] **React** — login, `localStorage`, header `Authorization`
- [ ] Routes **publiques** vs **admin** bien séparées

### Fichiers ajoutés (partie 05 — Java)

| Fichier | Rôle |
|---|---|
| `User.java` | Model |
| `LoginRequest` / `LoginResponse` | DTO |
| `UserRepository.java` | SQL |
| `JwtService.java` | Token |
| `AuthController.java` | Login |
| `SecurityConfig.java` | Règles |
| `JwtAuthFilter.java` | Filtre |

### Fichiers ajoutés (partie 05 — React)

| Fichier | Rôle |
|---|---|
| `api/auth.js` | Login / logout / headers |
| `components/LoginForm.jsx` | UI connexion |
| `App.jsx` | Gate auth |
| `api/articles.js` | Bearer sur admin |

---

## Suite

Consulte **`INDEX.md`** pour la **partie 06** — tests unitaires (MockMvc, repository) et **CI**.
