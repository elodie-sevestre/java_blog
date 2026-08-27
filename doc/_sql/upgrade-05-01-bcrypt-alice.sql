-- =========================================================
-- UPGRADE partie 05 — Mot de passe BCrypt pour Alice
-- Prérequis : blog.sql déjà exécuté sur java_blog
-- Document  : doc/partie-05-02-login-api-jwt.md
-- =========================================================
--
-- Compte démo après upgrade :
--   mail : alice@example.com
--   mdp  : demo1234  (en clair — usage formation uniquement)
--
-- Hash = BCrypt cost 10 de "demo1234" (compatible Spring BCryptPasswordEncoder)

UPDATE "users"
SET "mdp" = '$2y$10$dogkYyhsfVKlpjKpyhRUkecSPVCJA3D5yUSvj4L050OGVolNJUuG6'
WHERE "mail" = 'alice@example.com';

-- Vérification (optionnelle) :
-- SELECT "mail", LEFT("mdp", 7) AS hash_prefix FROM "users" WHERE "mail" = 'alice@example.com';
-- Attendu : hash_prefix = $2y$10$
