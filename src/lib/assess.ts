/**
 * Assessment generation logic
 * Creates detailed candidate assessment reports based on scoring results
 */

import { ParsedResume, ParsedJD, ScoreResult, Assessment } from '../types';

/**
 * Generate a comprehensive assessment for a candidate
 * @param resume - Parsed resume data
 * @param jd - Parsed job description data
 * @param score - Score result from evaluation
 * @returns Complete assessment report
 */
export function generateAssessment(
  resume: ParsedResume,
  jd: ParsedJD,
  score: ScoreResult
): Assessment {
  const candidateName = resume.name || 'Candidate';
  const jobTitle = jd.title || 'Position';
  
  // Identify strengths and weaknesses
  const strengths = identifyStrengths(score, resume, jd);
  const weaknesses = identifyWeaknesses(score, resume, jd);
  
  // Determine recommendation
  const recommendation = determineRecommendation(score);
  
  // Generate summary
  const summary = generateSummary(candidateName, jobTitle, score, recommendation);
  
  // Generate detailed analysis
  const detailedAnalysis = generateDetailedAnalysis(score, resume, jd);
  
  return {
    candidateName,
    jobTitle,
    score,
    strengths,
    weaknesses,
    recommendation,
    summary,
    detailedAnalysis,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Identify candidate strengths based on scoring
 */
function identifyStrengths(
  score: ScoreResult,
  resume: ParsedResume,
  jd: ParsedJD
): string[] {
  const strengths: string[] = [];
  
  // Strong required skills match
  if (score.requiredSkillsScore >= 80) {
    strengths.push(
      `Excellent match on required skills (${score.requiredSkillsScore}%): ` +
      `Possesses ${score.matchedRequiredSkills.length} out of ${jd.requiredSkills.length} required skills`
    );
  } else if (score.requiredSkillsScore >= 60) {
    strengths.push(
      `Good match on required skills (${score.requiredSkillsScore}%): ` +
      `Meets most core requirements`
    );
  }
  
  // Preferred skills
  if (score.matchedPreferredSkills.length > 0) {
    const topSkills = score.matchedPreferredSkills.slice(0, 3).map(s => s.skill).join(', ');
    strengths.push(
      `Strong preferred skills: ${topSkills} and ${score.matchedPreferredSkills.length} additional skills`
    );
  }
  
  // Experience
  if (score.experienceScore >= 75) {
    strengths.push(
      `Relevant work experience (${score.experienceScore}%): ` +
      `${resume.experience?.length || 0} relevant positions demonstrating applicable expertise`
    );
  }
  
  // Education
  if (score.educationScore >= 85) {
    strengths.push(
      `Strong educational background (${score.educationScore}%): ` +
      `Relevant degree(s) aligned with position requirements`
    );
  }
  
  // Overall score
  if (score.overallScore >= 80) {
    strengths.push(
      `Outstanding overall match (${score.overallScore}%): ` +
      `Candidate demonstrates exceptional alignment with job requirements`
    );
  }
  
  // Specific skill categories
  const skillCategories = new Set(
    [...score.matchedRequiredSkills, ...score.matchedPreferredSkills]
      .map(s => s.category)
  );
  
  if (skillCategories.size > 0) {
    strengths.push(
      `Diverse skill set across ${skillCategories.size} categories: ` +
      `${Array.from(skillCategories).join(', ')}`
    );
  }
  
  return strengths;
}

/**
 * Identify candidate weaknesses based on scoring
 */
function identifyWeaknesses(
  score: ScoreResult,
  resume: ParsedResume,
  jd: ParsedJD
): string[] {
  const weaknesses: string[] = [];
  
  // Missing required skills
  if (score.missingRequiredSkills.length > 0) {
    const topMissing = score.missingRequiredSkills.slice(0, 3).join(', ');
    weaknesses.push(
      `Missing ${score.missingRequiredSkills.length} required skills: ` +
      `${topMissing}${score.missingRequiredSkills.length > 3 ? ' and more' : ''}`
    );
  }
  
  // Low required skills score
  if (score.requiredSkillsScore < 50) {
    weaknesses.push(
      `Weak match on required skills (${score.requiredSkillsScore}%): ` +
      `Significant gaps in core competencies`
    );
  }
  
  // Missing preferred skills
  if (score.missingPreferredSkills.length > score.matchedPreferredSkills.length) {
    weaknesses.push(
      `Limited preferred skills (${score.preferredSkillsScore}%): ` +
      `Missing several desirable but non-essential skills`
    );
  }
  
  // Experience
  if (score.experienceScore < 50) {
    weaknesses.push(
      `Limited relevant experience (${score.experienceScore}%): ` +
      `May not have sufficient background for this role`
    );
  }
  
  // Education
  if (score.educationScore < 60) {
    weaknesses.push(
      `Educational background may not align (${score.educationScore}%): ` +
      `Consider alternative qualifications or experience`
    );
  }
  
  // Overall score
  if (score.overallScore < 50) {
    weaknesses.push(
      `Low overall match (${score.overallScore}%): ` +
      `Significant concerns about candidate fit for this position`
    );
  }
  
  return weaknesses;
}

/**
 * Determine hiring recommendation based on score
 */
function determineRecommendation(score: ScoreResult): Assessment['recommendation'] {
  if (score.overallScore >= 85) {
    return 'Strong Yes';
  } else if (score.overallScore >= 70) {
    return 'Yes';
  } else if (score.overallScore >= 55) {
    return 'Maybe';
  } else if (score.overallScore >= 40) {
    return 'No';
  } else {
    return 'Strong No';
  }
}

/**
 * Generate executive summary
 */
function generateSummary(
  candidateName: string,
  jobTitle: string,
  score: ScoreResult,
  recommendation: Assessment['recommendation']
): string {
  const scoreDescription = 
    score.overallScore >= 80 ? 'excellent' :
    score.overallScore >= 65 ? 'strong' :
    score.overallScore >= 50 ? 'moderate' :
    score.overallScore >= 35 ? 'limited' :
    'weak';
  
  return (
    `${candidateName} shows a ${scoreDescription} match (${score.overallScore}%) for the ${jobTitle} position. ` +
    `Assessment: ${recommendation}. ` +
    `The candidate demonstrates ${score.requiredSkillsScore}% alignment with required skills ` +
    `and ${score.preferredSkillsScore}% match on preferred qualifications. ` +
    `${score.missingRequiredSkills.length === 0 
      ? 'All required skills are present.' 
      : `Notable gaps in ${score.missingRequiredSkills.length} required skill(s).`}`
  );
}

/**
 * Generate detailed analysis sections
 */
function generateDetailedAnalysis(
  score: ScoreResult,
  resume: ParsedResume,
  jd: ParsedJD
): Assessment['detailedAnalysis'] {
  return {
    skillsAnalysis: generateSkillsAnalysis(score, jd),
    experienceAnalysis: generateExperienceAnalysis(score, resume),
    educationAnalysis: generateEducationAnalysis(score, resume),
    overallFit: generateOverallFit(score),
  };
}

/**
 * Generate skills analysis section
 */
function generateSkillsAnalysis(score: ScoreResult, jd: ParsedJD): string {
  const requiredMatch = `${score.matchedRequiredSkills.length}/${jd.requiredSkills.length}`;
  const preferredMatch = `${score.matchedPreferredSkills.length}/${jd.preferredSkills.length}`;
  
  let analysis = `Required Skills: ${requiredMatch} matched (${score.requiredSkillsScore}%). `;
  
  if (score.matchedRequiredSkills.length > 0) {
    const topMatches = score.matchedRequiredSkills.slice(0, 5).map(s => s.skill).join(', ');
    analysis += `Strong in: ${topMatches}. `;
  }
  
  if (score.missingRequiredSkills.length > 0) {
    const topMissing = score.missingRequiredSkills.slice(0, 3).join(', ');
    analysis += `Gaps in: ${topMissing}. `;
  }
  
  analysis += `\n\nPreferred Skills: ${preferredMatch} matched (${score.preferredSkillsScore}%). `;
  
  if (score.matchedPreferredSkills.length > 0) {
    const topPreferred = score.matchedPreferredSkills.slice(0, 3).map(s => s.skill).join(', ');
    analysis += `Notable strengths: ${topPreferred}.`;
  }
  
  return analysis;
}

/**
 * Generate experience analysis section
 */
function generateExperienceAnalysis(score: ScoreResult, resume: ParsedResume): string {
  const experienceCount = resume.experience?.length || 0;
  
  let analysis = `Experience Score: ${score.experienceScore}%. `;
  
  if (score.experienceScore >= 75) {
    analysis += `Candidate has demonstrated ${experienceCount} relevant position(s) with strong alignment to job requirements. `;
    analysis += 'Work history shows progression and relevant expertise.';
  } else if (score.experienceScore >= 50) {
    analysis += `Candidate has ${experienceCount} position(s) with moderate relevance. `;
    analysis += 'Some experience gaps or limited direct applicability to this role.';
  } else {
    analysis += `Limited relevant experience detected (${experienceCount} position(s)). `;
    analysis += 'Consider if candidate can bridge experience gap through training or transferable skills.';
  }
  
  return analysis;
}

/**
 * Generate education analysis section
 */
function generateEducationAnalysis(score: ScoreResult, resume: ParsedResume): string {
  const educationCount = resume.education?.length || 0;
  
  let analysis = `Education Score: ${score.educationScore}%. `;
  
  if (score.educationScore >= 85) {
    analysis += `Strong educational background with ${educationCount} relevant qualification(s). `;
    analysis += 'Education aligns well with position requirements.';
  } else if (score.educationScore >= 60) {
    analysis += `Adequate educational background with ${educationCount} qualification(s). `;
    analysis += 'Education provides foundational knowledge for the role.';
  } else {
    analysis += `Educational background (${educationCount} qualification(s)) may not fully align with requirements. `;
    analysis += 'Consider if practical experience compensates for educational gaps.';
  }
  
  return analysis;
}

/**
 * Generate overall fit assessment
 */
function generateOverallFit(score: ScoreResult): string {
  if (score.overallScore >= 85) {
    return (
      'This candidate demonstrates exceptional fit for the position. ' +
      'Strong alignment across all evaluation criteria suggests a high probability of success. ' +
      'Recommend advancing to interview stage immediately.'
    );
  } else if (score.overallScore >= 70) {
    return (
      'This candidate shows strong potential for the role. ' +
      'Good match on most criteria with minor gaps that can be addressed through training or development. ' +
      'Recommend advancing to interview stage.'
    );
  } else if (score.overallScore >= 55) {
    return (
      'This candidate presents a moderate fit for the position. ' +
      'Some alignment exists, but notable gaps in required skills or experience. ' +
      'Consider for interview if candidate pool is limited or if specific strengths are highly valuable.'
    );
  } else if (score.overallScore >= 40) {
    return (
      'This candidate shows limited fit for the position. ' +
      'Significant gaps in required qualifications may impact job performance. ' +
      'Not recommended unless candidate demonstrates exceptional compensating factors.'
    );
  } else {
    return (
      'This candidate is not a good fit for the position. ' +
      'Substantial misalignment across evaluation criteria suggests low probability of success. ' +
      'Do not recommend advancing in the hiring process.'
    );
  }
}
