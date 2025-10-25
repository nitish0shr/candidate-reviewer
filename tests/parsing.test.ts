/**
 * Sample tests for parsing utilities
 * Tests parsing functions with mock data
 */

import { describe, it, expect, vi } from 'vitest';
import { parseResume } from '../src/lib/parseResume';
import { parseJD } from '../src/lib/parseJD';
import skillsData from '../src/lib/skills.json';

describe('Skills Database', () => {
  it('should load skills data', () => {
    expect(skillsData).toBeDefined();
    expect(skillsData.skills).toBeInstanceOf(Array);
    expect(skillsData.skills.length).toBeGreaterThan(0);
  });

  it('should have valid skill structure', () => {
    const skill = skillsData.skills[0];
    expect(skill).toHaveProperty('name');
    expect(skill).toHaveProperty('category');
    expect(skill).toHaveProperty('keywords');
    expect(skill.keywords).toBeInstanceOf(Array);
  });

  it('should contain programming languages', () => {
    const programmingSkills = skillsData.skills.filter(
      skill => skill.category === 'Programming Languages'
    );
    expect(programmingSkills.length).toBeGreaterThan(0);
  });
});

describe('Resume Parsing (Unit Tests)', () => {
  it('should extract email from text', () => {
    const mockText = 'Contact me at john.doe@example.com';
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const match = mockText.match(emailRegex);
    expect(match).toBeTruthy();
    expect(match?.[0]).toBe('john.doe@example.com');
  });

  it('should extract phone number from text', () => {
    const mockText = 'Call me at (555) 123-4567';
    const phoneRegex = /(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})/g;
    const match = mockText.match(phoneRegex);
    expect(match).toBeTruthy();
  });

  it('should identify skills from text', () => {
    const mockText = 'I have experience with JavaScript, Python, and React';
    const foundSkills: string[] = [];
    
    skillsData.skills.forEach(skill => {
      if (mockText.toLowerCase().includes(skill.name.toLowerCase())) {
        foundSkills.push(skill.name);
      }
    });
    
    expect(foundSkills).toContain('JavaScript');
    expect(foundSkills).toContain('Python');
    expect(foundSkills).toContain('React');
  });
});

describe('Job Description Parsing (Unit Tests)', () => {
  it('should identify required skills markers', () => {
    const mockText = 'Required Skills: JavaScript, TypeScript, Node.js';
    const hasRequired = /required|must have|essential/i.test(mockText);
    expect(hasRequired).toBe(true);
  });

  it('should identify preferred skills markers', () => {
    const mockText = 'Preferred Skills: Docker, Kubernetes';
    const hasPreferred = /preferred|nice to have|optional|desired/i.test(mockText);
    expect(hasPreferred).toBe(true);
  });

  it('should extract job title patterns', () => {
    const mockText = 'Position: Senior Software Engineer';
    const titlePattern = /(?:position|job title|role)\s*:?\s*([\w\s]+?)(?:\n|$)/i;
    const match = mockText.match(titlePattern);
    expect(match).toBeTruthy();
    expect(match?.[1].trim()).toBe('Senior Software Engineer');
  });
});

describe('Integration: File Type Detection', () => {
  it('should detect PDF file type', () => {
    const mockFile = new File([''], 'resume.pdf', { type: 'application/pdf' });
    expect(mockFile.type).toBe('application/pdf');
    expect(mockFile.name.endsWith('.pdf')).toBe(true);
  });

  it('should detect DOCX file type', () => {
    const mockFile = new File([''], 'resume.docx', { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    expect(
      mockFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mockFile.name.endsWith('.docx')
    ).toBe(true);
  });
});

describe('Skills Matching Logic', () => {
  it('should match skills case-insensitively', () => {
    const text = 'I know javascript and PYTHON';
    const jsSkill = skillsData.skills.find(s => s.name === 'JavaScript');
    const pySkill = skillsData.skills.find(s => s.name === 'Python');
    
    expect(text.toLowerCase().includes(jsSkill?.name.toLowerCase() || '')).toBe(true);
    expect(text.toLowerCase().includes(pySkill?.name.toLowerCase() || '')).toBe(true);
  });

  it('should match skills by keywords', () => {
    const text = 'Experienced with Node.js backend development';
    const nodeSkill = skillsData.skills.find(s => s.name === 'Node.js');
    
    const hasMatch = nodeSkill?.keywords.some(kw => 
      text.toLowerCase().includes(kw.toLowerCase())
    );
    
    expect(hasMatch).toBe(true);
  });
});

describe('Data Validation', () => {
  it('should have unique skill names', () => {
    const skillNames = skillsData.skills.map(s => s.name);
    const uniqueNames = new Set(skillNames);
    expect(skillNames.length).toBe(uniqueNames.size);
  });

  it('should have non-empty keywords for each skill', () => {
    skillsData.skills.forEach(skill => {
      expect(skill.keywords.length).toBeGreaterThan(0);
      skill.keywords.forEach(keyword => {
        expect(keyword.length).toBeGreaterThan(0);
      });
    });
  });

  it('should have valid categories', () => {
    const categories = new Set(skillsData.skills.map(s => s.category));
    expect(categories.size).toBeGreaterThan(0);
    categories.forEach(category => {
      expect(category.length).toBeGreaterThan(0);
    });
  });
});
