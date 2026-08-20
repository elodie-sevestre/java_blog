/**
 * articleSample - articles fictifs pour tester les composants SANS API.
 * Même forme que le JSON renvoyé par GET /articles (ArticleResponse côté Java)
 */
export const articleSample = [
  {
    id: 1,
    titre: "Premier article de démo",
    contenu: "Texte court pour tester ArticleCard.",
    publie: true,
    date: "2026-02-10T10:00:00",
  },
  {
    id: 2,
    titre: "Brouillon en cours",
    contenu: "Cet article pourrait être non publié.",
    publie: false,
    date: "2026-02-12T14:30:00",
  },
  {
    id: 3,
    titre: "PostgreSQL et React",
    contenu: "Deux applis, un projet.",
    publie: true,
    date: "2026-02-15T09:00:00",
  },
];
