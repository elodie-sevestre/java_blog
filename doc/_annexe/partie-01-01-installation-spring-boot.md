# Partie 01 — Installation et premiers pas Spring Boot

> 📘 **Ce document est ton support.** On le déroule ensemble en cours, mais tu pourras le reprendre seul pour **tout refaire de ton côté**. Chaque ligne de code y est expliquée, imports compris.  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> 📖 **Vocabulaire :** `annexe-01-glossaire.md` (en parallèle)

## Ce que tu vas savoir faire à la fin de cette étape

- Créer et lancer un projet **Spring Boot**.
- Écrire une **classe** Java et **créer des objets** à partir de cette classe.
- **Manipuler** ces objets (les modifier, lire leurs valeurs).
- **Exposer** une liste d'objets sur une URL, sous forme de **JSON**.
- **Versionner** le projet avec **Git** sur une branche dédiée à cette étape.

> 🧵 **Le fil rouge :** on construit une application de **blog**. À cette étape, `Article` est une **classe Java** en mémoire (getters, pas de base) et tu exposes des routes `/ping` et `/articles`.

---

## 0. Avant de commencer : vérifier ton environnement

Tu dois avoir **Java 21** et **VS Code** installés. Vérifie-le.

### Vérifier Java

Ouvre un terminal (Windows : *PowerShell* ; macOS : *Terminal*) et tape **les deux** commandes :

```bash
java -version
javac -version
```

Tu dois voir apparaître **21** dans les deux résultats, par exemple :

```
openjdk version "21.0.x" ...
javac 21.0.x
```

> ❓ **Pourquoi deux commandes ?** `java` sert à **exécuter** un programme, `javac` à le **compiler**. Pour développer, il faut les deux. Si `javac` est introuvable, tu n'as qu'un JRE (exécution seule) et pas un JDK complet → préviens le formateur.

### Vérifier VS Code

Dans VS Code, ouvre les **Extensions** (`Ctrl/Cmd + Shift + X`) et assure-toi d'avoir installé :

1. **Extension Pack for Java** (éditeur : Microsoft)
2. **Spring Boot Extension Pack** (éditeur : VMware / Broadcom)

Puis vérifie que VS Code utilise bien Java 21 : `Ctrl/Cmd + Shift + P` → tape **`Java: Configure Java Runtime`** → tu dois voir **Java 21** comme runtime par défaut.

### Vérifier Git

Git sert à **enregistrer l'historique** de ton code et à travailler par **étapes** (une branche par support).

```bash
git --version
```

Tu dois voir un numéro de version (ex. `git version 2.x.x`). Si la commande est introuvable → préviens le formateur.

> ✅ **Vérifie :** les deux commandes Java renvoient bien 21, les deux extensions VS Code sont installées, et `git --version` répond.

---

## 1. Créer le projet Spring Boot

On ne crée pas le projet à la main : on utilise un générateur officiel, **Spring Initializr**.

Va sur **https://start.spring.io** et remplis exactement :

| Champ | Valeur |
|---|---|
| **Project** | Maven |
| **Language** | Java |
| **Spring Boot** | la version **stable** proposée par défaut (évite celles marquées `SNAPSHOT` ou `M…`) |
| **Group** | `fr.ada` |
| **Artifact** | `java_blog` |
| **Name** | `java_blog` |
| **Package name** | `fr.ada.java_blog` |
| **Packaging** | Jar |
| **Java** | `21` |

Clique sur **ADD DEPENDENCIES** et ajoute **deux** dépendances :

- **Spring Web** → permet de répondre à des URL (créer des pages / une API).
- **Spring Boot DevTools** → redémarre l'application automatiquement quand tu modifies le code.

> ❓ **Pourquoi pas la base de données maintenant ?** On l'ajoutera plus tard. Si on ajoute les outils de base sans configurer de base, l'application refuse de démarrer. On évite ce piège pour aujourd'hui.

Clique sur **GENERATE** : un fichier **`java_blog.zip`** se télécharge.

### Ouvrir le projet dans VS Code

1. **Décompresse** `java_blog.zip` dans un dossier **sans accent ni espace** :
   - Windows : `C:\dev\java_blog`
   - macOS : `~/dev/java_blog`
