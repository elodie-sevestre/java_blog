# Partie 04 — Étape 01
# Cadrage React : composants, props et bonnes pratiques

> 📘 **Lis ce doc en premier.** Pas de code ici : on pose le vocabulaire et les **règles du projet React**.  
> Public visé : élèves avec **~2 jours de React** — on va **lentement**, une brique à la fois, **très commenté**.  
> 🗣️ **Ton des supports :** on **vulgarise** systématiquement (métaphores, pas de jargon sans explication). Chaque mot nouveau est défini avant d'être utilisé.  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** partie 03 terminée (API articles CRUD + GET publics, branche `partie-03`).

---

> ### Encadré — Démarrage partie 04 (formateur / apprenants)
>
> **Point de départ Git :** branche **`partie-03`** — pas **`main`** (référence formateur, React déjà inclus).
>
> ```bash
> git clone https://github.com/ZoliveAllegret/java_blog.git
> cd java_blog
> git checkout partie-03
> git branch                    # * partie-03
> ls admin 2>/dev/null || echo "OK : pas de dossier admin/ — normal"
> ./mvnw spring-boot:run        # http://localhost:8080/articles/recents
> ```
>
> Puis créer ta branche de travail :
>
> ```bash
> git checkout -b partie-04
> ```
>
> | Élément | Partie 04 |
> |---|---|
> | **Tu as déjà** | API Spring (GET publics + CRUD `/admin/articles`), PostgreSQL `java_blog`, CORS (`WebConfig`) |
> | **Tu crées ici** | Dossier **`admin/`** (Vite + React) — voir [partie-04-02](partie-04-02-setup-react-vite.md) |
> | **Pas encore** | Login JWT (partie 05), tests DevOps complets (partie 06) |
> | **BDD** | `doc/blog.sql` suffit — **pas** `upgrade-05-01` avant la partie 05 |
> | **Prérequis machine** | Java 21, PostgreSQL, **Node.js 20+** (pour Vite) |
>
> **Supports :** [INDEX.md](INDEX.md) → tu es ici → [partie-04-02-setup-react-vite.md](partie-04-02-setup-react-vite.md) … `04-06`.
>
> Sur la branche `partie-03`, le **README** du dépôt décrit le projet **sans** React — ignore les mentions `cd admin` tant que tu n'as pas fini l'étape 04-02.
>
> **Ancienne copie / dossier iCloud ?** → [macOS / Linux](annexe-reinstall-propre.md) · [Windows](annexe-reinstall-propre-windows.md)

---

## Objectif de cette étape

Comprendre **comment on va construire le back-office** avant d'écrire du JSX :

- ce qu'est un **composant** ;
- comment passer des données avec les **props** ;
- comment decouper l'interface en **petits composants réutilisables** ;
- ce qu'on **ne fait pas** (pas de Redux, pas de raccourcis).

---

## Todo

- [ ] Comprendre composant vs props vs state (rappel 2 jours React)
- [ ] Retenir l'arborescence cible des composants
- [ ] Retenir les 5 bonnes pratiques obligatoires du projet
- [ ] Créer la branche Git `partie-04` depuis `partie-03`
- [ ] Passer à `partie-04-02-setup-react-vite.md`

---

> **Encadré continuité — de Spring Boot à React**  
> **Partie 03** : tu as une **API REST** (`GET /articles`, `POST /admin/articles`…).  
> **Partie 04** : tu construis une **interface admin** qui **appelle** cette API.  
> React ne parle **pas** à PostgreSQL directement — il parle à Spring Boot sur `http://localhost:8080`.  
> **Partie 05** : on ajoutera le login ; pour l'instant l'API `/admin` reste ouverte en dev.

---

## Rappel express — 2 jours de React

| Mot | En une phrase |
|---|---|
| **Composant** | Une **fonction** (ou classe) qui retourne du **JSX** = morceau d'interface |
| **JSX** | Du HTML-like **dans** le JavaScript |
| **Props** | Données **entrantes** d'un composant parent → enfant (en lecture seule pour l'enfant) |
| **State** | Données **internes** qui changent (`useState`) — on en utilise **peu** au début |
| **Hook** | Fonction React (`useState`, `useEffect`…) — on n'en abuse pas ici |

