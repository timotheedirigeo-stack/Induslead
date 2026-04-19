import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get("/", (_req, res) => {
  res.send("INDUSLEAD V2 OK");
});

app.get("/entreprises", (_req, res) => {
  res.json({
    status: "ok",
    data: [
      {
        nom: "LAFARGE BETONS",
        ville: "ISSY-LES-MOULINEAUX",
        siret: "41481504303184",
        code_ape: "23.63Z",
        section: "C",
        site: null,
        email: null,
        telephone: null
      },
      {
        nom: "AIR LIQUIDE FRANCE INDUSTRIE",
        ville: "PARIS",
        siret: "31411950400021",
        code_ape: "20.11Z",
        section: "C",
        site: null,
        email: null,
        telephone: null
      }
    ]
  });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
