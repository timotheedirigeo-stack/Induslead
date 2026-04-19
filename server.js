import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const INSEE_API_KEY = process.env.INSEE_API_KEY;

const INDUSTRY_SECTIONS = new Set(["B", "C", "D", "E"]);

function mapEtablissement(e) {
  const activite =
    e?.uniteLegale?.activitePrincipaleUniteLegale ||
    e?.activitePrincipaleRegistreMetiersEtablissement ||
    null;

  const section =
    e?.uniteLegale?.sectionUniteLegale ||
    (activite ? activite[0] : null);

  return {
    nom:
      e?.uniteLegale?.denominationUniteLegale ||
      e?.uniteLegale?.nomUniteLegale ||
      e?.uniteLegale?.prenom1UniteLegale ||
      null,
    ville: e?.adresseEtablissement?.libelleCommuneEtablissement || null,
    siret: e?.siret || null,
    code_ape: activite,
    section,
    site: null,
    email: null,
    telephone: null,
  };
}

app.get("/", (_req, res) => {
  res.send("Induslead backend LIVE 🚀");
});

app.get("/entreprises", async (_req, res) => {
  try {
    if (!INSEE_API_KEY) {
      return res.status(500).json({
        error: "INSEE_API_KEY manquante dans Railway > Variables",
      });
    }

    const url =
      "https://api.insee.fr/api-sirene/3.11/siret?q=etatAdministratifEtablissement:A&nombre=20";

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-INSEE-Api-Key-Integration": INSEE_API_KEY,
      },
    });

    const raw = await response.text();

    if (!response.ok) {
      return res.status(response.status).send(raw);
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(500).json({
        error: "Réponse INSEE non JSON",
        raw: raw.slice(0, 300),
      });
    }

    const etablissements = Array.isArray(data.etablissements)
      ? data.etablissements
      : [];

    const entreprises = etablissements
      .map(mapEtablissement)
      .filter((e) => e.nom && e.section && INDUSTRY_SECTIONS.has(e.section));

    res.json(entreprises);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
