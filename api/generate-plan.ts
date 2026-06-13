import { Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

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

export default async function handler(req: Request, res: Response) {
  // Only allow POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed. Use POST." });
    return;
  }

  const requestId = `req_${Date.now()}`;
  console.log(`[${requestId}] [INFO] POST /api/generate-plan initiated on Vercel Serverless.`);
  try {
    const { content, durationDays, minutesPerDay, subject, projectTitle } = req.body;

    console.log(`[${requestId}] [INFO] Parameters - Title: "${projectTitle || "N/A"}", Subject: "${subject || "N/A"}", Days: ${durationDays}, Mins/Day: ${minutesPerDay}`);
    console.log(`[${requestId}] [INFO] Input material length: ${content ? content.length : 0} characters.`);

    if (!content || !durationDays || !minutesPerDay) {
      const errMsg = "Missing required parameters: content, durationDays, and minutesPerDay are required.";
      console.warn(`[${requestId}] [WARN] Bad request: ${errMsg}`);
      res.status(400).json({ error: errMsg });
      return;
    }

    const hasKey = !!process.env.GEMINI_API_KEY;
    const keyPrefix = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 6) : "none";
    console.log(`[${requestId}] [INFO] Checking GEMINI_API_KEY status. Configured: ${hasKey}. Key prefix: "${keyPrefix}..."`);

    const gemini = getGeminiClient();
    if (!gemini) {
      const errMsg = "Gemini API key is not configured. Please supply your API key in the Secrets / Environment variable settings to activate StudyBits core generation.";
      console.error(`[${requestId}] [ERROR] ${errMsg}`);
      res.status(400).json({
        error: errMsg
      });
      return;
    }

    const { ai, model } = gemini;
    console.log(`[${requestId}] [INFO] Initialized GoogleGenAI client with model: "${model}". Sending study bits plan instructions...`);

    const systemPrompt = `You are StudyBits, an elite educational system that breaks down massive, complex, or tedious study materials into digestible, hyper-focused daily "bits" to combat last-minute cramming.
Your goal is to parse the input material and distill it into exactly \${durationDays} daily bits.
Each bit must fit sequentially from Day 1 to Day \${durationDays}.
Each bit should correspond to roughly \${minutesPerDay} minutes of daily study time.
Each bit must have:
- dayNumber (integer from 1 to \${durationDays})
- title (catchy, concise lesson name, e.g. "Understand the Syntax" or "The Mitochondria Membrane")
- summary (a complete draft of the lesson contents. Write this in a readable, highly educational prose. Do not make it a simple list of outline items. Include detailed definitions, brief context, clear explanations, and formatting with markdown for headers and lists so that the user can literally learn the material by just reading this.)
- keyTakeaways (exactly 3 memorable high-value bullets of 1-sentence each)
- readingTimeMin (an estimated actual reading time in minutes, which should be scaled based on study duration)
- quiz (exactly 3 interactive multiple-choice questions to reinforce learning)
  - Each quiz question must have exactly 4 choices
  - Each quiz question must have a correctAnswerIndex (0, 1, 2, or 3) targetting the correct element.`;

    const userPrompt = `Subject requested: \${subject || "General Study"}
Course target title: \${projectTitle || "Study Material Breakdown"}
Total Days requested: \${durationDays}
Minutes available per day: \${minutesPerDay} minutes

Here is the study material text to parse and split:
-----
\${content.substring(0, 150000)}
-----

Please generate the study plan now. Return valid cohesive structured JSON matching the requested schema.`;

    const startTime = Date.now();
    console.log(`[\${requestId}] [INFO] Invoking Gemini API generateContent call...`);
    
    let response;
    try {
      response = await ai.models.generateContent({
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
    } catch (apiErr: any) {
      console.error(`[\${requestId}] [API_ERROR] Gemini model generateContent SDK call failed:`, apiErr);
      throw apiErr;
    }

    const duration = Date.now() - startTime;
    console.log(`[\${requestId}] [INFO] Gemini API responded successfully in \${duration}ms.`);

    const outputText = response.text;
    if (!outputText) {
      console.error(`[\${requestId}] [ERROR] Gemini API returned an empty output string.`);
      throw new Error("Empty response returned from Gemini.");
    }

    console.log(`[\${requestId}] [INFO] Gemini raw response text length: \${outputText.length} characters.`);

    let parsedData;
    try {
      parsedData = JSON.parse(outputText.trim());
      console.log(`[\${requestId}] [INFO] Valid JSON successfully parsed. Title: "\${parsedData.planTitle}", portions count: \${parsedData.bits ? parsedData.bits.length : 0}.`);
    } catch (parseErr: any) {
      console.error(`[\${requestId}] [PARSE_ERROR] Failed to parse outputText as structured JSON.`, parseErr);
      console.error(`[\${requestId}] [PARSE_ERROR] FIRST 1500 CHARACTERS OF THE FAILED RESPONSE:`);
      console.error("--------------------------------------------------");
      console.error(outputText.substring(0, 1500));
      console.error("--------------------------------------------------");
      throw new Error(`The AI output was not valid JSON: \${parseErr.message || parseErr}`);
    }

    res.json(parsedData);
  } catch (error: any) {
    console.error(`[\${requestId}] [FATAL_ERROR] Exception caught in generate-plan route handler:`, error);
    res.status(500).json({ 
      error: error.message || "An unexpected error occurred during study plan compilation.",
      requestId: requestId,
      stack: process.env.NODE_ENV !== "production" ? error.stack : undefined
    });
  }
}
