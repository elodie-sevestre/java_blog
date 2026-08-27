# Partie 04 — Étape 02
# Installer React (Vite) et préparer le lien avec l'API

> 📘 **Ce document est ton support.** Chaque commande et chaque ligne de code est expliquée — comme en Java aux parties 01–03.  
> 🗣️ **On vulgarise :** si un mot te semble compliqué, c'est normal ; il est défini avant d'être réutilisé.  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** [partie-04-01-cadrage-react-composants.md](partie-04-01-cadrage-react-composants.md) lu ; API Spring qui tourne (`./mvnw spring-boot:run`, `/articles` OK).

## Ce que tu auras à la fin de cette étape

- Un dossier **`admin/`** avec une app **React** qui démarre dans le navigateur.
- La **structure de dossiers** prête pour les composants (`components/`, `api/`).
- **CORS** configuré côté Spring — sans ça, React ne pourrait pas parler à l'API.
- La branche Git **`partie-04`** avec un premier commit.

> ⏱️ **Durée estimée :** 30 à 45 minutes.

---

## Todo

- [ ] Vérifier Node.js installé (`node -v`, `npm -v`)
- [ ] Créer le projet Vite dans `admin/`
- [ ] Lancer React (`npm run dev`) — voir la page d'accueil Vite
- [ ] Créer les dossiers `src/components/` et `src/api/`
- [ ] Ajouter la config **CORS** dans Spring Boot
- [ ] Tester un `fetch` simple vers `/articles` (console navigateur)
- [ ] Committer sur `partie-04`
- [ ] Passer à `partie-04-03-premiers-composants-props.md`

---

## 0. Deux applis, un seul projet — c'est quoi ?

Imagine **deux programmes** dans le même dossier `java_blog` :

| App | Langage | Port | Rôle |
|---|---|---|---|
| **Spring Boot** | Java | **8080** | L'**API** — données, base PostgreSQL |
| **React (admin/)** | JavaScript | **5173** | L'**écran admin** — boutons, formulaires |

> 💡 **Métaphore :** Spring Boot = la **cuisine** (prépare les plats). React = la **salle** (montre le menu et prend la commande). La salle ne cuisine pas : elle **demande** à la cuisine via HTTP (`fetch`).

Tu lanceras **deux terminaux** en parallèle :

```bash
# Terminal 1 — API Java
./mvnw spring-boot:run

# Terminal 2 — React (plus tard dans cette étape)
cd admin && npm run dev
```

---

## 1. Node.js et npm — c'est quoi ?

**Node.js** = un moteur qui exécute du **JavaScript en dehors du navigateur** (dans le terminal).

**npm** = le **gestionnaire de paquets** de Node — il télécharge les bibliothèques (dont React).

Vérifie que c'est installé :

```bash
node -v    # ex. v20.x ou v22.x
npm -v     # ex. 10.x
```

> ❓ **Pas installé ?** Télécharge le **LTS** sur **https://nodejs.org** (version recommandée pour la plupart des utilisateurs).

> ✅ **Vérifie :** les deux commandes affichent un numéro de version.

---

## 2. Vite — c'est quoi ?

**Vite** = un outil qui **crée et lance** un projet React **rapidement**.

Sans Vite, il faudrait configurer à la main des dizaines de fichiers. Vite fait le **gros du travail** en une commande.

> 💡 Tu peux voir Vite comme le **Spring Initializr** du monde JavaScript : tu obtiens un projet prêt à coder.

---

## 3. Créer le projet React dans `admin/`

Place-toi à la **racine** de `java_blog` (là où se trouve `pom.xml`) :

```bash
npm create vite@latest admin -- --template react
```

**Explication :**

- `npm create vite@latest` → lance l'assistant Vite.
- `admin` → nom du **dossier** créé (notre back-office).
- `-- --template react` → modèle **React** en JavaScript (pas TypeScript — plus simple pour débuter).

Ensuite, entre dans le dossier et installe les dépendances :

```bash
cd admin
npm install
```

**Ce que ça télécharge :** React, ReactDOM, et les outils de compilation.

> ✅ **Vérifie :** le dossier `admin/` contient `package.json`, `vite.config.js`, `src/main.jsx`.

---

## 4. Lancer React pour la première fois

Toujours dans `admin/` :

```bash
npm run dev
```

Le terminal affiche une adresse du type :

```
  ➜  Local:   http://localhost:5173/
```

Ouvre cette URL dans le navigateur → tu vois le **logo Vite + React** par défaut.

> ✅ **Todo :** la page s'affiche. **Ne ferme pas** le terminal (le serveur de dev tourne).

