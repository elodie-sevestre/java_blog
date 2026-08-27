# Partie 04 — Étape 06
# Suppression, messages d'erreur et récap du back-office React

> 📘 **Ce document est ton support.** On termine le **CRUD** avec **DELETE**, on remplace les `alert()` par des **messages visibles** dans la page, puis on **récapitule** la partie 04.  
> 🗣️ **On vulgarise :** supprimer = demander à l'API d'**effacer** une ligne en base ; la confirmation = « Es-tu sûr ? » avant d'agir ; le bandeau d'erreur = un **post-it rouge** en haut de l'écran au lieu d'une popup.  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** [partie-04-05-formulaire-crud.md](partie-04-05-formulaire-crud.md) (POST / PUT OK).

## Ce que tu auras à la fin de cette étape

- **`deleteArticle`** dans `api/articles.js` — `DELETE /admin/articles/{id}` (réponse **204**, sans JSON).
- **`FeedbackMessage.jsx`** — bandeau succès / erreur (remplace les `alert()`).
- **`App.jsx`** — confirmation avant suppression + rechargement de la liste.
- **CRUD articles complet** côté React admin : **Create, Read, Update, Delete**.
- **Récap** de la partie 04 + commits Git.

> ⏱️ **Durée estimée :** 45 à 60 minutes.

---

## Todo

- [ ] Corriger `ArticleRepository.deleteById` (FK — § **1**)
- [ ] Ajouter `deleteArticle` dans `api/articles.js`
- [ ] Créer `FeedbackMessage.jsx`
- [ ] Brancher `handleDelete` avec `window.confirm`
- [ ] Remplacer les `alert()` par le bandeau dans `App.jsx`
- [ ] Tester suppression + messages d'erreur (API arrêtée = erreur visible)
- [ ] Committer sur `partie-04`
- [ ] Vérifier les **6 commits** `04-02` … `04-06`

---

## Branche Git

Branche active : **`partie-04`** (créée en [partie-04-01-cadrage-react-composants.md](partie-04-01-cadrage-react-composants.md)).

```bash
git branch   # * partie-04
git log --oneline   # commits 04-02 … 04-06 attendus
```

Si besoin : `git checkout partie-04`

---

## 0. Rappel — DELETE côté Java (partie 03)

| Verbe | Route | Réponse OK |
|---|---|---|
| DELETE | `/admin/articles/{id}` | **204 No Content** (corps **vide**) |

> 💡 **204** = « c'est fait, rien à renvoyer ». On ne fait **pas** `response.json()` après un DELETE réussi.

> ⚠️ **Piège fréquent :** avec le **`blog.sql` complet**, un article du seed a souvent des **commentaires** ou des liaisons N-N. Un simple `DELETE FROM articles` côté Java provoque une **500** (FK PostgreSQL). Voir § **2** ci-dessous.

---

## 1. Backend — lignes liées (FK)

Avant de supprimer l'article, le repository doit **nettoyer les tables enfants** référencées dans [blog.sql](blog.sql) :

| Table | Action |
|---|---|
| `commentaires` | `DELETE … WHERE article_id = ?` |
| `articles_categories` | `DELETE … WHERE article_id = ?` |
| `articles_medias` | `DELETE … WHERE article_id = ?` |
| `médias` / `catégories` | `UPDATE … SET … = NULL` (colonnes redondantes du seed) |

Dans **`ArticleRepository.java`**, remplace `deleteById` par :

```java
import org.springframework.transaction.annotation.Transactional;

@Transactional
public boolean deleteById(int id) {
    deleteRelatedRows(id);

    int rows = jdbcTemplate.update("DELETE FROM articles WHERE id = ?", id);
    return rows > 0;
}

/** Supprime ou détache les lignes liées avant DELETE articles (FK blog.sql). */
private void deleteRelatedRows(int id) {
    executeIfTableExists("commentaires",
            "DELETE FROM commentaires WHERE article_id = ?", id);
    executeIfTableExists("articles_categories",
            "DELETE FROM articles_categories WHERE article_id = ?", id);
    executeIfTableExists("articles_medias",
            "DELETE FROM articles_medias WHERE article_id = ?", id);
    executeIfTableExists("médias",
            "UPDATE \"médias\" SET articles_id = NULL WHERE articles_id = ?", id);
    executeIfTableExists("catégories",
            "UPDATE \"catégories\" SET article_id = NULL WHERE article_id = ?", id);
}

private void executeIfTableExists(String tableName, String sql, Object... args) {
    String regclass = tableName.matches("^[a-z_]+$")
            ? "public." + tableName
            : "public.\"" + tableName + "\"";

    Boolean exists = jdbcTemplate.queryForObject(
            "SELECT to_regclass(?) IS NOT NULL",
            Boolean.class,
            regclass
    );

    if (Boolean.TRUE.equals(exists)) {
        jdbcTemplate.update(sql, args);
    }
}
```

**Explication :**

