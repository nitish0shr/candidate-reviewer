/**
 * Backend-free DOCX parsing utility using mammoth.js
 * Extracts text content from DOCX files in the browser
 */

import mammoth from 'mammoth';

export interface DocxParseResult {
  text: string;
  html?: string;
  messages?: any[];
}

/**
 * Parse a DOCX file and extract text content
 * @param file - DOCX file to parse
 * @returns Promise with extracted text and HTML
 */
export async function parseDocx(file: File): Promise<DocxParseResult> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract text using mammoth
    const textResult = await mammoth.extractRawText({ arrayBuffer });
    
    // Optionally extract HTML for better formatting
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
    
    return {
      text: textResult.value,
      html: htmlResult.value,
      messages: [...textResult.messages, ...htmlResult.messages],
    };
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate if a file is a DOCX
 * @param file - File to validate
 * @returns True if file is a DOCX
 */
export function isDocx(file: File): boolean {
  return (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.toLowerCase().endsWith('.docx')
  );
}