> 💡 **Fil rouge partie 04 :** d'abord maîtriser **props + composition**. Le state et `useEffect` servent surtout au **composant parent** qui charge l'API.

---

## Principe n°1 — Un composant = une responsabilité

Comme en Java (**1 fichier = 1 classe**), en React :

| Règle | Exemple back-office |
|---|---|
| **1 fichier = 1 composant** | `ArticleCard.jsx`, pas tout dans `App.jsx` |
| **Nom = rôle** | `ArticleList`, `ArticleForm`, `PageHeader` |
| **Petit** | Si un composant dépasse ~80 lignes, decoupe-le |

**Mauvaise pratique :** tout mettre dans `App.jsx` (500 lignes, illisible).  
**Bonne pratique :** `App` orchestre ; les enfants **affichent** ou **capturent** une action.

---

## Principe n°2 — Props : données du parent vers l'enfant

```
App (parent)
  │  articles={liste}          ← prop : données
  │  onDelete={handleDelete}   ← prop : callback (fonction)
  ▼
ArticleList (enfant)
  │  repasse article={unArticle} à chaque carte
  ▼
ArticleCard (petit-enfant)
```

| Type de prop | Rôle | Exemple |
|---|---|---|
| **Donnée** | Afficher | `article={…}`, `title="Articles"` |
| **Callback** | Remonter une action | `onSubmit={…}`, `onDelete={…}` |
| **Booléen** | Variante UI | `isLoading={true}`, `disabled={false}` |

> ❓ **Pourquoi les props ?** L'enfant **ne connaît pas** l'API. Il reçoit ce qu'il doit afficher et **signale** les clics au parent. Testable, lisible, réutilisable.

**Convention du projet :**

- Props en **camelCase** : `article`, `onSubmit`, `isLoading`.
- Destructurer en tête de fonction :

```jsx
// ✅ Bon — on voit tout de suite ce que le composant attend
function ArticleCard({ article, onDelete }) {
  // ...
}
```

---

## Principe n°3 — « Props down, events up »

| Direction | Mécanisme | Exemple |
|---|---|---|
| **Vers le bas** | Props (données) | Parent passe `articles` à `ArticleList` |
| **Vers le haut** | Callback en prop | `ArticleCard` appelle `onDelete(id)` → parent exécute `fetch DELETE` |

L'enfant **ne fait pas** `fetch` lui-même (sauf cas très avancé — pas dans cette partie).

---

## Principe n°4 — Séparer affichage et logique API

| Couche | Où ? | Rôle |
|---|---|---|
| **`api/`** | `src/api/articles.js` | Fonctions `fetch` vers Spring Boot |
| **Page / conteneur** | `App.jsx` ou `ArticlesPage.jsx` | `useState`, `useEffect`, appelle `api/` |
| **Composants présentation** | `components/` | Reçoient des **props**, affichent, émettent des **callbacks** |

> 💡 Analogie Java : `api/` = repository ; composant parent = controller ; composants enfants = templates / fragments UI.

---

## Principe n°5 — Commentaires obligatoires

Chaque fichier `.jsx` commence par un **bloc commentaire** :

```jsx
/**
 * ArticleCard — carte d'affichage d'un article (lecture seule + bouton supprimer).
 * Props :
 *   - article : objet { id, titre, contenu, publie, date }
 *   - onDelete : fonction(id) appelée au clic sur Supprimer
 */
```

Dans le corps : commenter **chaque prop utilisée** et **chaque callback** — comme les imports en Java dans les supports partie 01–03.

---

## Arborescence cible (fin de partie 04)

```
java_blog/
├── src/main/java/…          ← API Spring (inchangée, partie 03)
└── admin/                   ← NOUVEAU — app React (Vite)
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx         ← point d'entrée React
        ├── App.jsx          ← page principale (state + effets)
        ├── api/
        │   └── articles.js  ← fetch GET/POST/PUT/DELETE
        └── components/
            ├── PageHeader.jsx
            ├── ArticleList.jsx
            ├── ArticleCard.jsx
            ├── ArticleForm.jsx
            └── LoadingMessage.jsx
```

