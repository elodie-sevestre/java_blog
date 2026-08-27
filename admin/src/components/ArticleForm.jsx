// affiche des champs contrôlés (valeur liée au state React) et, à la soumission, appeler onSubmit avec les données sans faire le fetch ici

import { useState } from "react";

/**
 * ArticleForm — formulaire création OU édition d'un article.
 * Props :
 *   - initialValues : null (création) ou objet article (édition)
 *   - onSubmit : (payload) => void — parent envoie à l'API
 *   - onCancel : () => void — retour liste
 *   - submitLabel : string — texte du bouton (ex. "Créer", "Enregistrer")
 */
function ArticleForm({ initialValues, onSubmit, onCancel, submitLabel }) {
  const isEdit = initialValues != null;

  const [titre, setTitre] = useState(initialValues?.titre ?? "");
  const [contenu, setContenu] = useState(initialValues?.contenu ?? "");
  const [publie, setPublie] = useState(initialValues?.publie ?? false);
  const [userId, setUserId] = useState(initialValues?.userId ?? 1);

  function handleSubmit(event) {
    event.preventDefault();

    if (isEdit) {
      onSubmit({
        id: initialValues.id,
        titre,
        contenu,
        publie,
      });
    } else {
      onSubmit({
        titre,
        contenu,
        userId: Number(userId),
      });
    }
  }

  return (
    <form className="article-form" onSubmit={handleSubmit}>
      <h2>{isEdit ? "Modifier l'article" : "Nouvel article"}</h2>

      <label>
        Titre
        <input
          type="text"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          required
        />
      </label>

      <label>
        Contenu
        <textarea
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          rows={5}
          required
        />
      </label>

      {isEdit ? (
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={publie}
            onChange={(e) => setPublie(e.target.checked)}
          />
          Publié
        </label>
      ) : (
        <label>
          ID auteur (userId)
          <input
            type="number"
            min={1}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </label>
      )}

      <div className="form-actions">
        <button type="submit">{submitLabel}</button>
        <button type="button" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}

export default ArticleForm;
