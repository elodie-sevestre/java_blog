# Partie 04 — Étape 03
# Premiers composants et props (données en dur)

> 📘 **Ce document est ton support.** On crée **3 composants** et on leur passe des **props** — sans appeler l'API pour l'instant.  
> 🗣️ **On vulgarise :** une **prop**, c'est un **paramètre** qu'un composant parent donne à un enfant — comme passer un argument à une fonction en Java.  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** [partie-04-02-setup-react-vite.md](partie-04-02-setup-react-vite.md) terminé (`admin/` OK, commit `04-02`).

## Ce que tu auras à la fin de cette étape

- **`PageHeader`** — affiche un titre (prop `title`).
- **`ArticleCard`** — affiche **un** article (prop `article` + callbacks).
- **`ArticleList`** — affiche **plusieurs** cartes (prop `articles` + callbacks).
- **`App.jsx`** — parent qui possède les **données en dur** et les **passe** aux enfants.
- **Plus de `fetch`** dans cette étape — on apprend d'abord la **composition**, l'API revient à l'étape 04.

> ⏱️ **Durée estimée :** 45 à 60 minutes.

---

## Todo

- [ ] Comprendre le schéma parent → props → enfant
- [ ] Créer `PageHeader.jsx`
- [ ] Créer `ArticleCard.jsx`
- [ ] Créer `ArticleList.jsx`
- [ ] Refactorer `App.jsx` (données en dur + props)
- [ ] Ajouter un peu de CSS dans `App.css`
- [ ] Tester les boutons (messages dans la console)
- [ ] Committer sur `partie-04`

---

## Branche Git

Branche active : **`partie-04`** (créée en [partie-04-01-cadrage-react-composants.md](partie-04-01-cadrage-react-composants.md)).

```bash
git branch   # * partie-04
```

Si besoin : `git checkout partie-04`

---

## 0. Pourquoi des données en dur d'abord ?

À l'étape 02, tu as testé `fetch` dans `App`. **Ici, on retire ce `fetch`** volontairement.

| Approche | Avantage pédagogique |
|---|---|
| **Données en dur** | Tu te concentres sur **props** et **JSX** sans réseau ni async |
| **API à l'étape 04** | Une seule nouveauté à la fois |

> 💡 **Métaphore :** tu apprends à **disposer des assiettes** sur le passe-plat avant d'brancher la cuisine (API).

---

## 1. Schéma — qui passe quoi à qui ?

```
App.jsx  (PARENT — « chef de salle »)
  │
  │  props : title="Back-office…"
  ▼
PageHeader

  │  props : articles=[…], onEdit=…, onDelete=…
  ▼
ArticleList  (enfant intermédiaire)
  │
  │  props : article={un seul}, onEdit, onDelete  (pour CHAQUE article)
  ▼
ArticleCard  (petit-enfant — une carte)
```

**Règle d'or :** `ArticleCard` **ne connaît pas** la liste complète. Il reçoit **un seul** `article`. C'est `ArticleList` qui **boucle** sur le tableau.

---

## 2. Données de test — même forme que l'API

Crée **`admin/src/data/articlesSample.js`** — fausses données pour s'entraîner :

```javascript
/**
 * articlesSample — articles fictifs pour tester les composants SANS API.
 * Même forme que le JSON renvoyé par GET /articles (ArticleResponse côté Java).
 */
export const articlesSample = [
  {
    id: 1,
    titre: "Premier article de démo",
    contenu: "Texte court pour tester ArticleCard.",
    publie: true,
    date: "2026-02-10T10:00:00",
  },
  {
    id: 2,
    titre: "Brouillon en cours",
    contenu: "Cet article pourrait être non publié.",
    publie: false,
    date: "2026-02-12T14:30:00",
  },
  {
    id: 3,
    titre: "PostgreSQL et React",
    contenu: "Deux applis, un projet.",
    publie: true,
    date: "2026-02-15T09:00:00",
  },
];
```

**Explication :**

- `export const articlesSample` → on pourra `import` ce tableau dans `App.jsx`.
- Chaque objet a les champs **`id`, `titre`, `contenu`, `publie`, `date`** — comme le DTO Java `ArticleResponse`.

> ✅ **Todo :** le fichier est créé dans `admin/src/data/`.

---

# Composant 1 — `PageHeader.jsx`

## Objectif

Afficher un **titre** en haut de page — rien d'autre. Composant **minimal** pour comprendre une prop simple (`title`).

**Chemin :** `admin/src/components/PageHeader.jsx`

```jsx
/**
 * PageHeader — bandeau titre du back-office.
 * Props :
 *   - title (string) : texte affiché en gros
 */
function PageHeader({ title }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
    </header>
  );
}

export default PageHeader;
```

**Explication ligne par ligne :**

