import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Helper to safely get Gemini Client with lazy-initialization
function getGeminiClient(): { ai: GoogleGenAI; model: string } | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
  return { ai, model: "gemini-3.5-flash" };
}

// REST API for study plan generation using Gemini 1.5/3.5 Flash
app.post("/api/generate-plan", async (req: Request, res: Response) => {
  try {
    const { content, durationDays, minutesPerDay, subject, projectTitle } = req.body;

    if (!content || !durationDays || !minutesPerDay) {
      res.status(400).json({ error: "Missing required parameters: content, durationDays, and minutesPerDay are required." });
      return;
    }

    const gemini = getGeminiClient();
    if (!gemini) {
      res.status(400).json({
        error: "Gemini API key is not configured. Please supply your API key in the Secrets / Environment variable settings to activate StudyBits core generation."
      });
      return;
    }

    const { ai, model } = gemini;

    const systemPrompt = `You are StudyBits, an elite educational system that breaks down massive, complex, or tedious study materials into digestible, hyper-focused daily "bits" to combat last-minute cramming.
Your goal is to parse the input material and distill it into exactly ${durationDays} daily bits.
Each bit must fit sequentially from Day 1 to Day ${durationDays}.
Each bit should correspond to roughly ${minutesPerDay} minutes of daily study time.
Each bit must have:
- dayNumber (integer from 1 to ${durationDays})
- title (catchy, concise lesson name, e.g. "Understand the Syntax" or "The Mitochondria Membrane")
- summary (a complete draft of the lesson contents. Write this in a readable, highly educational prose. Do not make it a simple list of outline items. Include detailed definitions, brief context, clear explanations, and formatting with markdown for headers and lists so that the user can literally learn the material by just reading this.)
- keyTakeaways (exactly 3 memorable high-value bullets of 1-sentence each)
- readingTimeMin (an estimated actual reading time in minutes, which should be scaled based on study duration)
- quiz (exactly 3 interactive multiple-choice questions to reinforce learning)
  - Each quiz question must have exactly 4 choices
  - Each quiz question must have a correctAnswerIndex (0, 1, 2, or 3) targetting the correct element.`;

    const userPrompt = `Subject requested: ${subject || "General Study"}
Course target title: ${projectTitle || "Study Material Breakdown"}
Total Days requested: ${durationDays}
Minutes available per day: ${minutesPerDay} minutes

Here is the study material text to parse and split:
-----
${content.substring(0, 150000)}
-----

Please generate the study plan now. Return valid cohesive structured JSON matching the requested schema.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planTitle: {
              type: Type.STRING,
              description: "A gorgeous, descriptive title for the overall master plan (e.g. 'Intro to Biology: Cellular Machinery' or 'React Hooks Demystified')."
            },
            bits: {
              type: Type.ARRAY,
              description: "The complete list of daily study modules. Must be exactly N sequential days from 1 to N.",
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING, description: "Rich, comprehensive, and clear educational content explaining the concepts for today. Use Markdown where helpful." },
                  keyTakeaways: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Exactly 3 main actionable key takeaway lines."
                  },
                  readingTimeMin: { type: Type.INTEGER, description: "Estimated study time needed to fully digest today's bit." },
                  quiz: {
                    type: Type.ARRAY,
                    description: "Exactly 3 distinct, multiple-choice testing questions",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        question: { type: Type.STRING },
                        options: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: "Exactly 4 options"
                        },
                        correctAnswerIndex: { type: Type.INTEGER, description: "Correct index from 0 to 3." }
                      },
                      required: ["question", "options", "correctAnswerIndex"]
                    }
                  }
                },
                required: ["dayNumber", "title", "summary", "keyTakeaways", "readingTimeMin", "quiz"]
              }
            }
          },
          required: ["planTitle", "bits"]
        }
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("Empty response returned from Gemini.");
    }

    const parsedData = JSON.parse(outputText.trim());
    res.json(parsedData);
  } catch (error: any) {
    console.error("Plan Generation Error:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred during study plan compilation." });
  }
});

// Vite Middleware integration for Full-Stack Hot Reload support
async function configureDevServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StudyBits Server running on http://0.0.0.0:${PORT}`);
  });
}

configureDevServer();
