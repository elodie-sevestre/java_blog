# Partie 01 — Corrigés des exercices

> 📘 **À lire après avoir essayé.** Ce document donne les solutions **expliquées** des exercices du support **`partie-01-01-installation-spring-boot.md`**. Si tu n'as pas encore cherché par toi-même, retourne d'abord au support et tente — c'est là que se fait l'apprentissage.

> 💡 **Évolution des URLs :** à cette étape, `/articles/{numero}` cible un article par **position** (0, 1, 2…). Plus tard, on utilisera l'**id** en base (plus stable).

---

## Corrigé 5.3 — La classe `Auteur`

> *(Rappel : nécessaire pour l'exercice 7, Partie B.)*

Fichier **`model/Auteur.java`** :

```java
package fr.ada.java_blog.model;

public class Auteur {

    private String nom;
    private String email;

    public Auteur(String nom, String email) {
        this.nom = nom;
        this.email = email;
    }

    public String getNom() {
        return nom;
    }

    public String getEmail() {
        return email;
    }

    @Override
    public String toString() {
        return "Auteur{nom='" + nom + "'}";
    }
}
```

C'est la **même structure** que la classe `Article` : des attributs `private`, un constructeur qui les initialise, des getters pour les lire, et un `toString()` pour l'affichage. Rien de nouveau ici : c'est de la répétition, et c'est normal — on consolide.

### Suite — afficher un `Auteur` dans `Demo.main`

Dans **`model/Demo.java`**, ajoute ces lignes **à la fin** de la méthode `main` (avant le `}` qui la ferme) :

```java
        Auteur auteur = new Auteur("Ada Lovelace", "ada@blog.fr");
        System.out.println(auteur);
```

**Version complète de `Demo.main` après l'exercice :**

```java
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

        Auteur auteur = new Auteur("Ada Lovelace", "ada@blog.fr");
        System.out.println(auteur);
    }
```

**Explication :**

- `Auteur auteur = new Auteur(...)` → même mécanique que pour `Article` : `new` fabrique l'objet, la variable le retient.
- `System.out.println(auteur)` → affiche le résultat de `toString()` de `Auteur`, par ex. `Auteur{nom='Ada Lovelace'}`.

**Résultat attendu en console (extrait) :**

```
Auteur{nom='Ada Lovelace'}
```

---

## Corrigé 6 — Troisième article publié

> *(Exercice de la section 6, points 1 et 2 — **avant** la refonte de la section 7.)*

Dans **`controller/ArticleController.java`**, modifie la méthode `lister()` :

```java
    @GetMapping("/articles")
    public List<Article> lister() {
        Article a1 = new Article("Mon premier article", "Bonjour le blog !");
        Article a2 = new Article("La machine de Turing", "Un texte sur le calcul.");
        Article a3 = new Article("Le Java expliqué aux débutants", "Un guide pour commencer.");
        a1.publier();
        a3.publier();

        return List.of(a1, a2, a3);
    }
```

**Explication :**

- `Article a3 = new Article(...)` → un **3ᵉ objet** indépendant des deux premiers.
- `a3.publier()` → le 3ᵉ article est **publié** (`publie=true`), comme demandé.
- `return List.of(a1, a2, a3)` → la liste renvoyée en JSON contient **3** éléments.

**Résultat attendu sur** `http://localhost:8080/articles` :

```json
[
  {"titre":"Mon premier article","contenu":"Bonjour le blog !","publie":true},
  {"titre":"La machine de Turing","contenu":"Un texte sur le calcul.","publie":false},
  {"titre":"Le Java expliqué aux débutants","contenu":"Un guide pour commencer.","publie":true}
]
```

### Bonus section 6 — `/articles/count` *(avant la section 7)*

À ce stade, la liste est encore **dans** `lister()` — pas encore en attribut. Deux approches valides :

**Approche simple** (si tu as bien 3 articles) :

```java
    @GetMapping("/articles/count")
    public int compter() {
        return 3;
    }
```

**Approche plus propre** (sans « magique » le chiffre 3) :

```java
    @GetMapping("/articles/count")
    public int compter() {
        Article a1 = new Article("Mon premier article", "Bonjour le blog !");
        Article a2 = new Article("La machine de Turing", "Un texte sur le calcul.");
        Article a3 = new Article("Le Java expliqué aux débutants", "Un guide pour commencer.");
        return List.of(a1, a2, a3).size();
    }
```

> 💡 **Limite :** on **duplique** la création des articles. C'est acceptable pour l'exercice ; la section 7 corrige ça en rangeant la liste dans un **attribut** partagé.

---

## Corrigé 7, Partie A — Cibler un article

L'idée clé : pour pouvoir **cibler** un article par sa position, il faut que la liste **existe une fois pour toutes** et soit partagée par les méthodes du contrôleur. On la sort donc de la méthode `lister()` pour en faire un **attribut** de la classe.

Fichier **`controller/ArticleController.java`** (version complète mise à jour) :

```java
package fr.ada.java_blog.controller;

import fr.ada.java_blog.model.Article;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class ArticleController {

    private List<Article> articles = creerArticles();

    private List<Article> creerArticles() {
        Article a1 = new Article("Mon premier article", "Bonjour le blog !");
        Article a2 = new Article("La machine de Turing", "Un texte sur le calcul.");
        Article a3 = new Article("Le Java expliqué aux débutants", "Un guide pour commencer.");
        a1.publier();
        a3.publier();
        return List.of(a1, a2, a3);
    }

    @GetMapping("/articles")
    public List<Article> lister() {
        return articles;
    }

    @GetMapping("/articles/{numero}")
    public Article unArticle(@PathVariable int numero) {
        return articles.get(numero);
    }
}
```

**Ce qui est nouveau, expliqué :**

- `import org.springframework.web.bind.annotation.PathVariable;` → on importe la nouvelle annotation **`@PathVariable`**.
- `private List<Article> articles = creerArticles();` → on déclare un **attribut** `articles` : la liste est désormais **rangée dans l'objet contrôleur**, créée une seule fois. Les deux endpoints peuvent l'utiliser.
- `private List<Article> creerArticles() { ... }` → une petite méthode **privée** qui fabrique la liste. `private` parce qu'elle ne sert qu'à l'intérieur de la classe (elle n'est pas un endpoint). C'est juste plus propre que d'écrire la création directement sur la ligne de l'attribut.
- `@GetMapping("/articles")` + `return articles;` → l'endpoint qui renvoie **toute** la liste utilise maintenant l'attribut.
- `@GetMapping("/articles/{numero}")` → le `{numero}` entre **accolades** dans l'URL est une **partie variable** : elle changera selon ce que tape l'utilisateur (`/articles/0`, `/articles/1`…).
- `public Article unArticle(@PathVariable int numero) {` → la méthode renvoie **un seul** `Article`. L'annotation **`@PathVariable int numero`** dit à Spring : « prends la valeur écrite à la place de `{numero}` dans l'URL et range-la dans le paramètre `numero` ». Spring la convertit automatiquement en `int`.
- `return articles.get(numero);` → renvoie l'élément de la liste situé à la position `numero`. La méthode **`.get(...)`** d'une `List` lit un élément par sa position.

