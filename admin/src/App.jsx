import PageHeader from "./components/PageHeader.jsx";
import ArticleList from "./components/ArticleList.jsx";
import { articleSample } from "./data/articlesSample.js";
import "./App.css";

/**
 * App - racine du back-office.
 * Rôle : posséder les données (ici en dur) et passer des props aux enfants.
 */

function App() {
  // données en dur - étape 04 : viendront de l'API
  const articles = articleSample;

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
        <ArticleList
          articles={articles}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}

export default App;