2. Dans VS Code : **File > Open Folder…** et choisis le dossier `java_blog` (celui qui contient le fichier `pom.xml`).
3. Si VS Code demande « *Do you trust the authors?* » → clique **Yes, I trust**.
4. **Attends** : en bas de la fenêtre, une barre indique le téléchargement des dépendances (l'« import Maven »). Laisse-le finir.

> ✅ **Vérifie :** dans l'explorateur de fichiers à gauche, tu vois bien un dossier `src` et un fichier `pom.xml`.

### Initialiser Git et créer la branche de l'étape

On va versionner le projet **dès maintenant**. Chaque étape du parcours aura **sa propre branche** (`partie-01`, `partie-02`…). Ainsi, tu peux revenir à l'état exact d'une étape à tout moment.

Ouvre un terminal **à la racine du projet** (là où se trouve `pom.xml`) :

```bash
git init
git add .
git commit -m "Projet Spring Boot généré (Initializr)"
git branch -M main
git checkout -b partie-01
```

**Explication :**

- `git init` → transforme le dossier en **dépôt Git** (dossier `.git` créé).
- `git add .` → prépare **tous les fichiers** du projet pour l'enregistrement (sauf ceux listés dans `.gitignore` — Initializr en fournit un).
- `git commit -m "..."` → **enregistre un instantané** avec un message qui décrit ce qu'il contient.
- `git branch -M main` → nomme la branche par défaut **`main`** (le point de départ vierge, juste le projet généré).
- `git checkout -b partie-01` → crée et active une **nouvelle branche** pour **cette étape uniquement**. Tout le code que tu écriras aujourd'hui vivra ici, pas sur `main`.

> ❓ **Pourquoi une branche par étape ?** `main` reste la référence « projet vierge ». La branche `partie-01` contiendra **uniquement** le travail de ce support. Les prochaines étapes auront leurs propres branches.

Vérifie que tu es sur la bonne branche :

```bash
git branch
```

Résultat attendu (l'étoile `*` indique la branche active) :

```
  main
* partie-01
```

> ✅ **Vérifie :** `git branch` affiche bien `* partie-01`.

---

## 2. Découvrir le projet

Voici les éléments importants du projet généré :

```
java_blog/
├── pom.xml                       ← la liste des dépendances + la config du projet
├── src/
│   ├── main/
│   │   ├── java/fr/ada/java_blog/
│   │   │   └── JavaBlogApplication.java   ← le point de démarrage de l'application
│   │   └── resources/
│   │       └── application.properties   ← ou application.yaml (selon Initializr)
│   └── test/                          ← les tests (plus tard)
└── target/                            ← le code compilé (généré, on n'y touche pas)
```

Ouvre le fichier **`JavaBlogApplication.java`**. C'est lui qui démarre l'application.

```java
package fr.ada.java_blog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class JavaBlogApplication {

    public static void main(String[] args) {
        SpringApplication.run(JavaBlogApplication.class, args);
    }
}
```

**Explication ligne par ligne :**

- `package fr.ada.java_blog;` → déclare le **package** (le dossier logique) de cette classe. C'est le package « racine » du projet.
- `import org.springframework.boot.SpringApplication;` → importe la classe **`SpringApplication`** de Spring, qui sait démarrer une application.
- `import org.springframework.boot.autoconfigure.SpringBootApplication;` → importe l'**annotation** `@SpringBootApplication`, utilisée juste en dessous.
- `@SpringBootApplication` → annotation posée sur la classe principale. Elle active toute la « magie » de Spring Boot : configuration automatique, détection de nos classes, démarrage du serveur web.
- `public class JavaBlogApplication {` → déclare la classe `JavaBlogApplication`. `public` = visible partout. `{` ouvre le corps de la classe.
- `public static void main(String[] args) {` → la méthode **`main`**, le **point d'entrée** : c'est le tout premier code exécuté quand on lance l'application. (`static` = on peut l'appeler sans créer d'objet ; `void` = elle ne renvoie rien ; `String[] args` = d'éventuels arguments de lancement, inutilisés ici.)
- `SpringApplication.run(JavaBlogApplication.class, args);` → **démarre** l'application : lance le serveur web et met tout en route. On lui passe la classe principale (`JavaBlogApplication.class`) et les arguments (`args`).
- `}` → ferme la méthode `main`.
- `}` → ferme la classe `JavaBlogApplication`.

> 💡 **À retenir :** en Java, chaque instruction se termine par un point-virgule `;`, et les accolades `{ }` délimitent un bloc (corps d'une classe, d'une méthode…). Chaque `{` ouvert doit être refermé par un `}`.

---

## 3. Lancer l'application

Il y a **deux façons** de lancer l'application. Le résultat est le même.

### Méthode A — le bouton « Run » de VS Code

Dans `JavaBlogApplication.java`, juste au-dessus de la ligne `public static void main`, VS Code affiche **« Run | Debug »**. Clique sur **Run**. Un terminal s'ouvre automatiquement en bas.

### Méthode B — la ligne de commande *(à savoir faire absolument)*

> En entreprise, on lance très souvent une application **depuis un terminal**, sans bouton. Apprends à le faire dès maintenant.

1. Ouvre un terminal **dans VS Code** : menu **Terminal > New Terminal** (ou le raccourci `Ctrl + ù`). Il s'ouvre **à la racine du projet** (le dossier qui contient `pom.xml` et `mvnw`).
2. Tape la commande correspondant à ton système :

```bash
# macOS / Linux
./mvnw spring-boot:run
```

```powershell
# Windows (PowerShell)
.\mvnw spring-boot:run
```

**Explication de la commande :**

- `./mvnw` *(ou `.\mvnw` sous Windows)* → lance le **wrapper Maven**, un petit script livré avec le projet qui exécute Maven **sans que tu aies besoin de l'installer** toi-même. Le `./` (ou `.\`) veut dire « le fichier qui se trouve **dans le dossier courant** ».
- `spring-boot:run` → la **tâche** qu'on demande à Maven : **compiler** le projet puis **démarrer** l'application Spring Boot.

> 💡 La première fois, Maven télécharge des éléments : c'est plus long, c'est normal.

### Dans les deux cas

Regarde le **terminal**. Tu dois y voir, à la fin :

```
Tomcat started on port 8080 (http) ...
Started JavaBlogApplication in 2.3 seconds ...
```

> ❓ **Que veulent dire ces lignes ?**
> - *Tomcat started on port 8080* → le serveur web est démarré et écoute sur le port **8080**.
> - *Started JavaBlogApplication* → l'application est prête.
> Tant que ce terminal tourne, l'application est **vivante**. Pour l'arrêter : clique dans le terminal et fais `Ctrl + C`.

Ouvre ton navigateur sur **http://localhost:8080**.

Tu obtiens une page **« Whitelabel Error Page »**. **C'est normal et c'est bon signe** : le serveur répond, mais on n'a encore défini aucune URL. On va le faire tout de suite.

> ✅ **Vérifie :** tu vois bien « Started JavaBlogApplication » dans le terminal.

---

## 4. Ton premier endpoint : `/ping`

Un **endpoint**, c'est une URL à laquelle l'application sait répondre.

Dans `src/main/java/fr/ada/java_blog/`, crée un dossier **`controller`** (clic droit → *New Folder*), puis dedans un fichier **`PingController.java`** (clic droit → *New File*).

Tape ce code (ne le copie-colle pas : taper fait apprendre) :

```java
package fr.ada.java_blog.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PingController {

    @GetMapping("/ping")
    public String ping() {
        return "pong";
    }
}
```

**Explication ligne par ligne :**

- `package fr.ada.java_blog.controller;` → cette classe est dans le package `controller`. Le package doit correspondre au dossier où se trouve le fichier.
- `import org.springframework.web.bind.annotation.GetMapping;` → importe l'annotation **`@GetMapping`** (utilisée plus bas pour associer une URL à une méthode).
- `import org.springframework.web.bind.annotation.RestController;` → importe l'annotation **`@RestController`**.
- `@RestController` → indique à Spring que cette classe **répond à des requêtes web** et que ce qu'elle renvoie part **directement** dans la réponse (du texte ou des données, pas une page HTML).
- `public class PingController {` → déclare la classe `PingController`. `{` ouvre son corps.
- `@GetMapping("/ping")` → associe la méthode suivante à l'URL **`/ping`** en méthode **GET** (le type de requête qu'envoie un navigateur quand on visite une page).
- `public String ping() {` → déclare une **méthode** `ping`. `public` = appelable de l'extérieur. `String` = elle renvoie du **texte**. `()` = elle ne reçoit aucun paramètre. `{` ouvre son corps.
- `return "pong";` → **renvoie** le texte `"pong"`. C'est ce que verra le navigateur. Les guillemets `"` entourent une chaîne de caractères.
- `}` → ferme la méthode `ping`.
- `}` → ferme la classe `PingController`.

