import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// ======================
// TOKEN INSEE
// ======================
async function getToken() {
  const res = await fetch("https://api.insee.fr/token", {
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

  const data = await res.json();
  return data.access_token;
}

// ======================
// ENTREPRISES INDUSTRIE
// ======================
async function getCompanies() {
  const token = await getToken();

  const res = await fetch(
    "https://api.insee.fr/entreprises/sirene/V3/siret?q=sectionUniteLegale:C&nombre=10",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();

  return data.etablissements.map((e) => ({
    nom: e.uniteLegale?.denominationUniteLegale || null,
    ville: e.adresseEtablissement?.libelleCommuneEtablissement || null,
  }));
}

// ======================
// RECHERCHE SITE WEB
// ======================
async function findWebsite(name, city) {
  try {
    const query = encodeURIComponent(`${name} ${city} entreprise`);
    const res = await fetch(`https://duckduckgo.com/html/?q=${query}`);
    const html = await res.text();

    const match = html.match(/href="(https?:\/\/[^"]+)"/);

    if (match) return match[1];

    return null;
  } catch {
    return null;
  }
}

// ======================
// EXTRACTION EMAIL/TEL
// ======================
async function scrapeContacts(url) {
  try {
    const res = await fetch(url, { timeout: 5000 });
    const html = await res.text();

    const emailMatch = html.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/
    );

    const phoneMatch = html.match(
      /(\+33|0)[1-9](\d{2}){4}/
    );

    return {
      email: emailMatch ? emailMatch[0] : null,
      telephone: phoneMatch ? phoneMatch[0] : null,
    };
  } catch {
    return { email: null, telephone: null };
  }
}

// ======================
// ROUTE PRINCIPALE
// ======================
app.get("/entreprises", async (req, res) => {
  try {
    const companies = await getCompanies();

    const results = await Promise.all(
      companies.map(async (c) => {
        const site = await findWebsite(c.nom, c.ville);

        let contacts = { email: null, telephone: null };

        if (site) {
          contacts = await scrapeContacts(site);
        }

        return {
          ...c,
          site,
          email: contacts.email,
          telephone: contacts.telephone,
        };
      })
    );

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ======================
app.get("/", (req, res) => {
  res.send("Induslead backend LIVE 🚀");
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
