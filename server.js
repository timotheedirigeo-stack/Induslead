import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// on garde un offset en mémoire pour ne pas renvoyer toujours la même page
let pageCursor = 1;

function mapCompany(c) {
  return {
    nom: c.nom_entreprise || c.nom_complet || c.raison_sociale || null,
    ville: c.siege?.libelle_commune || c.libelle_commune || null,
    siret: c.siege?.siret || c.siret || null,
    siren: c.siren || null,
    code_ape: c.activite_principale || c.code_naf || null,
    section: (c.activite_principale || c.code_naf || "")[0] || null,
    site: null,
    email: null,
    telephone: null
  };
}

app.get("/", (_req, res) => {
  res.send("INDUSLEAD V3 OK");
});

app.get("/entreprises", async (_req, res) => {
  try {
    const all = [];
    const pagesToFetch = 3; // 3 pages x 20 = ~60 résultats bruts

    for (let i = 0; i < pagesToFetch; i++) {
      const page = pageCursor + i;

      const url =
        "https://recherche-entreprises.api.gouv.fr/search" +
        "?q=a" +
        "&section_activite_principale=B,C,D,E" +
        "&etat_administratif=A" +
        `&page=${page}` +
        "&per_page=20";

      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "IndusLead/1.0"
        }
      });

      if (!response.ok) continue;

      const data = await response.json();
      const items = Array.isArray(data.results) ? data.results : [];
      all.push(...items);
    }

    // avance le curseur pour varier les résultats au prochain clic
    pageCursor += pagesToFetch;
    if (pageCursor > 50) pageCursor = 1;

    // normalisation + déduplication
    const map = new Map();

    all
      .map(mapCompany)
      .filter((e) => e.nom && e.siret)
      .forEach((e) => {
        if (!map.has(e.siret)) {
          map.set(e.siret, e);
        }
      });

    const entreprises = Array.from(map.values()).slice(0, 50);

    res.json({
      status: "ok",
      count: entreprises.length,
      data: entreprises
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
