/**
 * articles.js — appels HTTP vers l'API Spring Boot.
 */

import { getAuthHeaders } from "./auth.js";

export const API_URL = "http://localhost:8080";

/** En-têtes JSON + Authorization pour /admin */
function adminJsonHeaders() {
  return {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
}

/**
 * Récupère les 5 articles les plus récents (GET public).
 */
export async function fetchRecentArticles() {
  const response = await fetch(`${API_URL}/articles/recents`);

  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status}`);
  }

  return response.json();
}

export async function createArticle(payload) {
  const response = await fetch(`${API_URL}/admin/articles`, {
    method: "POST",
    headers: adminJsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new Error("Session expirée — reconnecte-toi.");
  }
  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status} lors de la création`);
  }

  return response.json();
}

export async function updateArticle(id, payload) {
  const response = await fetch(`${API_URL}/admin/articles/${id}`, {
    method: "PUT",
    headers: adminJsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new Error("Session expirée — reconnecte-toi.");
  }
  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status} lors de la modification`);
  }

  return response.json();
}

export async function deleteArticle(id) {
  const response = await fetch(`${API_URL}/admin/articles/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (response.status === 401) {
    throw new Error("Session expirée — reconnecte-toi.");
  }
  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status} lors de la suppression`);
  }
}
