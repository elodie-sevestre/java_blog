# Annexe 01 — Glossaire des termes techniques

> 📘 **Comment l'utiliser :** garde ce document ouvert à côté du cours. Chaque fois qu'un mot technique apparaît, retrouve-le ici. Les exemples sont tirés de **notre projet de blog**.

---

## 1. Les outils et l'environnement

**JDK** *(Java Development Kit)* — La boîte à outils complète pour développer en Java : de quoi **écrire**, **compiler** et **exécuter** du code. Elle contient `javac` (le compilateur) et `java` (l'exécuteur).

**JRE** *(Java Runtime Environment)* — Une version réduite qui permet seulement d'**exécuter** un programme Java déjà compilé, pas de le compiler. Pour développer, il faut le **JDK**, pas seulement le JRE.

**Compiler / compilation** — Traduire le code que tu écris (lisible par un humain) en un format compréhensible par la machine. C'est `javac` qui s'en charge.

**IDE** *(Integrated Development Environment)* — Un logiciel qui regroupe tout ce qu'il faut pour développer : éditeur de code, exécution, aide à l'écriture, débogage. Ici, c'est **VS Code**.

**Extension** *(VS Code)* — Un module qu'on ajoute à VS Code pour lui donner de nouvelles capacités. Ex : l'*Extension Pack for Java* apprend à VS Code à comprendre le Java.

**Runtime** — L'environnement d'exécution. « Configurer le runtime Java » = dire à VS Code **quelle version de Java** utiliser (chez nous : Java 21).

**Maven** — L'outil qui **gère le projet** : il télécharge les dépendances et compile le code. Sa configuration est dans le fichier `pom.xml`.

**`pom.xml`** — Le fichier de configuration de Maven. Il liste les **dépendances** et les informations du projet.

**Dépendance** — Un morceau de code **écrit par d'autres** que ton projet réutilise. Ex : *Spring Web*. Tu ne le réécris pas : Maven le télécharge pour toi. Ton projet « dépend » de lui pour fonctionner.

**Bibliothèque** *(ou « librairie »)* — Un ensemble de code déjà écrit, prêt à être réutilisé. Une dépendance est généralement une bibliothèque.

**Framework** *(cadre de travail)* — Un ensemble d'outils et de règles qui **structurent** ton application et t'évitent de tout réécrire toi-même. **Spring Boot** est un framework.

**Spring Boot** — Le framework qu'on utilise. Il simplifie énormément la création d'applications Java : il démarre un serveur web, relie les morceaux de l'appli entre eux, etc.

**DevTools** — Une dépendance Spring qui **redémarre l'application automatiquement** dès que tu modifies et sauvegardes ton code.

---

## 2. La structure du code Java

**Package** — Un « dossier logique » qui **range** les classes. Ex : `fr.ada.java_blog.model`. Il correspond à l'arborescence réelle des dossiers sur le disque.

**Import** — Une ligne en haut d'un fichier qui dit à Java : « je vais utiliser cette classe, voici où la trouver ». Sans l'import, la classe est **inconnue** dans le fichier.

**Annotation** — Un mot précédé d'un `@` qu'on **pose sur une classe ou une méthode** pour lui donner un comportement spécial, souvent compris par Spring. Ce n'est pas du code qui s'exécute ligne par ligne : c'est une **étiquette** qui modifie le fonctionnement. Ex : `@RestController`, `@GetMapping`, `@Override`.

**Syntaxe — le point-virgule `;`** — Termine une **instruction** en Java. Presque chaque ligne d'action finit par `;`.

**Syntaxe — les accolades `{ }`** — Délimitent un **bloc** : le corps d'une classe, d'une méthode… Chaque `{` ouvert doit être refermé par un `}`.

---

## 3. Classes et objets *(le cœur de la POO)*

> **POO** = Programmation Orientée Objet : une façon de programmer en représentant les choses du monde réel par des **objets**.

**Classe** — Le **plan** (ou le **moule**) qui décrit un type de chose : ses données et ses actions. Ex : la classe `Article` décrit ce qu'est un article.

**Objet** — Un **exemplaire concret** fabriqué à partir d'une classe. Ex : *un* article précis. Avec une classe, on peut fabriquer autant d'objets qu'on veut.

**Instance** — Synonyme d'**objet**. Un objet est « une instance » d'une classe. Dire « instancier la classe `Article` » = « créer un objet `Article` ».

**Instancier** — **Créer un objet** à partir d'une classe, à l'aide du mot-clé `new`. Ex : `new Article("Titre", "Contenu")`.

**Attribut** — Une **donnée** que possède un objet (on dit aussi « champ » ou « propriété »). Ex : `titre`, `contenu`, `publie` dans `Article`.

**Méthode** — Une **action** définie dans une classe. Ex : `publier()`. Une méthode peut renvoyer une valeur ou non.

**Constructeur** — Une **méthode spéciale**, qui porte le **même nom que la classe**, et qui sert à **fabriquer** un objet en initialisant ses attributs. Appelé via `new`.

**Méthode métier** — Une méthode qui représente une **action propre au domaine** de l'application (au « métier »). Ex : `publier()` fait passer un article à l'état publié.

**Getter** — Une méthode qui sert à **lire** la valeur d'un attribut privé depuis l'extérieur. Ex : `getTitre()`. Pour un booléen, par convention, elle commence par `is` : `isPublie()`.

**Setter** — Une méthode qui sert à **modifier** la valeur d'un attribut privé. Ex : `setTitre("...")`. *(On n'en a pas encore écrit, mais le terme reviendra.)*

