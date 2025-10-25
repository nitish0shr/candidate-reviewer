/**
 * Scoring logic for candidate evaluation
 * Compares resume against job description and calculates match scores
 */

import { ParsedResume, ParsedJD, ScoreResult, SkillMatch, ScoringWeights } from '../types';
import skillsData from './skills.json';

// Default scoring weights
const DEFAULT_WEIGHTS: ScoringWeights = {
  requiredSkillsWeight: 0.5,
  preferredSkillsWeight: 0.2,
  experienceWeight: 0.2,
  educationWeight: 0.1,
};

/**
 * Calculate overall match score between resume and job description
 * @param resume - Parsed resume data
 * @param jd - Parsed job description data
 * @param weights - Optional custom scoring weights
 * @returns Score result with detailed breakdown
 */
export function calculateScore(
  resume: ParsedResume,
  jd: ParsedJD,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): ScoreResult {
  // Calculate individual score components
  const requiredSkillsResult = scoreSkills(resume, jd.requiredSkills, true);
  const preferredSkillsResult = scoreSkills(resume, jd.preferredSkills, false);
  const experienceScore = scoreExperience(resume, jd);
  const educationScore = scoreEducation(resume, jd);
  
  // Calculate weighted overall score
  const overallScore = Math.min(
    100,
    Math.round(
      requiredSkillsResult.score * weights.requiredSkillsWeight +
      preferredSkillsResult.score * weights.preferredSkillsWeight +
      experienceScore * weights.experienceWeight +
      educationScore * weights.educationWeight
    )
  );
  
  return {
    overallScore,
    requiredSkillsScore: requiredSkillsResult.score,
    preferredSkillsScore: preferredSkillsResult.score,
    experienceScore,
    educationScore,
    matchedRequiredSkills: requiredSkillsResult.matched,
    matchedPreferredSkills: preferredSkillsResult.matched,
    missingRequiredSkills: requiredSkillsResult.missing,
    missingPreferredSkills: preferredSkillsResult.missing,
  };
}

/**
 * Score skills match between resume and job description
 */
function scoreSkills(
  resume: ParsedResume,
  requiredSkills: string[],
  isRequired: boolean
): { score: number; matched: SkillMatch[]; missing: string[] } {
  const matched: SkillMatch[] = [];
  const missing: string[] = [];
  
  requiredSkills.forEach(skillName => {
    const skill = skillsData.skills.find(s => s.name === skillName);
    const resumeSkills = resume.skills.map(s => s.toLowerCase());
    const resumeText = resume.rawText.toLowerCase();
    
    let foundInResume = false;
    const resumeKeywords: string[] = [];
    const jdKeywords: string[] = [skillName];
    
    // Check if skill name is in resume
    if (resumeSkills.includes(skillName.toLowerCase())) {
      foundInResume = true;
      resumeKeywords.push(skillName);
    }
    
    // Check if skill keywords are in resume
    if (skill && !foundInResume) {
      skill.keywords.forEach(keyword => {
        if (resumeText.includes(keyword.toLowerCase())) {
          foundInResume = true;
          resumeKeywords.push(keyword);
        }
      });
    }
    
    const skillMatch: SkillMatch = {
      skill: skillName,
      category: skill?.category || 'Other',
      foundInResume,
      foundInJD: true,
      resumeKeywords,
      jdKeywords,
    };
    
    if (foundInResume) {
      matched.push(skillMatch);
    } else {
      missing.push(skillName);
    }
  });
  
  // Calculate score
  const score = requiredSkills.length > 0
    ? Math.round((matched.length / requiredSkills.length) * 100)
    : 100;
  
  return { score, matched, missing };
}

/**
 * Score experience relevance
 */
function scoreExperience(resume: ParsedResume, jd: ParsedJD): number {
  if (!resume.experience || resume.experience.length === 0) {
    return 0;
  }
  
  // Count years of experience mentioned
  const resumeText = resume.rawText.toLowerCase();
  const experienceYears = extractYearsOfExperience(resumeText);
  
  // Check for relevant keywords from JD in experience section
  const experienceText = resume.experience.join(' ').toLowerCase();
  const jdKeywords = extractRelevantKeywords(jd.rawText);
  const matchedKeywords = jdKeywords.filter(keyword => 
    experienceText.includes(keyword.toLowerCase())
  );
  
  // Score based on experience length and keyword matches
  let score = 0;
  
  // Experience length score (max 50 points)
  if (experienceYears >= 5) score += 50;
  else if (experienceYears >= 3) score += 40;
  else if (experienceYears >= 1) score += 30;
  else score += 10;
  
  // Keyword match score (max 50 points)
  if (jdKeywords.length > 0) {
    score += Math.min(50, (matchedKeywords.length / jdKeywords.length) * 50);
  } else {
    score += 25; // Default if no keywords to match
  }
  
  return Math.round(Math.min(100, score));
}

/**
 * Extract years of experience from text
 */
function extractYearsOfExperience(text: string): number {
  const yearPatterns = [
    /(\d+)\+?\s*years?/gi,
    /(\d+)\+?\s*yrs?/gi,
  ];
  
  let maxYears = 0;
  
  yearPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const years = parseInt(match[1]);
      if (years > maxYears) {
        maxYears = years;
      }
    }
  });
  
  return maxYears;
}

/**
 * Extract relevant keywords from job description
 */
function extractRelevantKeywords(text: string): string[] {
  const keywords: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Extract technology and tool names from skills database
  skillsData.skills.forEach(skill => {
    if (lowerText.includes(skill.name.toLowerCase())) {
      keywords.push(skill.name);
    }
  });
  
  return keywords;
}

/**
 * Score education relevance
 */
function scoreEducation(resume: ParsedResume, jd: ParsedJD): number {
  if (!resume.education || resume.education.length === 0) {
    return 50; // Neutral score if no education info
  }
  
  const educationText = resume.education.join(' ').toLowerCase();
  let score = 50; // Base score
  
  // Check for degree levels
  if (educationText.includes('phd') || educationText.includes('doctorate')) {
    score = 100;
  } else if (educationText.includes('master') || educationText.includes('msc') || educationText.includes('mba')) {
    score = 90;
  } else if (educationText.includes('bachelor') || educationText.includes('bsc') || educationText.includes('ba ')) {
    score = 80;
  } else if (educationText.includes('associate') || educationText.includes('diploma')) {
    score = 70;
  }
  
  // Check for relevant field of study
  const jdText = jd.rawText.toLowerCase();
  const relevantFields = [
    'computer science', 'software', 'engineering', 'information technology',
    'it', 'data science', 'mathematics', 'statistics', 'business'
  ];
  
  const hasRelevantField = relevantFields.some(field => 
    educationText.includes(field) && jdText.includes(field)
  );
  
  if (hasRelevantField) {
    score = Math.min(100, score + 10);
  }
  
  return Math.round(score);
}
