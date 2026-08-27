import { useCallback, useEffect, useState } from "react";
import PageHeader from "./components/PageHeader.jsx";
import ArticleList from "./components/ArticleList.jsx";
import ArticleForm from "./components/ArticleForm.jsx";
import LoadingMessage from "./components/LoadingMessage.jsx";
import {
  fetchRecentArticles,
  createArticle,
  updateArticle,
} from "./api/articles.js";
import "./App.css";

/**
 * App - racine du back-office.
 * Rôle : charger les articles (API), gérer loading/erreur, âsser des props aux enfants.
 */
function App() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // "list" | "create" | "edit"
  const [mode, setMode] = useState("list");
  const [editingArticle, setEditingArticle] = useState(null);

  const loadArticles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchRecentArticles();
      setArticles(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Impossible de joindre l'API.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  function showList() {
    setMode("list");
    setEditingArticle(null);
  }

  function showCreate() {
    setMode("create");
    setEditingArticle(null);
  }

  function handleEdit(id) {
    const article = articles.find((a) => a.id === id);
    if (article) {
      setEditingArticle(article);
      setMode("edit");
    }
  }

  async function handleCreateSubmit(payload) {
    try {
      await createArticle(payload);
      await loadArticles();
      showList();
    } catch (err) {
      alert(err.message || "Erreur à la création");
    }
  }

  async function handleEditSubmit(payload) {
    try {
      await updateArticle(payload.id, {
        titre: payload.titre,
        contenu: payload.contenu,
        publie: payload.publie,
      });
      await loadArticles();
      showList();
    } catch (err) {
      alert(err.message || "Erreur à la modification");
    }
  }

  function handleDelete(id) {
    console.log("DELETE — étape 06, id =", id);
  }

  return (
    <div className="app">
      <PageHeader title="Back-office — Blog Java" />

      <main>
        {mode === "list" && (
          <div className="toolbar">
            <button type="button" onClick={showCreate}>
              + Nouvel article
            </button>
          </div>
        )}

        {mode === "create" && (
          <ArticleForm
            key="create"
            initialValues={null}
            submitLabel="Créer"
            onSubmit={handleCreateSubmit}
            onCancel={showList}
          />
        )}

        {mode === "edit" && editingArticle && (
          <ArticleForm
            key={editingArticle.id}
            initialValues={editingArticle}
            submitLabel="Enregistrer"
            onSubmit={handleEditSubmit}
            onCancel={showList}
          />
        )}

        {mode === "list" && isLoading && <LoadingMessage />}

        {mode === "list" && error && <p className="error-message">{error}</p>}

        {mode === "list" && !isLoading && !error && (
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
