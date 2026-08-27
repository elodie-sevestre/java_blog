# Partie 04 — Étape 05
# Formulaire admin — créer et modifier un article (POST / PUT)

> 📘 **Ce document est ton support.** On ajoute **`ArticleForm`** — un composant **réutilisable** grâce aux **props** — et on branche **POST** / **PUT** sur l'API Java.  
> 🗣️ **On vulgarise :** le formulaire = une **fiche à remplir** ; les props disent si c'est une **nouvelle** fiche ou une **modification** ; le parent envoie la fiche à la cuisine (`fetch`).  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** [partie-04-04-appels-api.md](partie-04-04-appels-api.md) (liste API OK).

## Ce que tu auras à la fin de cette étape

- **`ArticleForm.jsx`** — champs titre, contenu, publié (édition), auteur (création).
- **`createArticle`** et **`updateArticle`** dans `api/articles.js`.
- **`App.jsx`** — bascule liste ↔ formulaire ; **recharge** la liste après enregistrement.
- **DELETE** → étape 06 (on finit d'abord créer + modifier).

> ⏱️ **Durée estimée :** 60 à 75 minutes.

---

## Todo

- [ ] Ajouter `createArticle` et `updateArticle` dans `api/articles.js`
- [ ] Créer `ArticleForm.jsx` (props : `initialValues`, `onSubmit`, `onCancel`, `submitLabel`)
- [ ] Gérer dans `App` : mode liste / création / édition
- [ ] Tester **POST** (nouvel article brouillon) et **PUT** (modifier + publier)
- [ ] Committer sur `partie-04`

---

## Branche Git

Branche active : **`partie-04`** (créée en [partie-04-01-cadrage-react-composants.md](partie-04-01-cadrage-react-composants.md)).

```bash
git branch   # * partie-04
```

Si besoin : `git checkout partie-04`

---

## 0. Rappel — JSON attendu par Spring (partie 03)

| Action | Route | Corps JSON |
|---|---|---|
| **Créer** | `POST /admin/articles` | `{ "titre", "contenu", "userId" }` |
| **Modifier** | `PUT /admin/articles/{id}` | `{ "titre", "contenu", "publie" }` |

> 💡 À la **création**, pas de `publie` : l'API met **brouillon** par défaut.  
> À la **modification**, `publie: true` = publier l'article.

---

## 1. Schéma — modes de l'écran admin

```
┌─────────────────────────────────────┐
│  MODE "liste" (par défaut)          │
│  [ + Nouvel article ]               │
│  ArticleList …                      │
│    → Modifier → passe en MODE edit  │
└─────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│ MODE "create"   │  │ MODE "edit"     │
│ ArticleForm     │  │ ArticleForm     │
│ initialValues   │  │ initialValues   │
│ = null          │  │ = article       │
└─────────────────┘  └─────────────────┘
```

Le **même** composant `ArticleForm` sert les deux modes — **seules les props changent**.

---

## 2. Étendre `api/articles.js`

Ajoute **à la fin** de **`admin/src/api/articles.js`** :

```javascript
/**
 * Crée un article (POST /admin/articles).
 * @param {{ titre: string, contenu: string, userId: number }} payload
 */
export async function createArticle(payload) {
  const response = await fetch(`${API_URL}/admin/articles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status} lors de la création`);
  }

  return response.json();
}

/**
 * Modifie un article (PUT /admin/articles/{id}).
 * @param {number} id
 * @param {{ titre: string, contenu: string, publie: boolean }} payload
 */
export async function updateArticle(id, payload) {
  const response = await fetch(`${API_URL}/admin/articles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status} lors de la modification`);
  }

  return response.json();
}
```

**Explication vulgarisée :**

| Élément | En clair |
|---|---|
| `method: "POST"` | « Je **crée** une ressource » (pas GET) |
| `method: "PUT"` | « Je **remplace** l'article existant » |
| `headers: { "Content-Type": "application/json" }` | « Le corps est du JSON » — Spring comprend |
| `body: JSON.stringify(payload)` | Objet JavaScript → **chaîne** JSON pour le réseau |
| `return response.json()` | Article créé/modifié renvoyé par l'API (avec `id`) |