**À tester :**
- `http://localhost:8080/articles/0` → le 1er article
- `http://localhost:8080/articles/1` → le 2ᵉ article
- `http://localhost:8080/articles/2` → le 3ᵉ article

> ⚠️ **Limite connue (normale pour l'instant) :** si tu demandes un numéro qui n'existe pas (ex. `/articles/9`), tu obtiendras une **erreur**. C'est attendu : on apprendra à **gérer proprement ces erreurs** plus tard dans la formation.

> 💡 **Pourquoi commence-t-on à 0 ?** En Java (comme dans la plupart des langages), le **premier** élément d'une liste est à la position **0**. C'est une convention à intégrer : `/articles/0` = premier, `/articles/1` = deuxième.

---

## Corrigé 7, Partie B — La même chose avec les auteurs

C'est **exactement** la même logique, en remplaçant `Article` par `Auteur`.

Fichier **`controller/AuteurController.java`** :

```java
package fr.ada.java_blog.controller;

import fr.ada.java_blog.model.Auteur;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class AuteurController {

    private List<Auteur> auteurs = List.of(
        new Auteur("Ada Lovelace", "ada@blog.fr"),
        new Auteur("Alan Turing", "alan@blog.fr")
    );

    @GetMapping("/auteurs")
    public List<Auteur> lister() {
        return auteurs;
    }

    @GetMapping("/auteurs/{numero}")
    public Auteur unAuteur(@PathVariable int numero) {
        return auteurs.get(numero);
    }
}
```

**Explication des points à noter :**

- `import fr.ada.java_blog.model.Auteur;` → on importe **notre** classe `Auteur` (elle est dans le package `model`).
- `private List<Auteur> auteurs = List.of(...);` → un **attribut** contenant la liste des auteurs, créée directement avec `List.of(...)`. Ici on n'a pas fait de méthode séparée : on passe les `new Auteur(...)` directement dans `List.of(...)`. Les **deux façons sont correctes** (comparée à `ArticleController`).
- `new Auteur("Ada Lovelace", "ada@blog.fr")` → crée un objet `Auteur` via son constructeur.
- `@GetMapping("/auteurs")` + `return auteurs;` → renvoie toute la liste des auteurs en JSON.
- `@GetMapping("/auteurs/{numero}")` + `@PathVariable int numero` + `return auteurs.get(numero);` → renvoie un seul auteur, ciblé par sa position (même mécanique que pour les articles).

**À tester :**
- `http://localhost:8080/auteurs` → la liste, par exemple :

```json
[
  {"nom":"Ada Lovelace","email":"ada@blog.fr"},
  {"nom":"Alan Turing","email":"alan@blog.fr"}
]
```

- `http://localhost:8080/auteurs/0` → seulement Ada Lovelace.

> 💡 **Le vrai enseignement de cet exercice :** une fois que tu sais faire pour `Article`, tu sais faire pour **n'importe quelle** classe. C'est le même schéma qui se répète : une liste en attribut, un endpoint pour tout lister, un endpoint avec `@PathVariable` pour cibler un élément.

---

## Bonus — `/articles/count` *(version finale, après section 7)*

Une fois la liste en **attribut** (`private List<Article> articles = ...`), le bonus devient plus propre :

```java
    @GetMapping("/articles/count")
    public int compter() {
        return articles.size();
    }
```

- `@GetMapping("/articles/count")` → l'URL `/articles/count`.
- `public int compter() {` → la méthode renvoie un **entier** (`int`).
- `return articles.size();` → la méthode **`.size()`** d'une `List` renvoie le **nombre d'éléments** qu'elle contient (ici **3** si tu as suivi le corrigé 6).

> ⚠️ **Ordre des URL :** la route `/articles/count` utilise un segment **fixe** (`count`). Spring lui donne **priorité** sur `/articles/{numero}` où `{numero}` est un segment **variable** — ce n'est pas une question de « mot vs nombre », mais de chemin littéral vs chemin paramétré.

---

> ✅ **Récapitulatif des notions vues dans ces corrigés :**
> - créer une classe `Auteur` et l'afficher dans un `main` ;
> - ajouter un élément à une `List` et le publier ;
> - transformer une liste locale en **attribut** partagé de la classe ;
> - l'annotation **`@PathVariable`** pour lire une valeur dans l'URL ;
> - les méthodes **`.get(position)`** et **`.size()`** d'une `List` ;
> - la convention : **les positions commencent à 0**.
