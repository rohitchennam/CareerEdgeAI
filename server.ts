
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // API Routes
  app.post("/api/analyze-resume", async (req, res) => {
    try {
      const { base64Data, mimeType, profile, jobDescription } = req.body;
      const jdPrompt = jobDescription 
        ? `Also, compare the resume against this Job Description: "${jobDescription}". Provide a match percentage and specific suitability feedback.` 
        : "No job description provided.";

      const profileContext = `The user is currently a ${profile.currentRole} with ${profile.experienceYears} years of experience, targeting a ${profile.targetRole} role. Their skills include: ${profile.skills.join(', ')}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            {
              text: `Analyze this resume and provide a detailed structured response for ATS scoring and career guidance. ${profileContext} Suggest one primary recommended domain and 3-4 alternative focus areas. ${jdPrompt}`
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT" as any,
            properties: {
              atsScore: { type: "NUMBER" as any },
              strengths: { type: "ARRAY" as any, items: { type: "STRING" as any } },
              weaknesses: { type: "ARRAY" as any, items: { type: "STRING" as any } },
              improvements: { type: "ARRAY" as any, items: { type: "STRING" as any } },
              executiveSummary: { type: "STRING" as any },
              metrics: {
                type: "OBJECT" as any,
                properties: {
                  formatting: { type: "NUMBER" as any },
                  contentQuality: { type: "NUMBER" as any },
                  atsCompatibility: { type: "NUMBER" as any },
                  keywordUsage: { type: "NUMBER" as any }
                },
                required: ["formatting", "contentQuality", "atsCompatibility", "keywordUsage"]
              },
              recommendedDomain: {
                type: "OBJECT" as any,
                properties: {
                  title: { type: "STRING" as any },
                  justification: { type: "STRING" as any },
                  potentialRoles: { type: "ARRAY" as any, items: { type: "STRING" as any } },
                  alternativeDomains: { type: "ARRAY" as any, items: { type: "STRING" as any } }
                },
                required: ["title", "justification", "potentialRoles", "alternativeDomains"]
              },
              skillsFound: { type: "ARRAY" as any, items: { type: "STRING" as any } },
              jdMatch: {
                type: "OBJECT" as any,
                properties: {
                  matchPercentage: { type: "NUMBER" as any },
                  missingKeywords: { type: "ARRAY" as any, items: { type: "STRING" as any } },
                  suitabilityFeedback: { type: "STRING" as any }
                },
                required: ["matchPercentage", "missingKeywords", "suitabilityFeedback"]
              }
            },
            required: ["atsScore", "strengths", "weaknesses", "improvements", "executiveSummary", "metrics", "recommendedDomain", "skillsFound"]
          }
        }
      });

      res.json(JSON.parse(response.text));
    } catch (error: any) {
      console.error("Analyze Resume Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/generate-questions", async (req, res) => {
    try {
      const { domain, difficulty, count, mode, profile } = req.body;
      const modeInstruction = mode === 'On-Campus' 
        ? `Include questions from the chosen domain (${domain}) AND fundamental CS subjects like Data Structures & Algorithms (DSA), Operating Systems (OS), Database Management Systems (DBMS), and Computer Networks (CN).` 
        : `Focus exclusively on technical and behavioral questions tailored specifically to the ${domain} role.`;

      const profileContext = `The candidate is currently a ${profile.currentRole} with ${profile.experienceYears} years of experience, targeting a ${profile.targetRole} role. Their skills include: ${profile.skills.join(', ')}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate exactly ${count} interview questions for a ${difficulty} level role. ${profileContext} Mode: ${mode}. ${modeInstruction} Provide a mix of technical and behavioral questions.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY" as any,
            items: {
              type: "OBJECT" as any,
              properties: {
                id: { type: "INTEGER" as any },
                text: { type: "STRING" as any },
                type: { type: "STRING" as any, enum: ['technical', 'behavioral', 'core-cs'] }
              },
              required: ["id", "text", "type"]
            }
          }
        }
      });
      res.json(JSON.parse(response.text));
    } catch (error: any) {
      console.error("Generate Questions Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/evaluate-interview", async (req, res) => {
    try {
      const { domain, qaPairs, snapshots, profile } = req.body;
      const profileContext = `The candidate is currently a ${profile.currentRole} with ${profile.experienceYears} years of experience, targeting a ${profile.targetRole} role. Their skills include: ${profile.skills.join(', ')}.`;

      const parts: any[] = [
        { text: `You are a professional technical interviewer for the domain: ${domain}. ${profileContext}
        I am providing you with multiple audio recordings and snapshots of the candidate during the interview.
        
        CRITICAL INSTRUCTIONS:
        1. Listen to each audio recording carefully. If a recording is silent or contains no relevant answer, the score for that question MUST be 0.
        2. Evaluate performance PURELY based on the audio content provided. Do not assume or hallucinate information that is not in the audio.
        3. Analyze the facial snapshots to judge confidence, engagement, and non-verbal cues. If snapshots show significant anxiety or lack of focus, reflect this in the expressionAnalysis.
        4. Provide an overall accuracy score (0-100), a detailed summary of their knowledge grasp, specific feedback, and an expression analysis.
        
        The interview flow follows:
        ` }
      ];

      qaPairs.forEach((pair: any, index: number) => {
        parts.push({ text: `Question ${index + 1}: ${pair.question}` });
        parts.push({
          inlineData: {
            data: pair.audioData,
            mimeType: 'audio/webm'
          }
        });
      });

      parts.push({ text: "\nAttached snapshots for facial expression analysis during the interview:\n" });
      
      if (snapshots && snapshots.length > 0) {
        snapshots.slice(-8).forEach((data: string) => {
          parts.push({
            inlineData: {
              data: data,
              mimeType: 'image/jpeg'
            }
          });
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT" as any,
            properties: {
              accuracy: { type: "NUMBER" as any },
              knowledgeGrasp: { type: "STRING" as any },
              feedback: { type: "STRING" as any },
              expressionAnalysis: { type: "STRING" as any }
            },
            required: ["accuracy", "knowledgeGrasp", "feedback", "expressionAnalysis"]
          }
        }
      });
      
      res.json(JSON.parse(response.text));
    } catch (error: any) {
      console.error("Evaluate Interview Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