> ✅ **Todo :** pas d'erreur de syntaxe dans `articles.js`.

---

# Composant — `ArticleForm.jsx`

## Objectif

Afficher des **champs contrôlés** (valeur liée au state React) et, à la soumission, appeler **`onSubmit`** avec les données — **sans** faire le `fetch` ici.

**Chemin :** `admin/src/components/ArticleForm.jsx`

```jsx
import { useState } from "react";

/**
 * ArticleForm — formulaire création OU édition d'un article.
 * Props :
 *   - initialValues : null (création) ou objet article (édition)
 *   - onSubmit : (payload) => void — parent envoie à l'API
 *   - onCancel : () => void — retour liste
 *   - submitLabel : string — texte du bouton (ex. "Créer", "Enregistrer")
 */
function ArticleForm({ initialValues, onSubmit, onCancel, submitLabel }) {
  const isEdit = initialValues != null;

  const [titre, setTitre] = useState(initialValues?.titre ?? "");
  const [contenu, setContenu] = useState(initialValues?.contenu ?? "");
  const [publie, setPublie] = useState(initialValues?.publie ?? false);
  const [userId, setUserId] = useState(initialValues?.userId ?? 1);

  function handleSubmit(event) {
    event.preventDefault();

    if (isEdit) {
      onSubmit({
        id: initialValues.id,
        titre,
        contenu,
        publie,
      });
    } else {
      onSubmit({
        titre,
        contenu,
        userId: Number(userId),
      });
    }
  }

  return (
    <form className="article-form" onSubmit={handleSubmit}>
      <h2>{isEdit ? "Modifier l'article" : "Nouvel article"}</h2>

      <label>
        Titre
        <input
          type="text"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          required
        />
      </label>

      <label>
        Contenu
        <textarea
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          rows={5}
          required
        />
      </label>

      {isEdit ? (
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={publie}
            onChange={(e) => setPublie(e.target.checked)}
          />
          Publié
        </label>
      ) : (
        <label>
          ID auteur (userId)
          <input
            type="number"
            min={1}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </label>
      )}

      <div className="form-actions">
        <button type="submit">{submitLabel}</button>
        <button type="button" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}

export default ArticleForm;
```

**Explication ligne par ligne :**

| Ligne | En clair |
|---|---|
| `const isEdit = initialValues != null` | Mode **édition** si on a reçu un article existant |
| `useState(initialValues?.titre ?? "")` | State local du champ ; `?.` = « si initialValues existe » ; `??` = valeur par défaut |
| `event.preventDefault()` | Empêche le rechargement de la page (comportement HTML classique des `<form>`) |
| `value={titre}` + `onChange` | **Champ contrôlé** : React **pilote** la valeur (bonne pratique) |
| `isEdit ? … : …` | Création → champ **userId** ; édition → case **Publié** |
| `onSubmit({ … })` | Remonte les données au **parent** — pas de `fetch` ici |
| `type="button"` sur Annuler | Ne soumet **pas** le formulaire |

> 💡 **Props down, events up** : le form **monte** les données via `onSubmit` ; `App` **descend** `initialValues`.

Ajoute dans **`App.css`** :

```css
.article-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #fff;
}

.article-form label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.9rem;
}

.article-form input[type="text"],
.article-form textarea,
.article-form input[type="number"] {
  padding: 0.4rem;
  font: inherit;
}

.checkbox-label {
  flex-direction: row !important;
  align-items: center;
  gap: 0.5rem !important;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.toolbar {
  margin-bottom: 1rem;
}
```

---

## 4. Refactorer `App.jsx` — modes liste / create / edit

**Remplace** **`admin/src/App.jsx`** par :

