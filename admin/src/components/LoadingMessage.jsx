/**
 * LoadingMessage - texte affiché pendant un chargement API.
 * Props :
 *  - text (string, optionnel) - message à afficher
 */

function LoadingMessage({ text = "Chargement en cours" }) {
  return <p className="loading-message">{text}</p>;
}
export default LoadingMessage;
