/**
 * PageHeader - bandeau titre du back-office.
 * Props :
 *  - title (string) : texte affiché en gros
 */
function PageHeader({ title }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
    </header>
  );
}

export default PageHeader;