| Point | En clair |
|---|---|
| `@Transactional` | Tout ou rien — pas d'article supprimé si une étape échoue |
| `deleteRelatedRows` | Respecte l'ordre des **FK** définies dans `blog.sql` |
| `executeIfTableExists` | Les **tests** (partie 06) n'ont que `articles` + `users` — pas de table `commentaires` |

> ✅ **Todo :** redémarre Spring Boot ; DELETE depuis l'admin → **204**, plus de bandeau « Erreur HTTP 500 ».

---

## 2. Fonction `deleteArticle`

Ajoute **à la fin** de **`admin/src/api/articles.js`** :

```javascript
/**
 * Supprime un article (DELETE /admin/articles/{id}).
 * @param {number} id
 */
export async function deleteArticle(id) {
  const response = await fetch(`${API_URL}/admin/articles/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status} lors de la suppression`);
  }

  // 204 No Content — pas de corps JSON à lire
}
```

**Explication vulgarisée :**

| Point | En clair |
|---|---|
| `method: "DELETE"` | « Je veux **supprimer** cette ressource » |
| Pas de `body` | Rien à envoyer — l'id est dans l'URL |
| Pas de `return response.json()` | 204 = réponse **vide** ; parser du JSON planterait |
| `throw new Error(...)` | Remonte l'échec au parent (`App`) comme pour GET/POST/PUT |

---

# Composant — `FeedbackMessage.jsx`

## Objectif

Afficher un **message** en haut de la page — succès (vert) ou erreur (rouge) — au lieu d'une popup `alert()`.

**Chemin :** `admin/src/components/FeedbackMessage.jsx`

```jsx
/**
 * FeedbackMessage — bandeau succès ou erreur.
 * Props :
 *   - type : "success" | "error"
 *   - message : string — texte affiché
 *   - onClose : () => void — fermer le bandeau (optionnel)
 */
function FeedbackMessage({ type, message, onClose }) {
  if (!message) {
    return null;
  }

  return (
    <div className={`feedback feedback-${type}`} role="alert">
      <span>{message}</span>
      {onClose && (
        <button type="button" className="feedback-close" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
}

export default FeedbackMessage;
```

**Explication :**

- `role="alert"` → aide les lecteurs d'écran (accessibilité).
- `if (!message) return null` → ne rend **rien** si pas de message (composant « optionnel »).
- `feedback-${type}` → classe CSS différente selon succès ou erreur.
- Composant **présentationnel** : il **affiche** ; `App` décide **quoi** afficher.

Ajoute dans **`App.css`** :

```css
.feedback {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border-radius: 6px;
  font-size: 0.95rem;
}

.feedback-success {
  background: #e6f4ea;
  border: 1px solid #34a853;
  color: #1e4620;
}

.feedback-error {
  background: #fce8e6;
  border: 1px solid #ea4335;
  color: #5f2120;
}

.feedback-close {
  border: none;
  background: transparent;
  font-size: 1.25rem;
  cursor: pointer;
  line-height: 1;
}

.error-message {
  color: #b00020;
  padding: 0.5rem;
}
```

> 💡 `.error-message` reste pour l'erreur de **chargement initial** de la liste (partie 04-04).

---

## 4. Mettre à jour `App.jsx`

**Remplace** **`admin/src/App.jsx`** par la version finale :

```jsx
import { useCallback, useEffect, useState } from "react";
import PageHeader from "./components/PageHeader.jsx";
import ArticleList from "./components/ArticleList.jsx";
import ArticleForm from "./components/ArticleForm.jsx";
import LoadingMessage from "./components/LoadingMessage.jsx";
import FeedbackMessage from "./components/FeedbackMessage.jsx";
import {
  fetchRecentArticles,
  createArticle,
  updateArticle,
  deleteArticle,
} from "./api/articles.js";
import "./App.css";

function App() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [mode, setMode] = useState("list");
  const [editingArticle, setEditingArticle] = useState(null);

  // Bandeau action (création / édition / suppression) — remplace alert()
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
    loadArticles();
  }, [loadArticles]);

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
      setFeedback({
        type: "error",
        message: err.message || "Erreur à la suppression.",
      });
    }
  }

  return (
    <div className="app">
      <PageHeader title="Back-office — Blog Java" />

      <main>
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

**Explication — nouveautés :**

| Élément | En clair |
|---|---|
| `feedback` | Objet `{ type, message }` ou `null` — **une seule** source pour les retours d'action |
| `window.confirm(...)` | Boîte native « OK / Annuler » — suffisant pour apprendre ; pas de composant modal custom |
| `if (!confirmed) return` | L'utilisateur a annulé → **aucun** appel API |
| `clearFeedback()` | Efface le bandeau quand on ouvre create/edit |
| Deux niveaux d'erreur | `error` = échec **chargement liste** ; `feedback` = échec **action** (POST/PUT/DELETE) |

> 💡 **Props down, events up** — inchangé : `ArticleCard` appelle `onDelete(id)` ; `App` fait le `fetch` DELETE.

---

## 5. Schéma — flux DELETE

```
Clic « Supprimer » sur ArticleCard
        │
        ▼
