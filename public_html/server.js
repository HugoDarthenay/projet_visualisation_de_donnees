const express = require("express");
const app = express();
const PORT = 8081;

// Autoriser le CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// Route proxy pour Nominatim
app.get("/geocode", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Missing query parameter 'q'" });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
      { headers: { "User-Agent": "LocalD3App/1.0" } } // obligatoire pour Nominatim
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch from Nominatim" });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
