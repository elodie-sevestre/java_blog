# Scripts SQL — Blog Java

> **`blog.sql`** = installation initiale (partie 02).  
> **`upgrade-*.sql`** = patchs à exécuter **quand tu atteins l'étape indiquée** — sans refaire toute la base.

## Ordre d'exécution

| Étape | Fichier | Quand | Base |
|---|---|---|---|
| 1 | [../blog.sql](../blog.sql) | Partie 02 — install PostgreSQL | **`java_blog`** |
| 2 | [upgrade-05-01-bcrypt-alice.sql](upgrade-05-01-bcrypt-alice.sql) | Partie 05 — **obligatoire** avant login admin / React auth | **`java_blog`** |
| 3 | [upgrade-06-01-create-java-blog-test.sql](upgrade-06-01-create-java-blog-test.sql) | Partie 06 — avant `./mvnw test` | **`postgres`** (pas `java_blog`) |

> 💡 Les upgrades sont **idempotents** quand c'est possible (`UPDATE … WHERE mail = …`, `CREATE DATABASE` avec vérif).

> ⚠️ **`upgrade-05-01`** : sans lui, `blog.sql` laisse `hash_placeholder_1` pour Alice → le login renvoie **401** (`Identifiants invalides`).

## Comment exécuter

**pgAdmin :** Query Tool sur la bonne base → ouvrir le fichier → Execute.

**psql :**

```bash
# Upgrade sur java_blog
psql -U postgres -d java_blog -f doc/sql/upgrade-05-01-bcrypt-alice.sql

# Création base de test (connecté à postgres)
psql -U postgres -d postgres -f doc/sql/upgrade-06-01-create-java-blog-test.sql
```

## Règle du projet

- On **ne modifie pas** `blog.sql` pour chaque nouvelle partie — on ajoute un **`upgrade-NN-…sql`** si la BDD dev doit évoluer.
- Les fichiers **`src/test/resources/schema-test.sql`** / **`data-test.sql`** suivent la doc partie 06 / 07-03 (schéma minimal de test, séparé de `java_blog`).

## Upgrades à venir

| Partie | Besoin | Fichier |
|---|---|---|
| 07 | Aucun — `blog.sql` contient déjà commentaires, catégories, médias | — |
