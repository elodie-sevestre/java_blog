# Partie 04 — Étape 04
# Appels API — brancher React sur Spring Boot

> 📘 **Ce document est ton support.** On sort le `fetch` de `App` pour le mettre dans **`api/`**, puis on passe les **vraies données** aux composants via **props** — comme prévu à l'étape 03.  
> 🗣️ **On vulgarise :** le module `api/` = le **téléphone** qui appelle la cuisine Java ; `App` = le **serveur** qui reçoit les plats et les pose sur le passe-plat (props).  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** [partie-04-03-premiers-composants-props.md](partie-04-03-premiers-composants-props.md) terminé ; Spring Boot **lancé** ; CORS OK (partie 04-02).

## Ce que tu auras à la fin de cette étape

- **`api/articles.js`** — fonctions `fetch` vers l'API (un seul endroit pour les URL).
- **`LoadingMessage.jsx`** — composant affiché pendant le chargement.
- **`App.jsx`** — charge les articles au démarrage (`useEffect`) et les passe à `ArticleList`.
- **Plus de `articlesSample`** — données **réelles** depuis PostgreSQL.

> ⏱️ **Durée estimée :** 45 minutes.

---

## Todo

- [ ] Créer `api/articles.js` avec `fetchRecentArticles`
- [ ] Créer `LoadingMessage.jsx`
- [ ] Adapter `App.jsx` (loading, erreur, props)
- [ ] Vérifier : les cartes affichent les **vrais** titres de la base
- [ ] Committer sur `partie-04`

---

## Branche Git

Branche active : **`partie-04`** (créée en [partie-04-01-cadrage-react-composants.md](partie-04-01-cadrage-react-composants.md)).

```bash
git branch   # * partie-04
```

Si besoin : `git checkout partie-04`

---

## 0. Rappel — ce qu'on ne change PAS

Les composants **`PageHeader`**, **`ArticleCard`**, **`ArticleList`** restent **identiques**.

> 💡 **Bonne pratique :** seul le **parent** (`App`) change la **source** des données. Les enfants ne savent pas si les articles viennent de la base ou d'un fichier en dur — ils reçoivent juste des **props**.

---

## 1. Quelle route appeler pour le back-office ?

| Route API | Ce qu'elle renvoie | Utile pour l'admin ? |
|---|---|---|
| `GET /articles` | Articles **publiés** seulement | Lecture publique |
| `GET /articles/recents` | Les **5 derniers** (tous statuts, y compris brouillons) | ✅ Liste admin pour l'instant |

On utilise **`/articles/recents`** : un admin doit voir les **brouillons** qu'il vient de créer (étape 05).  
`GET /articles` les **cache** (normal pour le site public).

> ❓ **Et plus tard ?** Une route `GET /admin/articles` listera tout — partie 07 ou évolution du cours. Pour l'instant, 5 articles récents suffisent pour apprendre.

---

## 2. Constante URL — un seul endroit

Dans **`admin/src/api/articles.js`**, on centralise l'adresse de l'API :

```javascript
/**
 * articles.js — appels HTTP vers l'API Spring Boot (partie 03).
 * Toutes les fonctions fetch du back-office passent par ici.
 */

// Adresse de l'API Java — même machine, port 8080 (pas 5173 !)
export const API_URL = "http://localhost:8080";
```

> 💡 Comme `application.yaml` côté Java : **une seule config** à modifier si le port change.

---

## 3. Fonction `fetchRecentArticles`

Toujours dans **`admin/src/api/articles.js`**, ajoute :

```javascript
/**
 * Récupère les 5 articles les plus récents (GET /articles/recents).
 * @returns {Promise<Array>} tableau d'objets { id, titre, contenu, publie, date }
 */
export async function fetchRecentArticles() {
  const response = await fetch(`${API_URL}/articles/recents`);

  // response.ok = true si status HTTP 200–299
  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status} sur /articles/recents`);
  }

  return response.json();
}
```

**Explication ligne par ligne :**

| Ligne | En clair |
|---|---|
| `export async function` | Fonction **asynchrone** — elle **attend** la réponse réseau (`await`). |
| `await fetch(...)` | Envoie la requête GET et **pause** jusqu'à la réponse. |
| `response.ok` | Vérifie que Spring a répondu **sans erreur** (pas 404, pas 500). |
| `throw new Error(...)` | **Lève** une erreur — on la rattrapera dans `App`. |
| `return response.json()` | Transforme le corps JSON en **tableau JavaScript**. |

> 🗣️ **Métaphore :** `fetch` = appeler au téléphone ; `await` = attendre la réponse ; `.json()` = déplier le message écrit.

> ✅ **Todo :** fichier `api/articles.js` créé.

---

## 4. Composant `LoadingMessage.jsx`

Pendant que `fetch` tourne, on affiche un message au lieu d'une liste vide.

**Chemin :** `admin/src/components/LoadingMessage.jsx`

```jsx
/**
 * LoadingMessage — texte affiché pendant un chargement API.
 * Props :
 *   - text (string, optionnel) — message à afficher
 */
function LoadingMessage({ text = "Chargement en cours…" }) {
  return <p className="loading-message">{text}</p>;
}

export default LoadingMessage;
```

**Explication :**

- `{ text = "Chargement…" }` → prop **optionnelle** avec **valeur par défaut** si le parent ne passe rien.
- Composant **pur** : aucune API ici — juste de l'affichage.

Ajoute dans **`App.css`** :

```css
.loading-message {
  color: #666;
  font-style: italic;
}

