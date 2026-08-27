# Partie 06 — Étape 01
# Cadrage DevOps : qualité, automatisation et pipeline

> 📘 **Lis ce doc en premier.** Pas de code ici : on pose le **vocabulaire DevOps** et le **plan** de la partie 06.  
> 🗣️ **On vulgarise :** DevOps = faire en sorte que le projet se **teste tout seul** à chaque push, comme une **chaîne de montage** qui vérifie chaque pièce avant livraison.  
> 📋 **Ordre de tous les supports :** `INDEX.md`  
> ⚙️ **Prérequis :** partie 05 terminée (auth JWT + React admin, branche `partie-05` commitée).

## Objectif de cette étape

Comprendre **pourquoi** on industrialise le projet avant le TP libre (partie 07) :

- différence **test manuel** / **test automatisé** / **CI** ;
- la **pyramide des tests** appliquée au blog ;
- ce que la **pipeline GitHub Actions** va exécuter ;
- branche Git **`partie-06`**.

---

## Todo

- [ ] Comprendre CI vs CD (niveau cours)
- [ ] Retenir les **5 étapes** de la partie 06
- [ ] Créer la branche Git `partie-06` depuis `partie-05`
- [ ] Passer à `partie-06-02-tests-backend.md`

---

> **Encadré continuité**  
> **Parties 01–05** : tu as codé une API Spring + un admin React + l'auth.  
> **Partie 06** : tu ajoutes une **ceinture de sécurité automatique** — plus personne ne merge du code cassé sans le savoir.  
> **Partie 07** : TP libre sur les routes restantes — tu t'appuieras sur la CI pour valider ton travail.

---

## Parcours de la partie 06 — DevOps

| Doc | Tu fais… |
|---|---|
| **partie-06-01** *(ici)* | Cadrage DevOps + branche Git |
| [partie-06-02-tests-backend.md](partie-06-02-tests-backend.md) | Tests unitaires + `@JdbcTest` PostgreSQL (`java_blog_test`) |
| [partie-06-03-tests-api-mockmvc.md](partie-06-03-tests-api-mockmvc.md) | Tests HTTP (`MockMvc`) + auth JWT |
| [partie-06-04-pipeline-github-actions.md](partie-06-04-pipeline-github-actions.md) | CI : Maven + build React sur chaque push |
| [partie-06-05-recap-devops.md](partie-06-05-recap-devops.md) | Makefile + README + doc API + récap |

Chaque support : **objectif**, **pourquoi**, **code commenté**, **todo**, **commit Git**.

---

## 1. DevOps — en une phrase

**DevOps** = rapprocher **développement** (Dev) et **exploitation** (Ops) pour livrer plus **souvent** et plus **fiablement**.

Pour ce cours, on se concentre sur :

| Pratique | Ce qu'on met en place |
|---|---|
| **Tests automatisés** | JUnit + MockMvc + (optionnel) Vitest |
| **CI** (Continuous Integration) | GitHub Actions à chaque push |
| **Documentation** | `README.md` + `doc/API.md` — le projet se **lit** sans oral du formateur |
| **Qualité** | Pipeline **verte** = OK pour merger |

> 💡 On ne déploie pas en production ici — pas de CD complet — mais la **CI** est la base du DevOps moderne.  
> 📌 **Docker** = cours séparé — **hors scope** partie 06. PostgreSQL reste celui installé en **partie 02**.

---

## 2. Pourquoi maintenant ?

Sans CI, scénario classique :

```
Élève A casse le login JWT
        │
        ▼
Personne ne lance ./mvnw test avant le merge
        │
        ▼
Élève B perd 2 h sur une erreur qui n'est pas la sienne
```

Avec CI :

```
git push
    │
    ▼
GitHub Actions lance ./mvnw test + npm run build
    │
    ├── ✅ vert → confiance
    └── ❌ rouge → corriger avant de continuer
```

---

## 3. Pyramide des tests — appliquée au blog

```
        ┌─────────────┐
        │  E2E (hors │  ← Partie 07 / manuel navigateur
        │   scope)  │
        ├─────────────┤
        │ MockMvc   │  ← 06-03 : GET /articles, POST /admin + JWT
        │ (API HTTP)│
        ├─────────────┤
        │ @JdbcTest │  ← 06-02 : ArticleRepository + PostgreSQL (java_blog_test)
        │ intégration│
        ├─────────────┤
        │ Unitaires │  ← 06-02 : ArticleMapper, JwtService
        └─────────────┘
        (base large, rapides)
```

