/**
 * auth.js — login, logout, stockage du JWT (partie 05).
 */

import { API_URL } from "./articles.js";

const TOKEN_KEY = "java_blog_token";
const PSEUDO_KEY = "java_blog_pseudo";

/** @returns {string|null} */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** @returns {string|null} */
export function getPseudo() {
  return localStorage.getItem(PSEUDO_KEY);
}

export function isLoggedIn() {
  return getToken() != null && getToken().length > 0;
}

/**
 * En-têtes Authorization pour les routes /admin.
 * @returns {Record<string, string>}
 */
export function getAuthHeaders() {
  const token = getToken();
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}

/**
 * Connexion — POST /auth/login
 * @param {{ mail: string, mdp: string }} credentials
 * @returns {Promise<{ token: string, pseudo: string, userId: number }>}
 */
export async function login(credentials) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error("Identifiants invalides");
  }

  const data = await response.json();

  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(PSEUDO_KEY, data.pseudo);

  return data;
}

/** Déconnexion — efface le badge côté client (pas d'appel /auth/logout en v1). */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PSEUDO_KEY);
}