```jsx
import { useCallback, useEffect, useState } from "react";
import PageHeader from "./components/PageHeader.jsx";
import ArticleList from "./components/ArticleList.jsx";
import ArticleForm from "./components/ArticleForm.jsx";
import LoadingMessage from "./components/LoadingMessage.jsx";
import {
  fetchRecentArticles,
  createArticle,
  updateArticle,
} from "./api/articles.js";
import "./App.css";

function App() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // "list" | "create" | "edit"
  const [mode, setMode] = useState("list");
  const [editingArticle, setEditingArticle] = useState(null);

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
    loadArticles();
  }, [loadArticles]);

  function showList() {
    setMode("list");
    setEditingArticle(null);
  }

  function showCreate() {
    setMode("create");
    setEditingArticle(null);
  }

  function handleEdit(id) {
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
      showList();
    } catch (err) {
      alert(err.message || "Erreur à la création");
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
      showList();
    } catch (err) {
      alert(err.message || "Erreur à la modification");
    }
  }

  function handleDelete(id) {
    console.log("DELETE — étape 06, id =", id);
  }

  return (
    <div className="app">
      <PageHeader title="Back-office — Blog Java" />

      <main>
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
| `mode` | Variable qui dit **quel écran** afficher (liste ou formulaire) |
| `loadArticles` | Fonction **réutilisable** pour recharger après POST/PUT |
| `useCallback` | Évite de recréer la fonction à chaque rendu (bonne pratique avec `useEffect`) |
| `key="create"` / `key={editingArticle.id}` | Force React à **réinitialiser** le formulaire quand on change de mode |
| `handleCreateSubmit` | Appelle l'API → recharge → retour liste |
| `alert(...)` | Message simple pour les erreurs — on fera mieux en étape 06 |
| `handleDelete` | Toujours `console.log` — **DELETE à l'étape 06** |

> ❓ **Pourquoi `key` sur `ArticleForm` ?** Sans `key`, les champs `useState` du formulaire **gardent** les anciennes valeurs quand on passe de création à édition.

---

## 5. Tester le flux complet

**Prérequis :** Spring Boot + React lancés.

### Créer (POST)

1. Clic **+ Nouvel article**.
2. Remplis titre + contenu ; `userId` = **1** (utilisateur de démo dans `blog.sql`).
3. Clic **Créer** → retour liste → nouvel article visible (brouillon si pas publié).

Vérifie dans pgAdmin ou `GET /articles/recents`.

### Modifier + publier (PUT)

1. Clic **Modifier** sur un article.
2. Change le titre ; coche **Publié**.
3. Clic **Enregistrer** → liste mise à jour.

Vérifie : `GET /articles` (publiés) contient l'article si `publie` coché.

### Annuler

1. Ouvre le formulaire → **Annuler** → retour liste sans appel API.

> ✅ **Todo :** POST et PUT fonctionnent ; pas d'erreur CORS.

---

## 6. Enregistrer l'étape dans Git

```bash
git add admin/src/
git commit -m "04-05 — ArticleForm + POST/PUT admin articles"
git log --oneline
```

---

## 🆘 En cas de problème

| Symptôme | Cause | Solution |
|---|---|---|
| 400 Bad Request | JSON incomplet | Vérifie `titre`, `contenu`, `userId` |
| 404 sur PUT | Id inexistant | Recharge la liste |
| Formulaire vide en édition | `editingArticle` null | Vérifie `handleEdit` et `find` |
| Champs « collés » entre create/edit | `key` manquant | Ajoute `key` sur `ArticleForm` |
| userId invalide | Pas un nombre | `Number(userId)` à la création |

---

## ✅ Récapitulatif

- [ ] **`ArticleForm`** réutilisable via props (`initialValues`, `submitLabel`)
- [ ] Champs **contrôlés** (`value` + `onChange`)
- [ ] **POST** et **PUT** dans `api/articles.js`
- [ ] Parent gère **mode** et **rechargement** de la liste
- [ ] Commit `04-05`

---

## Suite

👉 **[partie-04-06-suppression-et-recap.md](partie-04-06-suppression-et-recap.md)** — **DELETE**, améliorer les messages d'erreur, récap partie 04.
