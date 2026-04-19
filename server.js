import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

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
  res.send("Induslead backend LIVE 🚀");
});

app.get("/entreprises", async (_req, res) => {
  try {
    const url =
      "https://recherche-entreprises.api.gouv.fr/search" +
      "?q=a" +
      "&section_activite_principale=B,C,D,E" +
      "&etat_administratif=A" +
      "&page=1" +
      "&per_page=20";

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "IndusLead/1.0"
      }
    });

    const raw = await response.text();

    if (!response.ok) {
      return res.status(response.status).send(raw);
    }

    const data = JSON.parse(raw);

    const entreprises = Array.isArray(data.results)
      ? data.results.map(mapCompany).filter(e => e.nom)
      : [];

    res.json(entreprises);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
