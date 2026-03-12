const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.use(express.json());
app.use(express.static("public"));

const CLIENT_ID = "foodrobot-bbccg1zy";
const CLIENT_SECRET = "IL7Smb95z2d1azvwSLniyo66egsOF4mLx4ZlcDrU";
const KROGER_BASE = "https://api.kroger.com/v1";

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.post("/api/token", async (req, res) => {
  try {
    const { grant_type, scope, code, redirect_uri } = req.body;
    const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
    let body;
    if (grant_type === "authorization_code") {
      body = `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(redirect_uri)}`;
    } else {
      body = `grant_type=client_credentials&scope=${encodeURIComponent(scope || "product.compact")}`;
    }
    const response = await fetch(`${KROGER_BASE}/connect/oauth2/token`, {
      method: "POST",
      headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/search", async (req, res) => {
  try {
    const { term, token } = req.query;
    const response = await fetch(
      `${KROGER_BASE}/products?filter.term=${encodeURIComponent(term)}&filter.limit=12`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/cart", async (req, res) => {
  try {
    const { token, items } = req.body;
    const response = await fetch(`${KROGER_BASE}/cart/add`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const text = await response.text();
    res.status(response.status).send(text || JSON.stringify({ success: true }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`KrogerCart running on port ${PORT}`));
