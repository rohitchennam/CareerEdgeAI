
import { GoogleGenAI, Type } from "@google/genai";
import { ResumeAnalysis, InterviewQuestion, InterviewMode, UserProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeResume = async (base64Data: string, mimeType: string, profile: UserProfile, jobDescription?: string): Promise<ResumeAnalysis> => {
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
        type: Type.OBJECT,
        properties: {
          atsScore: { type: Type.NUMBER },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          executiveSummary: { type: Type.STRING },
          metrics: {
            type: Type.OBJECT,
            properties: {
              formatting: { type: Type.NUMBER },
              contentQuality: { type: Type.NUMBER },
              atsCompatibility: { type: Type.NUMBER },
              keywordUsage: { type: Type.NUMBER }
            },
            required: ["formatting", "contentQuality", "atsCompatibility", "keywordUsage"]
          },
          recommendedDomain: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              justification: { type: Type.STRING },
              potentialRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
              alternativeDomains: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "justification", "potentialRoles", "alternativeDomains"]
          },
          skillsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
          jdMatch: {
            type: Type.OBJECT,
            properties: {
              matchPercentage: { type: Type.NUMBER },
              missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              suitabilityFeedback: { type: Type.STRING }
            },
            required: ["matchPercentage", "missingKeywords", "suitabilityFeedback"]
          }
        },
        required: ["atsScore", "strengths", "weaknesses", "improvements", "executiveSummary", "metrics", "recommendedDomain"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateInterviewQuestions = async (domain: string, difficulty: string, count: number, mode: InterviewMode, profile: UserProfile): Promise<InterviewQuestion[]> => {
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
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            text: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['technical', 'behavioral', 'core-cs'] }
          },
          required: ["id", "text", "type"]
        }
      }
    }
  });
  return JSON.parse(response.text);
};

export const evaluateFullInterview = async (
  domain: string, 
  qaPairs: { question: string, audioData: string }[], 
  snapshots: string[],
  profile: UserProfile
): Promise<any> => {
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

  qaPairs.forEach((pair, index) => {
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
    snapshots.slice(-8).forEach(data => {
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
        type: Type.OBJECT,
        properties: {
          accuracy: { type: Type.NUMBER },
          knowledgeGrasp: { type: Type.STRING },
          feedback: { type: Type.STRING },
          expressionAnalysis: { type: Type.STRING }
        },
        required: ["accuracy", "knowledgeGrasp", "feedback", "expressionAnalysis"]
      }
    }
  });
  
  return JSON.parse(response.text);
};