**Encapsulation** — Le principe qui consiste à **protéger les données** : on rend les attributs `private` et on n'y accède que par des méthodes (getters/setters). Ça évite que n'importe qui modifie les données n'importe comment.

**`this`** — À l'intérieur d'une classe, désigne **« l'objet courant »** (celui sur lequel on travaille). Sert surtout à distinguer un **attribut** d'un **paramètre** qui portent le même nom : `this.titre = titre`.

**`toString()`** — Une méthode qui définit **comment un objet s'affiche** sous forme de texte (quand on fait `System.out.println(objet)`).

---

## 4. Les briques du langage

**Variable** — Un **nom** qui désigne une valeur ou un objet en mémoire. Ex : `a1` désigne un objet `Article`.

**Type** — La **nature** d'une donnée. Indique ce qu'une variable a le droit de contenir.

**`String`** — Le type pour du **texte** (« chaîne de caractères »). Ex : `"Bonjour"`. Le texte s'écrit toujours entre guillemets `"`.

**`boolean`** — Le type qui ne peut valoir que **`true`** (vrai) ou **`false`** (faux). Ex : l'attribut `publie`.

**`int`** — Le type pour un **nombre entier** (sans virgule). Ex : un nombre d'articles.

**`void`** — Indique qu'une méthode **ne renvoie aucune valeur** : elle agit, mais ne « rend » rien. Ex : `publier()`.

**`return`** — **Renvoie** une valeur au code qui a appelé la méthode. Ex : `return "pong";`.

**`new`** — Le mot-clé qui **crée un nouvel objet** (il appelle le constructeur de la classe).

**Paramètre** — Une information attendue par une méthode, déclarée entre ses parenthèses. Ex : `titre` et `contenu` dans `public Article(String titre, String contenu)`.

**Argument** — La **valeur concrète** qu'on fournit quand on **appelle** la méthode. Ex : `new Article("Mon article", "...")` → `"Mon article"` est un argument. *(Paramètre = côté définition ; argument = côté appel.)*

**`public` / `private`** — Des **modificateurs de visibilité** : ils disent **qui peut accéder** à un élément.
- `public` → accessible de **partout**.
- `private` → accessible **uniquement à l'intérieur de la classe** (utilisé pour les attributs, via l'encapsulation).

**`static`** — Se rapporte à **la classe elle-même** plutôt qu'à un objet : on peut l'utiliser **sans créer d'instance**. C'est le cas de la méthode `main`.

**`main`** — La méthode **« point d'entrée »** : le **tout premier code exécuté** quand on lance un programme Java.

**Point d'entrée** — L'endroit où **démarre** l'exécution d'un programme. En Java, c'est la méthode `main`.

**Concaténation** — Le fait de **coller** des morceaux de texte (et des valeurs) bout à bout avec le `+`. Ex : `"Titre : " + a2.getTitre()`.

**Console / terminal** — La fenêtre **texte** où s'affichent les messages du programme et où l'on tape des commandes.

**`System.out.println(...)`** — L'instruction qui **affiche un texte dans la console**, suivi d'un saut de ligne (`println` = « print line », imprimer une ligne).