App.handleDelete(id)
        │
        ├── confirm() → Annuler → STOP
        │
        ▼
deleteArticle(id)  →  DELETE /admin/articles/{id}
        │
        ├── 204 OK → loadArticles() → bandeau « Article supprimé »
        │
        └── erreur → bandeau rouge (ex. 404, API down)
```

---

## 6. Tester

### Suppression OK

1. Spring Boot + React lancés.
2. Clic **Supprimer** sur un article → **OK** dans la confirm.
3. L'article disparaît de la liste ; bandeau vert « Article supprimé ».
4. Vérifie : `curl http://localhost:8080/articles/recents` — l'id n'y est plus.

### Annulation

1. Clic **Supprimer** → **Annuler** → rien ne change.

### Erreur visible (API arrêtée)

1. Arrête Spring Boot.
2. Clic **Supprimer** → confirm OK → bandeau rouge (pas de popup `alert`).
3. Relance Spring Boot ; recharge la page (F5).

### CRUD complet — checklist

| Action | UI | API |
|---|---|---|
| **C**réer | + Nouvel article | POST `/admin/articles` |
| **R**ead | Liste au chargement | GET `/articles/recents` |
| **U**pdate | Modifier + Enregistrer | PUT `/admin/articles/{id}` |
| **D**elete | Supprimer + confirm | DELETE `/admin/articles/{id}` |

> ✅ **Todo :** les 4 verbes passent par `api/articles.js` — **un seul endroit** pour les URL.

---

## 7. Enregistrer l'étape dans Git

```bash
git add admin/src/
git commit -m "04-06 — DELETE articles + FeedbackMessage + récap CRUD admin"
git log --oneline
```

> ✅ **Vérifie :** 6 commits sur `partie-04` (`04-02` … `04-06`).  
> `partie-04-01` = cadrage sans code → pas de commit dédié (normal).

---

## 🆘 En cas de problème

| Symptôme | Cause | Solution |
|---|---|---|
| **HTTP 500** à la suppression | FK PostgreSQL (`commentaires`, liaisons…) | § **2 Backend — lignes liées (FK)** + redémarrer Spring |
| `Unexpected end of JSON input` | `response.json()` après DELETE | DELETE = 204, **pas** de JSON |
| Article toujours visible | Liste non rechargée | `await loadArticles()` après DELETE |
| Confirm en anglais | Navigateur / OS | Normal — le texte du message est le tien |
| 404 à la suppression | Id déjà supprimé | Recharge la page |
| Bandeau invisible | `feedback` null | Vérifie `setFeedback` dans le `catch` |

---

## ✅ Récapitulatif partie 04

### Arborescence `admin/` (cible)

```
admin/
├── src/
│   ├── api/
│   │   └── articles.js          ← fetchRecentArticles, create, update, delete
│   ├── components/
│   │   ├── PageHeader.jsx
│   │   ├── LoadingMessage.jsx
│   │   ├── FeedbackMessage.jsx
│   │   ├── ArticleCard.jsx
│   │   ├── ArticleList.jsx
│   │   └── ArticleForm.jsx
│   ├── data/
│   │   └── articlesSample.js    ← optionnel (debug hors ligne)
│   ├── App.jsx                  ← state, modes, appels API
│   ├── App.css
│   └── main.jsx
├── package.json
└── vite.config.js
```

### Commits Git attendus (`partie-04`)

| Commit | Contenu |
|---|---|
| `04-02` | Vite, dossiers, CORS Spring |
| `04-03` | Composants props + données en dur |
| `04-04` | Module `api/` + liste depuis PostgreSQL |
| `04-05` | `ArticleForm` + POST / PUT |
| `04-06` | DELETE + `FeedbackMessage` |

### Ce que tu maîtrises

- [ ] **Composants fonction** + **props** (présentation vs conteneur)
- [ ] **Props down / events up** (`onEdit`, `onDelete`, `onSubmit`)
- [ ] **`useState`**, **`useEffect`**, **`useCallback`** dans le parent
- [ ] Module **`api/`** centralisé
- [ ] **CRUD articles** branché sur l'API Java (partie 03)
- [ ] **CORS** Spring ↔ React (deux ports, deux applis)

### Ce qui vient après (hors partie 04)

| Sujet | Partie |
|---|---|
| Login + protéger `/admin` | **05** |
| Tests unitaires + CI | **06** |
| Routes restantes + front public | **07** |
| `GET /admin/articles` (liste complète) | **07** (TP) |

> 🔐 Aujourd'hui, **n'importe qui** peut appeler `/admin/articles` — c'est voulu ; la **partie 05** ajoutera l'authentification.

---

## Suite

Consulte **`INDEX.md`** pour la **partie 05** — authentification et sécurisation des routes admin.
