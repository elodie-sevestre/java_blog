/**
 * article.js - appels HTTP vers l'API Srping Boot (partie 03).
 * Toutes les fonctions fetch du back-office passent par ici.
 */

// adresse de l'aPI Java - même machine, port 8080(pas 5173!)
export const API_URL = "http://localhost:8080";

/**
 * Récupère les 5 articles les plus récents (GET /articles/recents).
 * @returns {Promise<Array>} tableau d'objets { id, titre, contenu, publie, date}
 */

export async function fetchRecentArticles() {
  const response = await fetch(`${API_URL}/articles/recents`);

  // response.ok = true si status HTTP 200-299
  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status} sur /articles/recents`);
  }
  return response.json();
}

export async function fetchPublishedArticles() {
  const response = await fetch(`${API_URL}/articles`);
  if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);

  return response.json();
}
