/**
 * Resume parsing utility
 * Extracts structured information from resume text
 */

import { ParsedResume } from '../types';
import { parsePdf, isPdf } from './parsePdf';
import { parseDocx, isDocx } from './parseDocx';
import skillsData from './skills.json';

/**
 * Parse a resume file and extract structured information
 * @param file - Resume file (PDF or DOCX)
 * @returns Promise with parsed resume data
 */
export async function parseResume(file: File): Promise<ParsedResume> {
  let rawText = '';
  
  // Extract text based on file type
  if (isPdf(file)) {
    const result = await parsePdf(file);
    rawText = result.text;
  } else if (isDocx(file)) {
    const result = await parseDocx(file);
    rawText = result.text;
  } else {
    throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
  }
  
  // Extract structured information
  const name = extractName(rawText);
  const email = extractEmail(rawText);
  const phone = extractPhone(rawText);
  const skills = extractSkills(rawText);
  const experience = extractExperience(rawText);
  const education = extractEducation(rawText);
  const sections = extractSections(rawText);
  
  return {
    rawText,
    name,
    email,
    phone,
    skills,
    experience,
    education,
    sections,
  };
}

/**
 * Extract candidate name from resume text
 * Assumes name is near the top of the resume
 */
function extractName(text: string): string | undefined {
  const lines = text.split('\n').filter(line => line.trim());
  // First non-empty line is usually the name
  const firstLine = lines[0]?.trim();
  if (firstLine && firstLine.length < 50 && /^[A-Za-z\s\.]+$/.test(firstLine)) {
    return firstLine;
  }
  return undefined;
}

/**
 * Extract email address from resume text
 */
function extractEmail(text: string): string | undefined {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex);
  return matches?.[0];
}

/**
 * Extract phone number from resume text
 */
function extractPhone(text: string): string | undefined {
  const phoneRegex = /(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})/g;
  const matches = text.match(phoneRegex);
  return matches?.[0];
}

/**
 * Extract skills from resume text using skills database
 */
function extractSkills(text: string): string[] {
  const lowerText = text.toLowerCase();
  const foundSkills = new Set<string>();
  
  // Check each skill and its keywords
  skillsData.skills.forEach(skill => {
    const skillName = skill.name.toLowerCase();
    
    // Check if skill name appears in text
    if (lowerText.includes(skillName)) {
      foundSkills.add(skill.name);
      return;
    }
    
    // Check if any keyword appears in text
    for (const keyword of skill.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        foundSkills.add(skill.name);
        break;
      }
    }
  });
  
  return Array.from(foundSkills);
}

/**
 * Extract experience entries from resume text
 */
function extractExperience(text: string): string[] {
  const experience: string[] = [];
  const experienceRegex = /(?:experience|work history|employment)(.*?)(?:education|skills|projects|$)/is;
  const match = text.match(experienceRegex);
  
  if (match) {
    const experienceText = match[1];
    // Split by common date patterns or job titles
    const entries = experienceText.split(/\n(?=\d{4}|\d{1,2}\/\d{4}|[A-Z][a-z]+ \d{4})/);
    experience.push(...entries.filter(e => e.trim().length > 20));
  }
  
  return experience;
}

/**
 * Extract education entries from resume text
 */
function extractEducation(text: string): string[] {
  const education: string[] = [];
  const educationRegex = /(?:education|academic)(.*?)(?:experience|skills|projects|$)/is;
  const match = text.match(educationRegex);
  
  if (match) {
    const educationText = match[1];
    // Split by common degree patterns
    const entries = educationText.split(/\n(?=Bachelor|Master|PhD|Associate|Diploma)/);
    education.push(...entries.filter(e => e.trim().length > 10));
  }
  
  return education;
}

/**
 * Extract major sections from resume
 */
function extractSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const sectionHeaders = [
    'summary', 'objective', 'experience', 'work history', 'employment',
    'education', 'skills', 'certifications', 'projects', 'awards',
    'publications', 'languages', 'interests'
  ];
  
  const lines = text.split('\n');
  let currentSection = '';
  let currentContent: string[] = [];
  
  lines.forEach(line => {
    const lowerLine = line.toLowerCase().trim();
    const matchedHeader = sectionHeaders.find(header => 
      lowerLine === header || lowerLine.startsWith(header + ':')
    );
    
    if (matchedHeader) {
      if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = matchedHeader;
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  });
  
  // Add last section
  if (currentSection && currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim();
  }
  
  return sections;
}
