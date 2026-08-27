/**
 * FeedbackMessage — bandeau succès ou erreur.
 * Props :
 *   - type : "success" | "error"
 *   - message : string — texte affiché
 *   - onClose : () => void — fermer le bandeau (optionnel)
 */
function FeedbackMessage({ type, message, onClose }) {
  if (!message) {
    return null;
  }

  return (
    <div className={`feedback feedback-${type}`} role="alert">
      <span>{message}</span>
      {onClose && (
        <button type="button" className="feedback-close" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
}

export default FeedbackMessage;
