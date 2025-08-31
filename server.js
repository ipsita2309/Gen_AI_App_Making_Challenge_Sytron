import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "../public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Initialize OpenAI client
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
} else {
  console.warn("⚠️ No OpenAI API key found in .env, mock mode will be used.");
}

// Generate pitch endpoint
app.post("/generate_pitch", async (req, res) => {
  const { idea } = req.body;
  if (!idea) return res.status(400).json({ error: "Idea is required" });

  let finalData;

  // Try OpenAI if API key is available
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a funny startup pitch generator."
          },
          {
            role: "user",
            content: `Generate a 5-slide pitch deck for this impossible startup idea: "${idea}". Return it in exact format, each on a separate line:

problem=...
solution=...
market=...
tagline=...`
          }
        ],
        temperature: 0.8
      });

      let text = completion.choices[0].message.content;

      // Fail-proof parsing: read key=value lines
      const jsonData = {};
      text.split("\n").forEach(line => {
        line = line.trim();
        if (!line) return;
        if (!line.includes("=")) return;
        const [key, ...rest] = line.split("=");
        jsonData[key.trim()] = rest.join("=").trim();
      });

      // Fill final data
      finalData = {
        idea,
        problem: jsonData.problem || "Problem not found",
        solution: jsonData.solution || "Solution not found",
        market: jsonData.market || "Market not found",
        tagline: jsonData.tagline || "Tagline not found",
        mock: false
      };

    } catch (err) {
      console.error("❌ OpenAI error, using mock:", err);
      finalData = {
        idea,
        problem: "People are bored because flying tacos don't exist",
        solution: "We invent self-propelling taco drones",
        market: "Everyone on Earth (and probably aliens too)",
        tagline: "Impossible but delicious!",
        mock: true
      };
    }

  } else {
    // No API key, return mock pitch
    finalData = {
      idea,
      problem: "People are bored because flying tacos don't exist",
      solution: "We invent self-propelling taco drones",
      market: "Everyone on Earth (and probably aliens too)",
      tagline: "Impossible but delicious!",
      mock: true
    };
  }

  res.json(finalData);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`App running at http://localhost:${PORT}`));
