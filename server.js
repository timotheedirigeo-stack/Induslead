import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// route test
app.get("/", (req, res) => {
  res.send("Induslead backend running 🚀");
});

// route entreprises (test simple pour vérifier que ça ne crash plus)
app.get("/entreprises", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.insee.fr/entreprises/sirene/V3/siret?q=activitePrincipaleUniteLegale:10"
    );

    const data = await response.json();

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// IMPORTANT : PORT dynamique pour Railway
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
