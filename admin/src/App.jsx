import { useState, useEffect } from "react";
import PageHeader from "./components/PageHeader.jsx";
import ArticleList from "./components/ArticleList.jsx";
import LoadingMessage from "./components/LoadingMessage.jsx";
import { fetchRecentArticles } from "./api/articles.js";
// import { fetchPublishedArticles } from "./api/articles.js";
import "./App.css";

/**
 * App - racine du back-office.
 * Rôle : charger les articles (API), gérer loading/erreur, âsser des props aux enfants.
 */

function App() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadArticles() {
      try {
        setIsLoading(true);
        setError(null);

        // tester affichage du message de chargement
        // await new Promise((resolve) => setTimeout(resolve, 10000));

        const data = await fetchRecentArticles();
        // const data = await fetchPublishedArticles();
        setArticles(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Impossible de joindre l'API.");
      } finally {
        setIsLoading(false);
      }
    }
    loadArticles();
  }, []);

  // callbacks - étape 05-06 : ouvrir formulaire ou appeler DELETE
  function handleEdit(id) {
    console.log("modifier l'article id =", id);
  }

  function handleDelete(id) {
    console.log("supprimer l'article id =", id);
  }
  return (
    <div className="app">
      <PageHeader title="Back-office - Blog Java" />
      <main>
        {isLoading && <LoadingMessage />}
        {error && <p className="error-message">{error}</p>}
        {!isLoading && !error && (
          <ArticleList
            articles={articles}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
}

export default App;
