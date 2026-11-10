import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { fal } from "@fal-ai/client";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable("x-powered-by");
app.use(helmet({
  // The current single-file interface uses inline CSS/JS; enable a nonce-based CSP
  // when the frontend assets are split into separate files.
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: "1mb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Trop de requêtes. Réessaie dans quelques minutes." }
});
app.use("/api", apiLimiter);

app.use(express.static(here, { index: "index.html" }));
if (process.env.FAL_KEY) fal.config({ credentials: process.env.FAL_KEY });

function checkFal(_req, res, next) {
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
    if (!c || typeof c.description !== "string" || !c.description.trim()) {
      return res.status(400).json({ error: "La description du personnage est obligatoire." });
    }
    if (Number(c.adult_age) < 18) {
      return res.status(400).json({ error: "Le générateur est limité aux personnages adultes." });
    }

    const prompt = [
      "Create one original photorealistic fictional adult character, full body, premium cinematic photography.",
      `Description: ${c.description.slice(0, 2000)}`,
      `Age: ${c.adult_age}; presentation: ${c.presentation}.`,
      `Hair: ${c.hair || "as described"}; eyes: ${c.eyes || "as described"}.`,
      `Body: ${c.body_type}; clothing: ${c.clothing || "appropriate outfit"}.`,
      `Personality: ${c.personality || "natural relaxed expression"}.`,
      `Photorealism target: ${Math.min(100, Math.max(0, Number(c.photorealism_percent) || 0))}%.`,
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
    console.error("character-image:", e);
    res.status(502).json({ error: "Échec du service de génération d'image." });
  }
});

app.post("/api/voice", checkFal, async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    if (!text || text.length > 5000) {
      return res.status(400).json({ error: "Le texte doit contenir de 1 à 5000 caractères." });
    }

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
    console.error("voice:", e);
    res.status(502).json({ error: "Échec du service de synthèse vocale." });
  }
});

app.use((err, _req, res, _next) => {
  console.error("request:", err);
  res.status(err.status || 500).json({ error: err.status === 413 ? "Requête trop volumineuse." : "Erreur serveur." });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, "0.0.0.0", () => console.log(`DIGITAL SOUL prêt sur le port ${port}`));
