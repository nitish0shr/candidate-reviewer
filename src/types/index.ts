// Core types for the candidate reviewer application

export interface Skill {
  name: string;
  category: string;
  keywords: string[];
  weight?: number;
}

export interface SkillMatch {
  skill: string;
  category: string;
  foundInResume: boolean;
  foundInJD: boolean;
  resumeKeywords: string[];
  jdKeywords: string[];
}

export interface ParsedResume {
  rawText: string;
  name?: string;
  email?: string;
  phone?: string;
  skills: string[];
  experience?: string[];
  education?: string[];
  sections?: Record<string, string>;
}

export interface ParsedJD {
  rawText: string;
  title?: string;
  company?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities?: string[];
  qualifications?: string[];
  sections?: Record<string, string>;
}

export interface ScoringWeights {
  requiredSkillsWeight: number;
  preferredSkillsWeight: number;
  experienceWeight: number;
  educationWeight: number;
}

export interface ScoreResult {
  overallScore: number;
  requiredSkillsScore: number;
  preferredSkillsScore: number;
  experienceScore: number;
  educationScore: number;
  matchedRequiredSkills: SkillMatch[];
  matchedPreferredSkills: SkillMatch[];
  missingRequiredSkills: string[];
  missingPreferredSkills: string[];
}

export interface Assessment {
  candidateName: string;
  jobTitle: string;
  score: ScoreResult;
  strengths: string[];
  weaknesses: string[];
  recommendation: 'Strong Yes' | 'Yes' | 'Maybe' | 'No' | 'Strong No';
  summary: string;
  detailedAnalysis: {
    skillsAnalysis: string;
    experienceAnalysis: string;
    educationAnalysis: string;
    overallFit: string;
  };
  timestamp: string;
}

export interface SkillsDatabase {
  skills: Skill[];
  version: string;
  lastUpdated: string;
}
