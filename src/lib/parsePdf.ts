/**
 * Backend-free PDF parsing utility using pdf.js
 * Extracts text content from PDF files in the browser
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export interface PdfParseResult {
  text: string;
  numPages: number;
  metadata?: Record<string, any>;
}

/**
 * Parse a PDF file and extract all text content
 * @param file - PDF file to parse
 * @returns Promise with extracted text and metadata
 */
export async function parsePdf(file: File): Promise<PdfParseResult> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const numPages = pdf.numPages;
    const textParts: string[] = [];
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items from the page
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      textParts.push(pageText);
    }
    
    // Get metadata
    const metadata = await pdf.getMetadata();
    
    return {
      text: textParts.join('\n\n'),
      numPages,
      metadata: metadata.info as Record<string, any>,
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate if a file is a PDF
 * @param file - File to validate
 * @returns True if file is a PDF
 */
export function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