| Niveau | Exemple | Vitesse | Dépend de |
|---|---|---|---|
| **Unitaire** | `ArticleMapperTest` | ⚡ ms | Rien (pas de Spring) |
| **Intégration JDBC** | `ArticleRepositoryTest` | ⚡⚡ | PostgreSQL `java_blog_test` |
| **Intégration HTTP** | `ArticleControllerMockMvcTest` | ⚡⚡⚡ | Contexte Spring + MockMvc |
| **Manuel / E2E** | curl, navigateur | Lent | PostgreSQL + 2 terminaux |

> 💡 **Règle d'or :** beaucoup de tests **rapides** en bas ; peu de tests **lents** en haut.

---

## 4. Stratégie BDD pour les tests

| Environnement | Base | Usage |
|---|---|---|
| **Dev local** | PostgreSQL **`java_blog`** (pgAdmin, **partie 02**) | Développement quotidien |
| **Tests JUnit** | PostgreSQL **`java_blog_test`** | `./mvnw test` — même moteur qu'en prod |
| **CI GitHub** | PostgreSQL **service** (conteneur éphémère) | Pipeline — pas H2 |

**Pourquoi PostgreSQL partout (pas H2) ?**

- Un seul moteur SQL à apprendre et déboguer.
- `RETURNING id`, `"update"`, types PG — **identiques** dev / test / CI.
- Pas de surprise « ça marche en H2, pas en prod ».

> ⚠️ **Prérequis tests locaux :** PostgreSQL **lancé** + base **`java_blog_test`** ([upgrade-06-01](sql/upgrade-06-01-create-java-blog-test.sql), voir 06-02).

---

## 5. Ce que la pipeline va faire (aperçu)

```
┌──────────────────────────────────────────────────────────┐
│  GitHub Actions — workflow ci.yml                        │
├──────────────────────────────────────────────────────────┤
│  Job 1 : backend-test                                    │
│    checkout → Java 21 → ./mvnw -B test                   │
├──────────────────────────────────────────────────────────┤
│  Job 2 : frontend-build                                  │
│    checkout → Node 20 → npm ci → npm run build           │
└──────────────────────────────────────────────────────────┘
         │                              │
         └── les deux verts = CI OK ────┘
```

**Déclencheurs prévus :**

- `push` sur `main` et branches `partie-*`
- `pull_request` vers `main`

---

## 6. Fichiers créés dans la partie 06

### Backend (tests)

```
src/test/
├── java/fr/ada/java_blog/
│   ├── mapper/ArticleMapperTest.java
│   ├── service/JwtServiceTest.java
│   ├── repository/ArticleRepositoryTest.java
│   ├── controller/ArticleControllerMockMvcTest.java
│   └── controller/AdminArticleSecurityMockMvcTest.java
└── resources/
    ├── application-test.yaml
    ├── schema-test.sql
    └── data-test.sql
```

### DevOps (racine + doc)

```
.github/workflows/ci.yml
Makefile
README.md                   ← porte d'entrée du dépôt (06-05)
doc/API.md                    ← routes HTTP implémentées (06-05)
doc/INDEX.md                  ← parcours pédagogique (déjà existant)
```

### Frontend (optionnel)

```
admin/src/api/auth.test.js   ← test Vitest léger (06-04)
```

---

## 7. Ce qu'on ne fait PAS (partie 06)

| Sujet | Pourquoi pas |
|---|---|
| **Docker** / Compose | **Cours dédié** — pas dans ce fil rouge |
| Déploiement cloud (Heroku, AWS…) | Hors temps cours — la CI suffit |
| Testcontainers | Bonus — cours Docker ; CI utilise le **service PostgreSQL** GitHub |
| SonarQube / couverture 80 % | Mention possible, pas imposé |
| Selenium / Playwright E2E | Partie 07 ou bonus |
| Secrets JWT en CI | Tests utilisent `application-test.yaml` |

---

## 8. Commits Git attendus (`partie-06`)

| Commit | Contenu |
|---|---|
| `06-02` | Tests unitaires + PostgreSQL `java_blog_test` + repository |
| `06-03` | MockMvc public + admin sécurisé |
| `06-04` | GitHub Actions + (optionnel) test Vitest |
| `06-05` | Makefile + README + `doc/API.md` + récap |

---

## Créer la branche Git `partie-06`

```bash
git checkout partie-05
git checkout -b partie-06
git branch
```

> 💡 **Pas de commit ici** — le premier commit viendra avec les tests (06-02).

> ✅ **Vérifie :** `./mvnw test` passe encore (test Initializr vide ou context load).

---

## Suite

👉 **[partie-06-02-tests-backend.md](partie-06-02-tests-backend.md)** — premiers tests JUnit + base **`java_blog_test`** PostgreSQL.