- `function PageHeader({ title })` → on **destructure** la prop : équivalent à `props.title`, mais plus lisible.
- `{ title }` entre accolades = « je m'attends à recevoir une prop nommée **title** ».
- `<header>` → balise HTML sémantique (« en-tête de page »).
- `<h1>{title}</h1>` → affiche la **valeur** de la prop dans le titre.
- `export default PageHeader` → permet `import PageHeader from "./components/PageHeader.jsx"`.

> ❓ **Pourquoi `{ title }` dans le JSX ?** Les accolades = « insère du **JavaScript** ici ». Sans accolades, React afficherait le mot `title` en lettres.

> ✅ **Todo :** fichier créé, pas d'erreur rouge dans l'éditeur.

---

# Composant 2 — `ArticleCard.jsx`

## Objectif

Afficher **une carte** pour **un** article : titre, statut publié/brouillon, boutons Modifier / Supprimer.

**Chemin :** `admin/src/components/ArticleCard.jsx`

```jsx
/**
 * ArticleCard — carte d'un article (affichage + actions).
 * Props :
 *   - article : { id, titre, contenu, publie, date }
 *   - onEdit : fonction(id) — appelée au clic « Modifier »
 *   - onDelete : fonction(id) — appelée au clic « Supprimer »
 */
function ArticleCard({ article, onEdit, onDelete }) {
  // On extrait les champs pour la lisibilité (équivalent article.titre, etc.)
  const { id, titre, contenu, publie, date } = article;

  // Texte affiché selon le booléen publie (comme en Java : true / false)
  const statutLabel = publie ? "Publié" : "Brouillon";

  return (
    <article className="article-card">
      <h2>{titre}</h2>
      <p className="article-meta">
        #{id} — {statutLabel} — {date}
      </p>
      <p className="article-contenu">{contenu}</p>
      <div className="article-actions">
        <button type="button" onClick={() => onEdit(id)}>
          Modifier
        </button>
        <button type="button" onClick={() => onDelete(id)}>
          Supprimer
        </button>
      </div>
    </article>
  );
}

export default ArticleCard;
```

**Explication ligne par ligne :**

- `{ article, onEdit, onDelete }` → **3 props** : données + 2 callbacks.
- `const { id, titre, … } = article` → **destructuration** d'objet — raccourci pratique.
- `publie ? "Publié" : "Brouillon"` → opérateur ternaire : si vrai / sinon.
- `<article>` → balise HTML pour un contenu autonome (article de blog).
- `onClick={() => onEdit(id)}` → au clic, appelle la fonction **reçue du parent** avec l'**id**.  
  🗣️ *« Events up » : l'enfant **signale** ; le parent **décide** quoi faire.*
- `type="button"` → évite que le bouton ne soumette un formulaire (bonne pratique).

> 💡 **ArticleCard ne fait pas le DELETE** — il **prévient** le parent via `onDelete(id)`. Étape 06 branchera le vrai `fetch`.

> ✅ **Todo :** compile / hot reload OK.

---

# Composant 3 — `ArticleList.jsx`

## Objectif

Recevoir un **tableau** d'articles et afficher **une `ArticleCard` par élément**.

**Chemin :** `admin/src/components/ArticleList.jsx`

```jsx
import ArticleCard from "./ArticleCard.jsx";

/**
 * ArticleList — liste de cartes articles.
 * Props :
 *   - articles : tableau d'objets article
 *   - onEdit, onDelete : callbacks transmis à chaque ArticleCard
 */
function ArticleList({ articles, onEdit, onDelete }) {
  // Cas limite : tableau vide — message clair pour l'utilisateur
  if (articles.length === 0) {
    return <p className="empty-list">Aucun article à afficher.</p>;
  }

  return (
    <section className="article-list">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </section>
  );
}

export default ArticleList;
```

**Explication ligne par ligne :**

- `import ArticleCard from "./ArticleCard.jsx"` → ce composant **utilise** ArticleCard (composition).
- `if (articles.length === 0)` → **garde** : évite une liste vide sans explication.
- `articles.map((article) => …)` → **boucle** React : pour chaque article, crée une carte.  
  🗣️ *Comme une `for` en Java, mais qui renvoie du JSX.*