**Collection** — Un **regroupement** de plusieurs éléments. `List` en est un exemple.

**`List`** — Une **collection ordonnée** d'éléments. Ex : `List<Article>` = une liste d'objets `Article`.

**Chevrons `<>`** *(génériques)* — Précisent **le type des éléments** contenus dans une collection. `List<Article>` = une liste **d'`Article`** (et non de n'importe quoi).

---

## 5. Le web et les API

**Serveur web** — Un programme qui **attend des requêtes** (d'un navigateur, d'une autre appli…) et y **répond**. Spring Boot en démarre un automatiquement.

**Tomcat** — Le serveur web **intégré** que Spring Boot utilise par défaut. C'est lui qui apparaît dans les logs : *« Tomcat started on port 8080 »*.

**Port** — Un **« numéro de porte »** sur la machine. Notre appli écoute sur le port **8080**, d'où l'adresse `localhost:8080`.

**`localhost`** — Ta **propre machine** (adresse `127.0.0.1`). `localhost:8080` = « le serveur qui tourne **chez moi** sur le port 8080 ».

**URL** — L'**adresse** d'une ressource sur le web. Ex : `http://localhost:8080/articles`.

**Endpoint** — Un **point d'accès** de l'application : une **URL à laquelle elle sait répondre**. Ex : `/ping`, `/articles`.

**Requête (HTTP)** — Une **demande** envoyée au serveur. Le serveur renvoie une **réponse**.

**HTTP** — Le **protocole** (le « langage ») utilisé pour échanger entre un navigateur (ou un client) et un serveur web.

**GET** — Un **type de requête HTTP** signifiant « **donne-moi** cette ressource ». C'est ce qu'envoie un navigateur quand tu visites une page. D'où l'annotation `@GetMapping`.

**API** *(Interface de Programmation Applicative)* — L'ensemble des **URL (endpoints)** qui permettent à d'autres programmes d'**utiliser ton application** : récupérer ou envoyer des données.

**REST** — Un **style de conception** d'API web, basé sur les URL et les méthodes HTTP (GET, POST…). L'annotation `@RestController` sert à créer ce type d'API.

**JSON** — Un **format texte standard** pour échanger des données entre applications. Lisible par l'humain **et** la machine. Ex : `{"titre":"Mon article","publie":true}`.

**Sérialisation** — Le fait de **transformer un objet** (qui vit en mémoire) en un format transmissible, comme le **JSON**. Spring le fait **automatiquement** quand un endpoint renvoie un objet.

**Whitelabel Error Page** — La **page d'erreur par défaut** de Spring Boot, affichée quand on visite une URL pour laquelle aucune réponse n'est définie. La voir n'est pas un bug : c'est la preuve que le serveur répond.

---

## 6. À venir *(avant-goût)*

**Base de données** — Un logiciel spécialisé dans le **stockage** organisé des données. Chez nous : **PostgreSQL** (J2).

**JDBC** — L'API standard Java pour parler à une base. Au **J2**, on configure la connexion Spring Boot ↔ PostgreSQL.

**Table** — Dans une base, un **tableau** (lignes = enregistrements, colonnes = champs). La classe `Article` correspond à la table `articles`.

**`@Entity`** — Annotation posée **plus tard (partie 04)** sur une classe pour dire à Spring : « cette classe = une table en base ». À la **partie 03**, on utilise JDBC à la main pour **comprendre** les couches avant JPA.

---

## 7. Partie 03 — nouveaux mots *(à lire à la partie 03)*

**DTO** *(Data Transfer Object)* — Objet qui décrit la **forme du JSON** échangé avec le client — pas la table complète.

**Record** — Syntaxe Java courte pour un sac de données (`public record ArticleResponse(…)`). À la partie 03, les **DTO** sont des records ; le **model** `Article` reste une classe avec getters.

**Repository** — Classe qui contient **tout le SQL** — un seul endroit pour parler à PostgreSQL.

**Mapper** — Classe qui **convertit** le model en DTO avant d'envoyer le JSON.

**Optional** — Boîte qui contient une valeur… ou est vide. Le repository renvoie `Optional<Article>` ; le controller décide du 404.

---

> 💡 **À retenir :** un même concept porte parfois **plusieurs noms** (objet = instance ; attribut = champ = propriété ; bibliothèque = librairie). C'est normal, tu croiseras les deux dans la vraie vie professionnelle.