.error-message {
  color: #b00020;
  background: #ffeaea;
  padding: 0.75rem;
  border-radius: 6px;
}
```

---

## 5. Refactorer `App.jsx` — charger puis passer en props

**Remplace** le contenu de **`admin/src/App.jsx`** :

```jsx
import { useEffect, useState } from "react";
import PageHeader from "./components/PageHeader.jsx";
import ArticleList from "./components/ArticleList.jsx";
import LoadingMessage from "./components/LoadingMessage.jsx";
import { fetchRecentArticles } from "./api/articles.js";
import "./App.css";

/**
 * App — racine du back-office.
 * Rôle : charger les articles (API), gérer loading/erreur, passer des props aux enfants.
 */
function App() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadArticles() {
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
    }

    loadArticles();
  }, []);

  function handleEdit(id) {
    console.log("Modifier l'article id =", id);
  }

  function handleDelete(id) {
    console.log("Supprimer l'article id =", id);
  }

  return (
    <div className="app">
      <PageHeader title="Back-office — Blog Java" />

      <main>
        {isLoading && <LoadingMessage />}

        {error && <p className="error-message">{error}</p>}

        {!isLoading && !error && (
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

**Explication — les 3 états :**

| State | Rôle | Analogie |
|---|---|---|
| `articles` | Données reçues de l'API | Plats sur le passe-plat |
| `isLoading` | `true` pendant le `fetch` | « J'attends la cuisine » |
| `error` | Message si échec | « Problème de connexion » |

**Explication — `useEffect` :**

- `useEffect(() => { … }, [])` → exécute **une fois** au premier affichage (tableau vide `[]`).
- `async function loadArticles()` → on ne peut pas mettre `async` directement sur la fonction passée à `useEffect`, d'où une **fonction interne**.
- `try / catch / finally` → classique : essayer, attraper l'erreur, **toujours** couper le loading à la fin.

**Explication — affichage conditionnel :**

```jsx
{isLoading && <LoadingMessage />}
```

→ « **Si** loading, **alors** affiche LoadingMessage ».  
Syntaxe `&&` en React = affichage conditionnel simple.

```jsx
{!isLoading && !error && ( <ArticleList … /> )}
```

→ On n'affiche la liste **que** quand le chargement est fini **et** qu'il n'y a pas d'erreur.

> 💡 **Les props vers `ArticleList` n'ont pas changé** — seule la **source** de `articles` change (API au lieu de `articlesSample`).

---

## 6. Nettoyage — fichiers devenus inutiles ?

Tu **peux garder** `data/articlesSample.js` pour tester **sans** Spring (hors ligne).  
Pour l'instant, `App` ne l'importe **plus**.

> 💡 Astuce debug : remplace temporairement `fetchRecentArticles()` par `articlesSample` si PostgreSQL est arrêté.

---

## 7. Tester

**Terminal 1 — API :**

```bash
./mvnw spring-boot:run
```

**Terminal 2 — React :**

```bash
cd admin && npm run dev
```

**Vérifications :**

1. Bref affichage « Chargement… » puis les **cartes**.
2. Les **titres** correspondent à pgAdmin ou à `http://localhost:8080/articles/recents`.
3. Couper Spring → message d'**erreur** rouge (pas page blanche).
4. Relancer Spring → rafraîchir la page (F5) → liste OK.

> ✅ **Todo :** props identiques à l'étape 03, données **réelles**.

---

## 8. Schéma récapitulatif

```
PostgreSQL
    ▲
    │ SQL
Spring Boot :8080  ←── fetch ──  api/articles.js
    ▲                              │
    │ JSON                         │ await fetchRecentArticles()
    └────────────────────────────── App (useState articles)
                                       │
                                       │ props: articles, onEdit, onDelete
                                       ▼
                                  ArticleList → ArticleCard
```

---

## 9. Enregistrer l'étape dans Git

```bash
git add admin/src/
git commit -m "04-04 — api/articles.js + chargement liste depuis GET /articles/recents"
git log --oneline
```

---

## 🆘 En cas de problème

| Symptôme | Cause probable | Solution |
|---|---|---|
| CORS blocked | `WebConfig` absent | Reprendre partie 04-02 §8 |
| Failed to fetch | Spring arrêté | `./mvnw spring-boot:run` |
| Liste vide, pas d'erreur | Table `articles` vide | Exécute `doc/blog.sql` |
| `Unexpected token` JSON | URL incorrecte | Vérifie `API_URL` et `/articles/recents` |
| Anciens titres demo | Cache ou mauvais import | Vérifie que `articlesSample` n'est plus importé |
| Loading infini | Erreur silencieuse | Console F12 ; vérifie le `finally` |

---

## 🏋️ Exercice (optionnel)

Dans `api/articles.js`, ajoute :

```javascript
export async function fetchPublishedArticles() {
  const response = await fetch(`${API_URL}/articles`);
  if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
  return response.json();
}
```

Dans `App`, remplace temporairement `fetchRecentArticles` par `fetchPublishedArticles` :

- Que remarques-tu sur les **brouillons** ? *(Ils disparaissent de la liste — normal.)*

---

## ✅ Récapitulatif

- [ ] Module **`api/`** séparé du JSX
- [ ] **`async/await`** pour lire l'API
- [ ] États **loading** et **error** gérés dans le parent
- [ ] **Props inchangées** vers les composants enfants
- [ ] Commit `04-04` sur `partie-04`

---

## Suite

👉 **[partie-04-05-formulaire-crud.md](partie-04-05-formulaire-crud.md)** — composant **`ArticleForm`** + `POST` / `PUT` admin.
