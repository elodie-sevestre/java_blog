import { useEffect, useState } from "react";

const API_URL = "http://localhost:8080";

/**
 * App — composant racine du back-office.
 * Pour l'instant : un titre seulement. Les listes et formulaires viendront aux étapes 03–05.
 */
function App() {
  // useState = « mémoire » du composant : ici, la liste d'articles (vide au début)
  const [articles, setArticles] = useState([]);

  // useEffect = « fais ceci une fois au chargement de la page »
  useEffect(() => {
    fetch(`${API_URL}/articles`)
      .then((response) => response.json())
      .then((data) => setArticles(data))
      .catch((error) => console.error("Erreur fetch :", error));
  }, []);

  return (
    <div className="app">
      <h1>Back-office — Blog Java</h1>
      <p>
        Nombre d&apos;articles publiés reçus de l&apos;API : {articles.length}
      </p>
    </div>
  );
}

export default App;
