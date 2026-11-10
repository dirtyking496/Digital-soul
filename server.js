import express from "express";
import { fal } from "@fal-ai/client";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "1mb" }));

// The repository keeps index.html at its root. Serve that file and its assets.
app.use(express.static(here, { index: "index.html" }));
if (process.env.FAL_KEY) fal.config({ credentials: process.env.FAL_KEY });

function checkFal(req, res, next) {
  if (!process.env.FAL_KEY) {
    return res.status(503).json({ error: "FAL_KEY manquante dans les variables d'environnement du serveur." });
  }
  next();
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, falConfigured: Boolean(process.env.FAL_KEY) });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(here, "index.html"));
});

app.post("/api/character-image", checkFal, async (req, res) => {
  try {
    const c = req.body?.configuration?.character;
    if (!c?.description?.trim()) return res.status(400).json({ error: "La description du personnage est obligatoire." });
    if (Number(c.adult_age) < 18) return res.status(400).json({ error: "Le générateur est limité aux personnages adultes." });

    const prompt = [
      "Create one original photorealistic fictional adult character, full body, premium cinematic photography.",
      `Description: ${c.description}`,
      `Age: ${c.adult_age}; presentation: ${c.presentation}.`,
      `Hair: ${c.hair || "as described"}; eyes: ${c.eyes || "as described"}.`,
      `Body: ${c.body_type}; clothing: ${c.clothing || "appropriate outfit"}.`,
      `Personality: ${c.personality || "natural relaxed expression"}.`,
      `Photorealism target: ${c.photorealism_percent}%.`,
      "Realistic anatomy, natural skin texture, coherent hands, believable lighting, detailed face, no text, no watermark."
    ].join("\n");

    const result = await fal.subscribe("google/nano-banana-2.1", {
      input: { prompt, num_images: 1, aspect_ratio: "3:4", output_format: "png", resolution: "1K" },
      logs: false
    });
    const imageUrl = result?.data?.images?.[0]?.url || result?.images?.[0]?.url;
    if (!imageUrl) return res.status(502).json({ error: "Aucune image retournée par le modèle." });
    res.json({ imageUrl, model: "google/nano-banana-2.1" });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: e.message || "Erreur de génération d'image." });
  }
});

app.post("/api/voice", checkFal, async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    if (!text || text.length > 5000) return res.status(400).json({ error: "Le texte doit contenir de 1 à 5000 caractères." });

    const result = await fal.subscribe("elevenlabs/tts/eleven-v4", {
      input: {
        text,
        voice: "Rachel",
        language_code: req.body?.language === "en" ? "en" : "fr",
        stability: req.body?.tone === "Énergique" ? 0.35 : 0.55,
        similarity_boost: 0.75,
        output_format: "mp3_44100_128"
      },
      logs: false
    });
    const audioUrl = result?.data?.audio?.url || result?.audio?.url;
    if (!audioUrl) return res.status(502).json({ error: "Aucun fichier audio retourné." });
    res.json({ audioUrl, model: "elevenlabs/tts/eleven-v4" });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: e.message || "Erreur de synthèse vocale." });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, "0.0.0.0", () => console.log(`DIGITAL SOUL prêt sur le port ${port}`));
