/**
 * Job Description parsing utility
 * Extracts structured information from job description text
 */

import { ParsedJD } from '../types';
import { parsePdf, isPdf } from './parsePdf';
import { parseDocx, isDocx } from './parseDocx';
import skillsData from './skills.json';

/**
 * Parse a job description file and extract structured information
 * @param file - Job description file (PDF or DOCX)
 * @returns Promise with parsed job description data
 */
export async function parseJD(file: File): Promise<ParsedJD> {
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
  const title = extractJobTitle(rawText);
  const company = extractCompany(rawText);
  const { requiredSkills, preferredSkills } = extractSkills(rawText);
  const responsibilities = extractResponsibilities(rawText);
  const qualifications = extractQualifications(rawText);
  const sections = extractSections(rawText);
  
  return {
    rawText,
    title,
    company,
    requiredSkills,
    preferredSkills,
    responsibilities,
    qualifications,
    sections,
  };
}

/**
 * Extract job title from job description text
 * Looks for common title patterns at the top of the document
 */
function extractJobTitle(text: string): string | undefined {
  const titlePatterns = [
    /(?:position|job title|role)\s*:?\s*([\w\s]+?)(?:\n|$)/i,
    /^([\w\s]+(?:Engineer|Developer|Manager|Analyst|Designer|Architect|Lead|Director|Specialist|Consultant))$/im,
  ];
  
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  // Fallback: assume first line is the title
  const lines = text.split('\n').filter(line => line.trim());
  const firstLine = lines[0]?.trim();
  if (firstLine && firstLine.length < 100) {
    return firstLine;
  }
  
  return undefined;
}

/**
 * Extract company name from job description text
 */
function extractCompany(text: string): string | undefined {
  const companyPatterns = [
    /(?:company|organization)\s*:?\s*([\w\s&.,]+?)(?:\n|$)/i,
    /at\s+([A-Z][\w\s&.,]+?)(?:\s+is|\s+seeks|\n)/,
  ];
  
  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return undefined;
}

/**
 * Extract required and preferred skills from job description
 */
function extractSkills(text: string): { requiredSkills: string[]; preferredSkills: string[] } {
  const lowerText = text.toLowerCase();
  const requiredSkills = new Set<string>();
  const preferredSkills = new Set<string>();
  
  // Find required skills section
  const requiredMatch = text.match(/(?:required|must have|essential)(?:\s+skills)?:?(.*?)(?:preferred|nice to have|optional|responsibilities|qualifications|$)/is);
  const requiredText = requiredMatch ? requiredMatch[1].toLowerCase() : lowerText;
  
  // Find preferred skills section
  const preferredMatch = text.match(/(?:preferred|nice to have|optional|desired)(?:\s+skills)?:?(.*?)(?:responsibilities|qualifications|$)/is);
  const preferredText = preferredMatch ? preferredMatch[1].toLowerCase() : '';
  
  // Check each skill against the text
  skillsData.skills.forEach(skill => {
    const skillName = skill.name.toLowerCase();
    const hasSkill = {
      required: requiredText.includes(skillName) || skill.keywords.some(kw => requiredText.includes(kw.toLowerCase())),
      preferred: preferredText.includes(skillName) || skill.keywords.some(kw => preferredText.includes(kw.toLowerCase())),
    };
    
    if (hasSkill.required) {
      requiredSkills.add(skill.name);
    } else if (hasSkill.preferred || lowerText.includes(skillName)) {
      preferredSkills.add(skill.name);
    }
  });
  
  return {
    requiredSkills: Array.from(requiredSkills),
    preferredSkills: Array.from(preferredSkills),
  };
}

/**
 * Extract responsibilities from job description
 */
function extractResponsibilities(text: string): string[] {
  const responsibilities: string[] = [];
  const responsibilitiesMatch = text.match(/(?:responsibilities|duties|what you'll do):?(.*?)(?:qualifications|requirements|skills|$)/is);
  
  if (responsibilitiesMatch) {
    const responsibilitiesText = responsibilitiesMatch[1];
    // Split by bullet points or numbered lists
    const items = responsibilitiesText.split(/\n\s*[-•*]\s*|\n\s*\d+\.\s*/);
    responsibilities.push(...items.filter(item => item.trim().length > 10).map(item => item.trim()));
  }
  
  return responsibilities;
}

/**
 * Extract qualifications from job description
 */
function extractQualifications(text: string): string[] {
  const qualifications: string[] = [];
  const qualificationsMatch = text.match(/(?:qualifications|requirements|what we're looking for):?(.*?)(?:responsibilities|benefits|about|$)/is);
  
  if (qualificationsMatch) {
    const qualificationsText = qualificationsMatch[1];
    // Split by bullet points or numbered lists
    const items = qualificationsText.split(/\n\s*[-•*]\s*|\n\s*\d+\.\s*/);
    qualifications.push(...items.filter(item => item.trim().length > 10).map(item => item.trim()));
  }
  
  return qualifications;
}

/**
 * Extract major sections from job description
 */
function extractSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const sectionHeaders = [
    'about', 'company', 'role', 'position', 'responsibilities', 'duties',
    'qualifications', 'requirements', 'skills', 'experience', 'education',
    'benefits', 'perks', 'what we offer', 'location', 'salary', 'compensation'
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
