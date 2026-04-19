import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

const INDUSTRY_CODES = ["B", "C", "D", "E"];

function isIndustry(code) {
  return code && INDUSTRY_CODES.includes(code[0]);
}

function mapCompany(c) {
  return {
    nom: c.nom_entreprise || c.nom_complet || c.raison_sociale || null,
    ville: c.siege?.libelle_commune || null,
    siret: c.siege?.siret || null,
    code_ape: c.activite_principale || null,
    section: c.activite_principale?.[0] || null,
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
    const response = await fetch(
      "https://recherche-entreprises.api.gouv.fr/search?q=industrie&page=1&per_page=20"
    );

    const data = await response.json();

    const entreprises = data.results
      .map(mapCompany)
      .filter(e => isIndustry(e.code_ape));

    res.json(entreprises);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
