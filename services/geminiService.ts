
import { ResumeAnalysis, InterviewQuestion, InterviewMode, UserProfile, InterviewResult } from "../types";

export const analyzeResume = async (base64Data: string, mimeType: string, profile: UserProfile, jobDescription?: string): Promise<ResumeAnalysis> => {
  const response = await fetch("/api/analyze-resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Data, mimeType, profile, jobDescription }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to analyze resume");
  }

  return response.json();
};

export const generateInterviewQuestions = async (domain: string, difficulty: string, count: number, mode: InterviewMode, profile: UserProfile): Promise<InterviewQuestion[]> => {
  const response = await fetch("/api/generate-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain, difficulty, count, mode, profile }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate questions");
  }

  return response.json();
};

export const evaluateFullInterview = async (
  domain: string, 
  qaPairs: { question: string, audioData: string }[], 
  snapshots: string[],
  profile: UserProfile
): Promise<InterviewResult> => {
  const response = await fetch("/api/evaluate-interview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain, qaPairs, snapshots, profile }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to evaluate interview");
  }

  return response.json();
};
