
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  currentRole?: string;
  targetRole?: string;
  experienceYears: number;
  skills: string[];
  resumeUrl?: string;
  resumeName?: string;
  resumeAnalysis?: ResumeAnalysis;
  createdAt: any;
}

export interface ResumeAnalysis {
  atsScore: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  executiveSummary: string;
  metrics: {
    formatting: number;
    contentQuality: number;
    atsCompatibility: number;
    keywordUsage: number;
  };
  recommendedDomain: {
    title: string;
    justification: string;
    potentialRoles: string[];
    alternativeDomains: string[];
  };
  jdMatch?: {
    matchPercentage: number;
    missingKeywords: string[];
    suitabilityFeedback: string;
  };
  skillsFound: string[];
}

export interface InterviewQuestion {
  id: number;
  text: string;
  type: 'technical' | 'behavioral' | 'core-cs';
}

export type InterviewMode = 'On-Campus' | 'Off-Campus';

export interface InterviewConfig {
  domain: string;
  difficulty: 'Junior' | 'Mid-Level' | 'Senior' | 'Expert';
  questionCount: number;
  mode: InterviewMode;
}

export interface InterviewResult {
  accuracy: number;
  knowledgeGrasp: string;
  feedback: string;
  expressionAnalysis: string;
}

export interface SavedResume {
  id: string;
  uid: string;
  fileName: string;
  analysis: ResumeAnalysis;
  createdAt: any; // Firestore Timestamp
}

export interface SavedInterview {
  id: string;
  uid: string;
  config: InterviewConfig;
  result: InterviewResult;
  createdAt: any; // Firestore Timestamp
}