> 📁 Le dossier `admin/` vit **à la racine** du projet, à côté de `src/main/java` — deux apps, un repo.

---

## Composants prévus — qui reçoit quelles props ?

| Composant | Props (entrées) | Rôle |
|---|---|---|
| `PageHeader` | `title` | Titre de la page admin |
| `LoadingMessage` | *(aucune)* ou `text` | « Chargement… » |
| `ArticleList` | `articles`, `onEdit`, `onDelete` | Liste ; délègue à `ArticleCard` |
| `ArticleCard` | `article`, `onEdit`, `onDelete` | Une carte article |
| `ArticleForm` | `initialValues`, `onSubmit`, `onCancel`, `submitLabel` | Création **ou** édition (même composant, props différentes) |

**Pattern réutilisable — `ArticleForm` :**

- **Créer** : `initialValues={null}`, `submitLabel="Créer"`.
- **Modifier** : `initialValues={article}`, `submitLabel="Enregistrer"`.

> 💡 **Une seule forme, deux usages** — c'est l'intérêt des props.

---

## Parcours de la partie 04

| Doc | Tu fais… |
|---|---|
| **partie-04-01** *(ici)* | Cadrage composants + props |
| [partie-04-02-setup-react-vite.md](partie-04-02-setup-react-vite.md) | Vite, structure, CORS, commit `04-02` |
| [partie-04-03-premiers-composants-props.md](partie-04-03-premiers-composants-props.md) | `PageHeader`, `ArticleCard`, `ArticleList` (données **en dur** d'abord) |
| [partie-04-04-appels-api.md](partie-04-04-appels-api.md) | Module `api/articles.js` + `useEffect` dans `App` |
| [partie-04-05-formulaire-crud.md](partie-04-05-formulaire-crud.md) | `ArticleForm` + POST / PUT |
| [partie-04-06-suppression-et-recap.md](partie-04-06-suppression-et-recap.md) | DELETE + gestion erreurs + récap |

Chaque support : **objectif**, **pourquoi**, **code commenté ligne par ligne**, **todo**, **branche Git**, **commit Git**.

---

## Commits Git attendus (`partie-04`)

| Commit | Document |
|---|---|
| `04-02` | [partie-04-02-setup-react-vite.md](partie-04-02-setup-react-vite.md) |
| `04-03` | [partie-04-03-premiers-composants-props.md](partie-04-03-premiers-composants-props.md) |
| `04-04` | [partie-04-04-appels-api.md](partie-04-04-appels-api.md) |
| `04-05` | [partie-04-05-formulaire-crud.md](partie-04-05-formulaire-crud.md) |
| `04-06` | [partie-04-06-suppression-et-recap.md](partie-04-06-suppression-et-recap.md) |

> 💡 **`partie-04-01`** = cadrage + création branche — pas de commit dédié.

---

## Ce qu'on n'utilise PAS (partie 04)

| Techno | Pourquoi pas maintenant |
|---|---|
| Redux / Zustand | Trop tôt — `useState` dans `App` suffit |
| TypeScript | Optionnel plus tard — on reste en `.jsx` + commentaires |
| React Router | Une seule page admin suffit |
| CSS framework imposé | CSS modules ou fichier `App.css` simple |
| Composants classe | Uniquement **fonctions** + hooks |

---

## CORS — à prévoir dès l'étape 02

React (port **5173**) → API (port **8080**) = **origines différentes**.  
Spring doit autoriser le front — configuré dans `partie-04-02-setup-react-vite.md`.

---

## Créer la branche Git `partie-04`

```bash
git checkout partie-03
git checkout -b partie-04
git branch
```

> 💡 **Pas de commit ici** — le premier commit viendra avec le setup Vite (`partie-04-02`).

---

## Suite

👉 **[partie-04-02-setup-react-vite.md](partie-04-02-setup-react-vite.md)** — créer le projet React dans `admin/`.
