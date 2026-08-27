import { useCallback, useEffect, useState } from "react";
import PageHeader from "./components/PageHeader.jsx";
import ArticleList from "./components/ArticleList.jsx";
import ArticleForm from "./components/ArticleForm.jsx";
import LoadingMessage from "./components/LoadingMessage.jsx";
import FeedbackMessage from "./components/FeedbackMessage.jsx";
import LoginForm from "./components/LoginForm.jsx";
import {
  fetchRecentArticles,
  createArticle,
  updateArticle,
  deleteArticle,
} from "./api/articles.js";
import { login, logout, isLoggedIn, getPseudo } from "./api/auth.js";
import "./App.css";

function App() {
  const [authenticated, setAuthenticated] = useState(isLoggedIn());
  const [pseudo, setPseudo] = useState(getPseudo());
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [mode, setMode] = useState("list");
  const [editingArticle, setEditingArticle] = useState(null);
  const [feedback, setFeedback] = useState(null);

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
    if (authenticated) {
      loadArticles();
    }
  }, [authenticated, loadArticles]);

  async function handleLoginSubmit(credentials) {
    try {
      setIsLoggingIn(true);
      setLoginError(null);
      const data = await login(credentials);
      setAuthenticated(true);
      setPseudo(data.pseudo);
    } catch (err) {
      setLoginError(err.message || "Connexion impossible.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleLogout() {
    logout();
    setAuthenticated(false);
    setPseudo(null);
    setArticles([]);
    setMode("list");
    setEditingArticle(null);
    setFeedback(null);
    setError(null);
  }

  function handleSessionExpired(message) {
    if (message.includes("Session expirée")) {
      handleLogout();
      setLoginError("Session expirée — reconnecte-toi.");
    }
  }

  function clearFeedback() {
    setFeedback(null);
  }

  function showList() {
    setMode("list");
    setEditingArticle(null);
  }

  function showCreate() {
    clearFeedback();
    setMode("create");
    setEditingArticle(null);
  }

  function handleEdit(id) {
    clearFeedback();
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
      setFeedback({ type: "success", message: "Article créé." });
      showList();
    } catch (err) {
      handleSessionExpired(err.message);
      setFeedback({
        type: "error",
        message: err.message || "Erreur à la création.",
      });
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
      setFeedback({ type: "success", message: "Article enregistré." });
      showList();
    } catch (err) {
      handleSessionExpired(err.message);
      setFeedback({
        type: "error",
        message: err.message || "Erreur à la modification.",
      });
    }
  }

  async function handleDelete(id) {
    clearFeedback();

    const article = articles.find((a) => a.id === id);
    const titre = article?.titre ?? `#${id}`;

    const confirmed = window.confirm(
      `Supprimer l'article « ${titre} » ?\n\nCette action est définitive.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteArticle(id);
      await loadArticles();
      setFeedback({ type: "success", message: "Article supprimé." });
    } catch (err) {
      handleSessionExpired(err.message);
      setFeedback({
        type: "error",
        message: err.message || "Erreur à la suppression.",
      });
    }
  }

  // ─── Écran login ───
  if (!authenticated) {
    return (
      <div className="app">
        <PageHeader title="Back-office — Blog Java" />
        <main>
          <LoginForm
            onSubmit={handleLoginSubmit}
            errorMessage={loginError}
            isSubmitting={isLoggingIn}
          />
        </main>
      </div>
    );
  }

  // ─── Back-office (partie 04 + auth) ───
  return (
    <div className="app">
      <PageHeader title="Back-office — Blog Java" />

      <main>
        <div className="user-bar">
          <span>
            Connecté : <strong>{pseudo}</strong>
          </span>
          <button type="button" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>

        {feedback && (
          <FeedbackMessage
            type={feedback.type}
            message={feedback.message}
            onClose={clearFeedback}
          />
        )}

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
