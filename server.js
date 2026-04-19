import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

function isIndustry(naf){
  return ["B","C","D","E"].includes(naf?.[0]);
}

app.get("/leads", async (req, res) => {
  try {
    const r = await fetch("https://recherche-entreprises.api.gouv.fr/search?q=&per_page=20");
    const data = await r.json();

    const leads = data.results
      .filter(e => isIndustry(e.activite_principale))
      .map(e => ({
        name: e.nom_entreprise,
        city: e.siege?.libelle_commune,
        site: "",
        email: "",
        tel: ""
      }));

    res.json(leads);
  } catch (err) {
    res.json([]);
  }
});

app.listen(3000, () => console.log("server running"));
