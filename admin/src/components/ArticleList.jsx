import ArticleCard from "./ArticleCard.jsx";

/**
 * ArticleList - liste de cartes articles.
 * Props :
 *  - articles : tableau d'objets article
 *  - onEdit, onDelete : callbacks transmis à chaque ArticleCard
 */

function ArticleList({ articles, onEdit, onDelete }) {
  // cas limite : tableau vide - message clair pour l'utilisateur
  if (articles.length === 0) {
    return <p className="empty-list">Aucun article à afficher.</p>;
  }
  return (
    <section className="article-list">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </section>
  );
}

export default ArticleList;
