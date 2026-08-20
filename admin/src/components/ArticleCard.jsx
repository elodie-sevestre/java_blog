/**
 * ArticleCard - carte d'un article (affichage + actions).
 * Props :
 *  article : { id, titre, contenu, publie, date}
 *  - onEdit : fonction(id) - appelée au clic "Modifer"
 *  - onDelete : fonction(id) - appelée au clic "Supprimer"
 */

function ArticleCard({ article, onEdit, onDelete }) {
  // on extrait les champs pour la lisibilité (équivalent article.titre, etc)
  const { id, titre, contenu, publie, date } = article;

  // texte affiché selon le booléen publie (comme en Java : true/false)
  const statutLabel = publie ? "Publié" : "Brouillon";
  return (
    <article className="article-card">
      <h2>{titre}</h2>
      <p className="article-meta">
        #{id} - {statutLabel} - {date}
      </p>
      <p className="article-contenu">{contenu}</p>
      <div className="article-actions">
        <button type="button" onClick={() => onEdit(id)}>
          Modifier
        </button>
        <button type="button" onClick={() => onDelete(id)}>
          Supprimer
        </button>
      </div>
    </article>
  );
}

export default ArticleCard;