> ❓ **Pourquoi le port 5173 et pas 8080 ?** Chaque app écoute sur **son** port. 8080 = Java. 5173 = Vite. C'est normal d'en avoir deux.

---

## 5. Structure du projet — où mettre quoi ?

Après création, tu as déjà :

```
admin/
├── index.html          ← page HTML minimale (React s'y accroche)
├── package.json        ← liste des bibliothèques npm
├── vite.config.js      ← réglages Vite
└── src/
    ├── main.jsx        ← point d'entrée : « monte » React dans la page
    ├── App.jsx         ← composant racine (on l'enrichira)
    ├── App.css         ← styles de App
    └── index.css       ← styles globaux
```

**Crée deux dossiers** pour la suite (dans `admin/src/`) :

```bash
mkdir -p src/components
mkdir -p src/api
```

| Dossier | Rôle (vulgarisé) |
|---|---|
| `components/` | Les **morceaux d'écran** réutilisables (cartes, listes, formulaires) |
| `api/` | Les **appels téléphoniques** vers Spring Boot (`fetch`) |

> 💡 Rappel partie 04-01 : les composants reçoivent des **props** ; `api/` parle à Java.

---

## 6. Nettoyer `App.jsx` — page admin minimaliste

On remplace le template Vite par une **coquille vide** prête pour l'étape suivante.

Ouvre **`admin/src/App.jsx`** et remplace tout le contenu par :

```jsx
/**
 * App — composant racine du back-office.
 * Pour l'instant : un titre seulement. Les listes et formulaires viendront aux étapes 03–05.
 */
function App() {
  return (
    <div className="app">
      <h1>Back-office — Blog Java</h1>
      <p>Prochaine étape : composants et props.</p>
    </div>
  );
}

export default App;
```

**Explication ligne par ligne :**

- `/** … */` → commentaire de documentation (comme en Java).
- `function App()` → **composant** React = une fonction qui retourne du JSX.
- `return (` → ce qui s'affiche à l'écran.
- `<div className="app">` → conteneur. **`className`** (pas `class`) : en JSX, `class` est un mot réservé JavaScript.
- `<h1>` / `<p>` → titre et texte HTML classiques.
- `export default App` → permet d'importer `App` depuis `main.jsx`.

Sauvegarde → le navigateur **se rafraîchit tout seul** (hot reload de Vite).

> ✅ **Vérifie :** tu vois « Back-office — Blog Java ».

---

## 7. CORS — pourquoi React n'arrive pas à parler à Java (sans config)

**CORS** = règle de **sécurité du navigateur**.

Quand React (`http://localhost:5173`) appelle l'API (`http://localhost:8080`), le navigateur dit :

> « Ce n'est **pas la même adresse** — est-ce que le serveur Java **autorise** ce site à l'appeler ? »

Sans réponse **oui** de Spring → erreur dans la console :

```
Access to fetch at 'http://localhost:8080/articles' from origin 'http://localhost:5173' has been blocked by CORS policy
```

> 💡 **Métaphore :** CORS = le videur à l'entrée de la cuisine. Il faut dire explicitement : « les clients du port 5173 sont les bienvenus ».

---

## 8. Configurer CORS côté Spring Boot

Dans le projet Java, crée un fichier de configuration :

**Chemin :** `src/main/java/fr/ada/java_blog/config/WebConfig.java`

```java
package fr.ada.java_blog.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
```

**Explication ligne par ligne :**

- `package fr.ada.java_blog.config;` → nouveau package `config` pour la configuration web.
- `@Configuration` → Spring charge cette classe au démarrage.
- `implements WebMvcConfigurer` → on peut **personnaliser** le comportement HTTP de Spring.
- `addCorsMappings` → « voici qui a le droit d'appeler l'API depuis un navigateur ».
- `addMapping("/**")` → toutes les routes (`/articles`, `/admin/…`).
- `allowedOrigins("http://localhost:5173")` → **seul** le front React local est autorisé (port Vite).
- `allowedMethods(...)` → verbes HTTP autorisés (GET lire, POST créer, etc.).
- `allowedHeaders("*")` → en-têtes HTTP acceptés (ex. `Content-Type: application/json`).

> ⚠️ **En production**, on ne mettrait pas `*` partout — ici c'est un **réglage de dev** pour la formation.

**Redémarre Spring Boot** (`Ctrl+C` puis `./mvnw spring-boot:run`).

> ✅ **Todo :** Spring redémarre sans erreur.

---

## 9. Premier `fetch` — preuve que React peut joindre l'API