Sauvegarde (`Ctrl/Cmd + S`). Grâce à **DevTools**, l'application redémarre toute seule.

Ouvre **http://localhost:8080/ping** → tu lis **`pong`**. 🎉

> ✅ **Vérifie :** le navigateur affiche bien `pong`.

---

## 5. Manipuler les classes Java *(le cœur de la matinée)*

Jusqu'ici, on a utilisé du code tout prêt. Maintenant on va écrire **nos propres classes**.

> ❓ **Classe ou objet ?**
> Une **classe** est un **moule** : elle décrit ce qu'est un article (un titre, un contenu, publié ou non). Un **objet** est un **exemplaire** fabriqué avec ce moule : *un* article précis. Avec une classe `Article`, on peut fabriquer autant d'objets articles qu'on veut.

### 5.1 — Créer la classe `Article`

Dans `src/main/java/fr/ada/java_blog/`, crée un dossier **`model`**, puis dedans le fichier **`Article.java`** :

```java
package fr.ada.java_blog.model;

public class Article {

    private String titre;
    private String contenu;
    private boolean publie;

    public Article(String titre, String contenu) {
        this.titre = titre;
        this.contenu = contenu;
        this.publie = false;
    }

    public String getTitre() {
        return titre;
    }

    public String getContenu() {
        return contenu;
    }

    public boolean isPublie() {
        return publie;
    }

    public void publier() {
        this.publie = true;
    }

    @Override
    public String toString() {
        return "Article{titre='" + titre + "', publie=" + publie + "}";
    }
}
```

