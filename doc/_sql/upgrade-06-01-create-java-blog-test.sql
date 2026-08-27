-- =========================================================
-- UPGRADE partie 06 — Base PostgreSQL dédiée aux tests JUnit
-- Prérequis : PostgreSQL lancé
-- Document  : doc/partie-06-02-tests-backend.md
-- =========================================================
--
-- ⚠️ Exécuter connecté à la base "postgres" (ou template1), PAS java_blog.
-- pgAdmin : Query Tool sur la base postgres (pas java_blog)
--
-- Si la base existe déjà : erreur "already exists" → normal, ignore.
-- Les tests recréent le schéma via src/test/resources/schema-test.sql

CREATE DATABASE java_blog_test;

-- Vérification (optionnelle, sur postgres) :
-- SELECT datname FROM pg_database WHERE datname IN ('java_blog', 'java_blog_test');