On fait un test **temporaire** dans `App.jsx` (on le remplacera par de vrais composants à l'étape 03).

Ajoute en haut de `App.jsx` :

```jsx
import { useEffect, useState } from "react";

const API_URL = "http://localhost:8080";
```

Puis remplace le corps de `App` par :

```jsx
function App() {
  // useState = « mémoire » du composant : ici, la liste d'articles (vide au début)
  const [articles, setArticles] = useState([]);

  // useEffect = « fais ceci une fois au chargement de la page »
  useEffect(() => {
    fetch(`${API_URL}/articles`)
      .then((response) => response.json())
      .then((data) => setArticles(data))
      .catch((error) => console.error("Erreur fetch :", error));
  }, []);

  return (
    <div className="app">
      <h1>Back-office — Blog Java</h1>
      <p>Nombre d&apos;articles publiés reçus de l&apos;API : {articles.length}</p>
    </div>
  );
}
```

**Explication vulgarisée :**

| Ligne | En clair |
|---|---|
| `useState([])` | Une **variable** qui, quand elle change, **rafraîchit** l'écran. Ici : tableau d'articles. |
| `useEffect(..., [])` | « Au **premier affichage**, va chercher les données ». Les `[]` = une seule fois. |
| `fetch(...)` | Comme `curl` dans le navigateur — appelle l'URL. |
| `.then(response => response.json())` | « Quand la réponse arrive, transforme le JSON en objet JavaScript ». |
| `.then(data => setArticles(data))` | « Stocke les articles dans le state → l'écran se met à jour ». |
| `{articles.length}` | Affiche le **nombre** d'articles dans le JSX. |

> ✅ **Vérifie :** avec Spring **et** React lancés, tu vois un nombre > 0 (si tu as des articles publiés en base).

> ❓ **Erreur CORS ?** Reprends l'étape 8 et redémarre Spring.

> 💡 **Étape 03 :** on sortira ce `fetch` de `App` vers `api/articles.js` et on passera les données aux enfants via **props**.

---

## 10. `.gitignore` — ne pas versionner `node_modules`

Le dossier `admin/node_modules/` est **énorme** (milliers de fichiers téléchargés). On ne le met **pas** dans Git.

À la **racine** du projet (`java_blog/.gitignore`), ajoute si absent :

```
# React admin (partie 04)
admin/node_modules/
admin/dist/
```

> ❓ **Pourquoi ?** Comme `target/` pour Maven — on versionne le **code source**, pas les bibliothèques téléchargées.

---

## 11. Branche Git et commit

La branche **`partie-04`** a été **créée** dans [partie-04-01-cadrage-react-composants.md](partie-04-01-cadrage-react-composants.md). Vérifie avant de committer :

```bash
git branch   # * partie-04
```

Si tu n'es **pas** sur `partie-04` :

```bash
git checkout partie-04
```

Puis committe le setup :

```bash
git status
git add admin/ src/main/java/fr/ada/java_blog/config/WebConfig.java .gitignore
git commit -m "04-02 — Setup React (Vite) dans admin/ + CORS Spring"
git log --oneline
```

> ✅ **Vérifie :** `git branch` affiche `* partie-04`.

---

## 🆘 En cas de problème

| Ce que tu vois | Pourquoi | Quoi faire |
|---|---|---|
| `command not found: npm` | Node.js absent | Installe Node LTS |
| Page blanche React | Erreur JS | Ouvre la **console** du navigateur (F12) |
| CORS blocked | Spring pas configuré | Étape 8 + redémarrage Spring |
| `ERR_CONNECTION_REFUSED` sur `:5173` | React arrêté | `cd admin && npm run dev` |
| `Failed to fetch` | Spring arrêté | Lance `./mvnw spring-boot:run` |
| **401** au login (partie 05) | Upgrade BCrypt absent | [doc/sql/upgrade-05-01-bcrypt-alice.sql](sql/upgrade-05-01-bcrypt-alice.sql) |
| Port 5173 already in use | Vite déjà lancé | Ferme l'autre terminal ou change le port dans `vite.config.js` |
| `articles.length` = 0 | Aucun article **publié** en base | Normal si table vide ; teste aussi `/articles/recents` en API |

---

## ✅ Récapitulatif

- [ ] Node.js + npm OK
- [ ] Projet `admin/` créé avec Vite + React
- [ ] `npm run dev` → page visible sur le port **5173**
- [ ] Dossiers `src/components/` et `src/api/` créés
- [ ] CORS configuré (`WebConfig.java`)
- [ ] Test `fetch` → nombre d'articles affiché
- [ ] Commit sur `partie-04`

---

## Suite

👉 **[partie-04-03-premiers-composants-props.md](partie-04-03-premiers-composants-props.md)** — créer `PageHeader`, `ArticleCard`, `ArticleList` avec des **props** (données en dur d'abord, sans API).