- `key={article.id}` → **obligatoire** dans une liste — aide React à savoir quelle carte a changé. Utilise un id **stable** (pas l'index si possible).
- `article={article}` → passe **l'objet courant** à l'enfant.
- `onEdit={onEdit}` → **retransmet** la même fonction du parent — pas besoin de la recréer.

> ❓ **Pourquoi `key` ?** Sans clé unique, React peut **mélanger** les cartes lors d'une mise à jour. Avec `id`, chaque carte reste identifiée.

> ✅ **Todo :** trois cartes visibles quand tu brancheras `App` (étape suivante dans ce doc).

---

# Composant parent — `App.jsx`

## Objectif

Orchestrer : données en dur, callbacks (pour l'instant : `console.log`), composition des enfants.

**Remplace** le contenu de **`admin/src/App.jsx`** (supprime `useEffect`, `fetch`, `API_URL`) :

```jsx
import PageHeader from "./components/PageHeader.jsx";
import ArticleList from "./components/ArticleList.jsx";
import { articlesSample } from "./data/articlesSample.js";
import "./App.css";

/**
 * App — racine du back-office.
 * Rôle : posséder les données (ici en dur) et passer des props aux enfants.
 */
function App() {
  // Données en dur — étape 04 : viendront de l'API
  const articles = articlesSample;

  // Callbacks — étape 05/06 : ouvrir formulaire ou appeler DELETE
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
        <ArticleList
          articles={articles}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}

export default App;
```

**Explication — props en action :**

| Ligne | En clair |
|---|---|
| `const articles = articlesSample` | Le parent **détient** les données |
| `function handleEdit(id)` | Le parent **définit** l'action (ici : log console) |
| `<PageHeader title="…" />` | Prop **simple** (chaîne de caractères) |
| `<ArticleList articles={articles} … />` | Prop **tableau** + passage des callbacks |
| `onEdit={handleEdit}` | On passe la **référence** de la fonction (sans `()`) |

> ❓ **`onEdit={handleEdit}` vs `onEdit={handleEdit()}` ?**  
> - `{handleEdit}` → « voici la fonction à appeler plus tard » ✅  
> - `{handleEdit()}` → « appelle-la **tout de suite** au rendu » ❌ (sauf cas rares)

> ✅ **Vérifie :** 3 cartes s'affichent ; clic Modifier/Supprimer → messages dans la **console** (F12).

---

## 4. CSS minimal — rendre la liste lisible

Dans **`admin/src/App.css`**, ajoute (ou complète) :

```css
.app {
  max-width: 720px;
  margin: 0 auto;
  padding: 1rem;
  font-family: system-ui, sans-serif;
}

.page-header {
  border-bottom: 2px solid #333;
  margin-bottom: 1.5rem;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.article-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
  background: #fafafa;
}

.article-meta {
  font-size: 0.85rem;
  color: #555;
}

.article-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.article-actions button {
  cursor: pointer;
  padding: 0.35rem 0.75rem;
}

.empty-list {
  color: #888;
  font-style: italic;
}
```

> 💡 Pas de framework CSS imposé — le but est la **lisibilité**, pas le design.

---

## 5. Exercice rapide — manipuler les props

1. Change le `title` de `PageHeader` → le titre à l'écran change **sans** toucher à `PageHeader.jsx` (c'est le parent qui décide).
2. Commente un article dans `articlesSample.js` → une carte disparaît.
3. Passe `articles={[]}` dans `App` → message « Aucun article… ».

> 🎯 **Leçon :** les **props** contrôlent l'affichage **depuis le parent**.

---

## 6. Enregistrer l'étape dans Git

```bash
cd admin/..   # racine java_blog
git status
git add admin/src/
git commit -m "04-03 — Composants PageHeader, ArticleCard, ArticleList + props"
git log --oneline
```

> ✅ **Vérifie :** commit sur branche `partie-04`.

---

## 🆘 En cas de problème

| Ce que tu vois | Pourquoi | Quoi faire |
|---|---|---|
| `articles.map is not a function` | `articles` n'est pas un tableau | Vérifie `articlesSample` et la prop `articles={…}` |
| Each child should have a unique `key` | `key` manquant | Ajoute `key={article.id}` sur `ArticleCard` |
| Boutons ne loggent rien | Console fermée ou mauvaise fonction | F12 → onglet Console ; vérifie `onEdit={handleEdit}` |
| Page blanche | Erreur de syntaxe JSX | Lis le message dans la console ou le terminal Vite |
| Import introuvable | Mauvais chemin | Vérifie `./components/…` et l'extension `.jsx` |

---

## ✅ Récapitulatif

Tu sais maintenant :

- [ ] Créer un composant **fonction** + `export default`
- [ ] Passer une prop **simple** (`title`)
- [ ] Passer un **objet** (`article`) et un **tableau** (`articles`)
- [ ] Passer des **callbacks** (`onEdit`, `onDelete`) — events up
- [ ] Utiliser `.map()` pour une liste avec `key`
- [ ] Séparer **données** (parent) et **affichage** (enfants)

---

## Suite

👉 **[partie-04-04-appels-api.md](partie-04-04-appels-api.md)** — remplacer `articlesSample` par un vrai appel à `GET /articles/recents` via `api/articles.js`.
