import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// =========================
// AUTH INSEE
// =========================
async function getInseeToken() {
  const response = await fetch("https://api.insee.fr/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.INSEE_CLIENT_ID +
            ":" +
            process.env.INSEE_CLIENT_SECRET
        ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

// =========================
// FETCH ENTREPRISES INDUSTRIE
// =========================
async function fetchEntreprises() {
  const token = await getInseeToken();

  const res = await fetch(
    "https://api.insee.fr/entreprises/sirene/V3/siret?q=sectionUniteLegale:C&nombre=20",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();

  return data.etablissements.map((e) => ({
    nom: e.uniteLegale?.denominationUniteLegale || "N/A",
    ville: e.adresseEtablissement?.libelleCommuneEtablissement,
    siret: e.siret,
  }));
}

// =========================
// SIMULATION RECHERCHE WEB
// =========================
async function enrichEntreprise(e) {
  // 👉 ici on simule un moteur de recherche simple
  // (version gratuite = limitée)
  
  const query = encodeURIComponent(e.nom + " " + e.ville);
  const site = `https://www.google.com/search?q=${query}`;

  return {
    ...e,
    site,
    telephone: null,
    email: null,
  };
}

// =========================
// ROUTE PRINCIPALE
// =========================
app.get("/entreprises", async (req, res) => {
  try {
    const entreprises = await fetchEntreprises();

    const enriched = await Promise.all(
      entreprises.map(enrichEntreprise)
    );

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Induslead backend running 🚀");
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