**Explication ligne par ligne :**

- `package fr.ada.java_blog.model;` → cette classe est dans le package `model` (les classes qui représentent les **données** du blog).
- `public class Article {` → déclare la classe `Article` ; `{` ouvre son corps.
- `private String titre;` → un **attribut** : une donnée que possède chaque article. `private` = on ne peut pas y accéder directement de l'extérieur (c'est l'**encapsulation** : on protège la donnée). `String` = type texte. `titre` = le nom de l'attribut.
- `private String contenu;` → un autre attribut texte : le contenu de l'article.
- `private boolean publie;` → un attribut **`boolean`** : il ne peut valoir que `true` (vrai) ou `false` (faux). Ici : l'article est-il publié ?
- `public Article(String titre, String contenu) {` → le **constructeur**. C'est une méthode spéciale qui porte le **même nom que la classe** et sert à **fabriquer** un objet. Il reçoit deux informations en entrée : un `titre` et un `contenu`.
- `this.titre = titre;` → range le paramètre reçu dans l'attribut de l'objet. `this.titre` = « le titre **de cet objet** » ; `titre` (à droite) = le paramètre reçu. Le mot `this` sert à distinguer les deux quand ils ont le même nom.
- `this.contenu = contenu;` → pareil pour le contenu.
- `this.publie = false;` → à la création, un article est **non publié**.
- `}` → ferme le constructeur.
- `public String getTitre() {` → un **getter** : une méthode qui sert à **lire** un attribut depuis l'extérieur (puisque l'attribut est `private`). Elle renvoie un `String`.
- `return titre;` → renvoie la valeur de l'attribut `titre`.
- `}` → ferme le getter.
- `public String getContenu() { return contenu; }` → même principe pour lire le contenu.
- `public boolean isPublie() {` → le getter du booléen. **Convention Java** : pour un booléen, le getter commence par `is` et non `get`.
- `return publie;` → renvoie `true` ou `false`.
- `public void publier() {` → une **méthode métier** : une **action** qu'on peut demander à l'objet. `void` = elle ne renvoie rien (elle agit, c'est tout).
- `this.publie = true;` → passe l'attribut `publie` de cet objet à `true` : l'article devient publié.
- `}` → ferme la méthode `publier`.
- `@Override` → annotation qui signale qu'on **redéfinit** une méthode déjà existante (`toString` existe par défaut sur tous les objets Java). Elle est optionnelle, mais elle permet à Java de vérifier qu'on redéfinit correctement.
- `public String toString() {` → redéfinit la façon dont l'objet **s'affiche** sous forme de texte.
- `return "Article{titre='" + titre + "', publie=" + publie + "}";` → construit une chaîne en **collant** (concaténant avec `+`) des morceaux de texte et les valeurs des attributs. Exemple de résultat : `Article{titre='Mon premier article', publie=false}`.
- `}` → ferme `toString`.
- `}` → ferme la classe `Article`.

### 5.2 — Créer et manipuler des objets

Crée maintenant le fichier **`model/Demo.java`**. Il contient **son propre `main`** pour pouvoir tester notre classe.

```java
package fr.ada.java_blog.model;

public class Demo {
    public static void main(String[] args) {

        Article a1 = new Article("Mon premier article", "Bonjour le blog !");
        Article a2 = new Article("La machine de Turing", "Un texte sur le calcul.");

        System.out.println(a1);
        System.out.println(a2);

        a1.publier();

        System.out.println("Après publication :");
        System.out.println(a1);
        System.out.println(a2);

        System.out.println("Titre de a2 : " + a2.getTitre());
    }
}
```

**Explication ligne par ligne :**

- `package fr.ada.java_blog.model;` → même package que la classe `Article`.
- `public class Demo {` → déclare la classe `Demo`.
- `public static void main(String[] args) {` → la méthode `main`, point d'entrée : c'est ce qui s'exécute quand tu lances **ce** fichier.
- `Article a1 = new Article("Mon premier article", "Bonjour le blog !");` → **crée un objet**. À droite, `new Article(...)` fabrique l'objet en appelant le constructeur. À gauche, `Article a1` crée une variable `a1` qui **pointe** vers cet objet. Le `=` relie les deux.
- `Article a2 = new Article("La machine de Turing", "Un texte sur le calcul.");` → crée un **deuxième** objet, indépendant du premier.
- `System.out.println(a1);` → affiche `a1` dans la **console** (le terminal). `System.out` = la sortie console ; `println` = « print line » (affiche puis saute une ligne). Comme `Article` a un `toString()`, c'est lui qui décide de l'affichage.
- `System.out.println(a2);` → affiche `a2`.
- `a1.publier();` → appelle la méthode `publier()` **sur l'objet `a1`**. Le point `.` veut dire « demande à `a1` de… ». Résultat : seul `a1` devient publié.
- `System.out.println("Après publication :");` → affiche un texte fixe pour s'y retrouver.
- `System.out.println(a1);` → réaffiche `a1` (maintenant `publie=true`).
- `System.out.println(a2);` → réaffiche `a2` (toujours `publie=false` : il n'a pas été touché).
- `System.out.println("Titre de a2 : " + a2.getTitre());` → affiche un texte **collé** au résultat de `a2.getTitre()` (on appelle le getter sur `a2`).
- `}` → ferme la méthode `main`.
- `}` → ferme la classe `Demo`.

**Lance ce fichier** : clique sur **Run** au-dessus du `main` de **`Demo`**.

> ⚠️ **Attention :** ce `main` n'a **rien à voir** avec le serveur web (`JavaBlogApplication`). C'est du **Java pur** qu'on exécute juste pour expérimenter. Le résultat s'affiche dans le **terminal**, pas dans le navigateur.

Résultat attendu dans la console :

```
Article{titre='Mon premier article', publie=false}
Article{titre='La machine de Turing', publie=false}
Après publication :
Article{titre='Mon premier article', publie=true}
Article{titre='La machine de Turing', publie=false}
Titre de a2 : La machine de Turing
```

> 💡 **Le point clé :** `a1` et `a2` sont **deux objets distincts** fabriqués avec le même moule. Modifier `a1` ne change pas `a2`.

> ✅ **Vérifie :** dans ta console, `a1` est bien `publie=true` et `a2` reste `publie=false`.

### 5.3 — 🏋️ Exercice : la classe `Auteur`

À toi de jouer, **sans modèle tout fait** :

1. Crée `model/Auteur.java` avec :
   - deux attributs **privés** : `nom` (type `String`) et `email` (type `String`) ;
   - un **constructeur** qui reçoit `nom` et `email` ;
   - les **getters** `getNom()` et `getEmail()` ;
   - un `toString()` qui renvoie quelque chose comme `Auteur{nom='...'}`.
2. Dans `Demo.main`, **crée un objet `Auteur`** et affiche-le avec `System.out.println(...)`.

---

## 6. Exposer les objets en JSON

On va maintenant **renvoyer nos objets `Article` sur une URL**. Spring va les transformer automatiquement en **JSON** (le format standard d'échange de données entre un back-end et un front-end).

Crée le fichier **`controller/ArticleController.java`** :

```java
package fr.ada.java_blog.controller;

import fr.ada.java_blog.model.Article;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class ArticleController {

    @GetMapping("/articles")
    public List<Article> lister() {
        Article a1 = new Article("Mon premier article", "Bonjour le blog !");
        Article a2 = new Article("La machine de Turing", "Un texte sur le calcul.");
        a1.publier();

        return List.of(a1, a2);
    }
}
```

**Explication ligne par ligne :**

- `package fr.ada.java_blog.controller;` → cette classe est dans le package `controller`.
- `import fr.ada.java_blog.model.Article;` → importe **notre** classe `Article` (qui est dans un autre package, `model`). Sans cet import, `Article` serait inconnu ici.
- `import org.springframework.web.bind.annotation.GetMapping;` → importe `@GetMapping`.
- `import org.springframework.web.bind.annotation.RestController;` → importe `@RestController`.
- `import java.util.List;` → importe **`List`**, l'outil du langage Java pour gérer une **liste** d'éléments.
- `@RestController` → cette classe répond à des requêtes web.
- `public class ArticleController {` → déclare la classe.
- `@GetMapping("/articles")` → associe la méthode à l'URL **`/articles`**.
- `public List<Article> lister() {` → déclare la méthode `lister`. Elle renvoie une **`List<Article>`**, c'est-à-dire une **liste d'objets `Article`**. Les chevrons `<Article>` précisent ce que contient la liste.
- `Article a1 = new Article("Mon premier article", "Bonjour le blog !");` → crée un premier article.
- `Article a2 = new Article("La machine de Turing", "Un texte sur le calcul.");` → crée un deuxième article.
- `a1.publier();` → publie le premier.
- `return List.of(a1, a2);` → crée une liste contenant `a1` et `a2`, et la renvoie. `List.of(...)` est une façon rapide de fabriquer une liste. Spring se charge ensuite de la convertir en JSON.
- `}` → ferme la méthode.
- `}` → ferme la classe.

Sauvegarde, puis ouvre **http://localhost:8080/articles**. Tu obtiens :

```json
[
  {"titre":"Mon premier article","contenu":"Bonjour le blog !","publie":true},
  {"titre":"La machine de Turing","contenu":"Un texte sur le calcul.","publie":false}
]
```

> ❓ **D'où viennent les noms `titre`, `contenu`, `publie` ?**
> De **tes getters** (`getTitre`, `getContenu`, `isPublie`). C'est pour ça que les getters sont indispensables : sans eux, le JSON serait vide. Ici, les données sont écrites « en dur » dans le code.

> ✅ **Vérifie :** `/articles` t'affiche bien un tableau JSON avec deux articles, dont le premier est `"publie":true`.

### 🏋️ Exercice

1. Ajoute un **3ᵉ article** à la liste renvoyée par `/articles`.
2. Fais en sorte qu'il soit **publié** lui aussi.
3. **Bonus :** crée un endpoint `/articles/count` qui renvoie le **nombre** d'articles (type `int`). *(Solution plus propre après la section 7 — voir corrigé.)*

---

## 7. Exercice guidé : cibler **un seul** élément

Jusqu'ici, `/articles` renvoie **toute** la liste. On veut maintenant une URL qui renvoie **un seul** article, choisi par son **numéro** dans l'URL — par exemple `/articles/0` pour le premier. Puis tu referas la même chose pour les **auteurs**.

> 🎯 **Objectif :** apprendre à **récupérer une information depuis l'URL** et à **cibler** un élément précis.

### Partie A — Cibler un article

**Consigne :** crée un endpoint **`/articles/{numero}`** qui renvoie **un seul** article : celui qui se trouve à la position `numero` dans la liste.
Exemples : `/articles/0` → le premier article ; `/articles/1` → le deuxième.

**Pistes de travail :**
- Pour récupérer le `numero` écrit dans l'URL, tu auras besoin d'une nouvelle annotation : cherche **`@PathVariable`** (et n'oublie pas de l'**importer**).
- Pour pouvoir cibler un élément, il te faut une **liste stable**, partagée par tes méthodes. Transforme la liste que tu crées aujourd'hui dans `lister()` en **attribut** de la classe (déclaré une seule fois, en haut du contrôleur).
- Une `List` se lit par position avec la méthode **`.get(position)`**.
- ⚠️ **Piège classique :** en Java, **les listes commencent à 0**. Le 1er élément est à la position `0`, le 2ᵉ à la position `1`, etc.

### Partie B — Refaire la même chose avec les auteurs

> **Pré-requis :** tu dois avoir la classe `Auteur` (exercice 5.3). Si tu ne l'as pas encore créée, fais-le d'abord.

**Consigne :** crée un **`AuteurController`** avec **deux** endpoints :
- **`/auteurs`** → renvoie la liste de **tous** les auteurs (en JSON) ;
- **`/auteurs/{numero}`** → renvoie **un seul** auteur, ciblé par sa position.

**Pistes de travail :**
- Inspire-toi **exactement** de ce que tu viens de faire pour les articles : c'est la **même logique**, avec `Auteur` à la place d'`Article`.
- Crée une petite liste d'auteurs « en dur » (2 ou 3) comme **attribut** du contrôleur.
- Vérifie dans le navigateur : d'abord `/auteurs`, puis `/auteurs/0`.

> 👉 **Le corrigé complet et expliqué** est dans **`partie-01-02-corriges-exercices.md`**.
> **Essaie d'abord seul** — c'est en cherchant et en te trompant qu'on apprend. Ne regarde le corrigé qu'**après** avoir tenté.

---

## 8. Enregistrer l'étape dans Git

Tu as terminé le code de cette étape. Il faut **figer** ce travail sur la branche `partie-01` — et **rien d'autre** (pas de PostgreSQL, pas de code des étapes suivantes).

Dans le terminal, à la racine du projet :

```bash
git status
git add .
git commit -m "01 — API en mémoire : Article, /ping, /articles"
```

**Explication :**

- `git status` → liste les fichiers **modifiés ou nouveaux** depuis le dernier commit (tes controllers, ta classe `Article`, etc.).
- `git add .` → prépare tous ces changements pour l'enregistrement.
- `git commit -m "..."` → crée l'**instantané** de l'étape 01 sur la branche active.

Vérifie :

```bash
git log --oneline
```

Tu dois voir **deux commits** sur cette branche, par exemple :

```
a1b2c3d 01 — API en mémoire : Article, /ping, /articles
d4e5f6g Projet Spring Boot généré (Initializr)
```

> 💡 **`main` vs cette branche :** si tu fais `git checkout main`, tu retrouves le projet **sans** ton code (`Article`, `/ping`…). Si tu fais `git checkout partie-01`, tu retrouves **exactement** ce que tu viens de valider.

> ✅ **Vérifie :** `git branch` affiche toujours `* partie-01` et `git log --oneline` montre bien les deux commits.

---

## 🆘 En cas de problème

| Ce que tu vois | Pourquoi | Quoi faire |
|---|---|---|
| `javac` introuvable | Tu as un JRE, pas un JDK | Préviens le formateur (installation du JDK 21) |
| Des soulignements rouges partout | L'import Maven n'est pas fini, ou le mauvais JDK est utilisé | Attends la fin de l'import. Sinon : `Ctrl/Cmd+Shift+P` → *Java: Clean Java Language Server Workspace* → Restart |
| « Run » lance la mauvaise classe | Il y a deux `main` (`Demo` et `JavaBlogApplication`) | Clique le **Run situé au-dessus du `main` que tu veux** |
| `/articles` renvoie des champs vides | Il manque des getters dans `Article` | Vérifie que `getTitre()`, `getContenu()`, `isPublie()` existent |
| `Port 8080 was already in use` | Une application tourne déjà | Fais `Ctrl + C` sur l'ancienne, ou ajoute `server.port=8081` dans `application.properties` ou `application.yaml` (dans `src/main/resources/`) |
| `git` introuvable | Git n'est pas installé | Préviens le formateur |
| `fatal: not a git repository` | Tu n'es pas à la racine du projet | Place-toi dans le dossier qui contient `pom.xml`, puis relance la commande |

---

## ✅ Récapitulatif

Tu sais maintenant :

- [ ] Créer et lancer un projet Spring Boot
- [ ] Écrire une **classe** (attributs, constructeur, getters, méthode)
- [ ] **Créer des objets** avec `new` et comprendre qu'ils sont indépendants
- [ ] **Appeler une méthode** qui modifie un objet
- [ ] Lancer un `main` Java pur et lire la console
- [ ] Exposer une **liste d'objets en JSON** sur une URL
- [ ] Créer la branche `partie-01` et **committer** l'étape

---
