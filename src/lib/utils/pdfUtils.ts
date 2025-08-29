import { initializePDFJS } from './pdfInit';

// Initialize PDF.js only on client side
const initPdfjs = async () => {
  if (typeof window === 'undefined') return null;
  return await initializePDFJS();
};

export interface PDFThumbnailOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  page?: number; // Which page to render (1-based)
}

export interface PDFMetadata {
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

/**
 * Extract metadata from a PDF file
 */
export async function extractPDFMetadata(file: File): Promise<PDFMetadata> {
  const pdfjs = await initPdfjs();
  if (!pdfjs) throw new Error('PDF.js not available in server environment');

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    const metadata: PDFMetadata = {
      pageCount: pdf.numPages
    };

    // Try to get document info
    try {
      const info = await pdf.getMetadata();
      if (info.info) {
        const pdfInfo = info.info as Record<string, unknown>;
        metadata.title = (pdfInfo.Title as string) || undefined;
        metadata.author = (pdfInfo.Author as string) || undefined;
        metadata.subject = (pdfInfo.Subject as string) || undefined;
        metadata.creator = (pdfInfo.Creator as string) || undefined;
        metadata.producer = (pdfInfo.Producer as string) || undefined;
        
        if (pdfInfo.CreationDate) {
          metadata.creationDate = new Date(pdfInfo.CreationDate as string);
        }
        if (pdfInfo.ModDate) {
          metadata.modificationDate = new Date(pdfInfo.ModDate as string);
        }
      }
    } catch (metaError) {
      console.warn('Could not extract PDF metadata:', metaError);
    }

    // Clean up
    pdf.destroy();
    
    return metadata;
  } catch (error) {
    console.error('Error extracting PDF metadata:', error);
    throw new Error('Failed to extract PDF metadata');
  }
}

/**
 * Generate a thumbnail from a PDF file
 */
export async function generatePDFThumbnail(
  file: File, 
  options: PDFThumbnailOptions = {}
): Promise<string> {
  const pdfjs = await initPdfjs();
  if (!pdfjs) throw new Error('PDF.js not available in server environment');

  const {
    maxWidth = 150,
    maxHeight = 200,
    quality = 0.8,
    page = 1
  } = options;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    if (page > pdf.numPages || page < 1) {
      throw new Error(`Invalid page number: ${page}. PDF has ${pdf.numPages} pages.`);
    }

    // Get the first page (or specified page)
    const pdfPage = await pdf.getPage(page);
    
    // Calculate scale to fit within max dimensions
    const viewport = pdfPage.getViewport({ scale: 1 });
    const scaleX = maxWidth / viewport.width;
    const scaleY = maxHeight / viewport.height;
    const scale = Math.min(scaleX, scaleY);
    
    const scaledViewport = pdfPage.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get canvas context');
    }

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    // Render page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport,
      canvas: canvas,
    };

    await pdfPage.render(renderContext).promise;

    // Convert canvas to base64 with specified quality
    const thumbnailDataUrl = canvas.toDataURL('image/jpeg', quality);
    
    // Clean up
    pdfPage.cleanup();
    pdf.destroy();
    
    // Check size limit (should be under 10KB as per attachment spec)
    const sizeEstimate = (thumbnailDataUrl.length * 3) / 4; // rough base64 size estimate
    if (sizeEstimate > 10000) { // 10KB
      console.warn('PDF thumbnail is larger than 10KB, reducing quality');
      // Recursively reduce quality if too large
      if (quality > 0.3) {
        return generatePDFThumbnail(file, { ...options, quality: quality - 0.2 });
      }
    }
    
    return thumbnailDataUrl;
  } catch (error) {
    console.error('Error generating PDF thumbnail:', error);
    throw new Error('Failed to generate PDF thumbnail');
  }
}

/**
 * Generate both thumbnail and metadata for a PDF file
 */
export async function processPDFFile(
  file: File,
  thumbnailOptions?: PDFThumbnailOptions
): Promise<{
  thumbnail: string;
  metadata: PDFMetadata;
}> {
  try {
    // Process both in parallel for better performance
    const [thumbnail, metadata] = await Promise.all([
      generatePDFThumbnail(file, thumbnailOptions),
      extractPDFMetadata(file)
    ]);

    return { thumbnail, metadata };
  } catch (error) {
    console.error('Error processing PDF file:', error);
    throw error;
  }
}

/**
 * Check if PDF processing is supported in current environment
 */
export function isPDFProcessingSupported(): boolean {
  try {
    return typeof window !== 'undefined' && 
           typeof document !== 'undefined' && 
           !!document.createElement('canvas').getContext('2d');
  } catch {
    return false;
  }
}

/**
 * Validate PDF file before processing
 */
export async function validatePDFFile(file: File): Promise<{
  isValid: boolean;
  error?: string;
  pageCount?: number;
}> {
  const pdfjs = await initPdfjs();
  if (!pdfjs) {
    return { isValid: true }; // Allow validation to pass on server side
  }

  try {
    if (file.type !== 'application/pdf') {
      return { isValid: false, error: 'File is not a PDF' };
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      return { isValid: false, error: 'PDF file is too large (max 50MB)' };
    }

    // Try to load the PDF to validate it
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;
    
    pdf.destroy();
    
    if (pageCount === 0) {
      return { isValid: false, error: 'PDF has no pages' };
    }

    return { isValid: true, pageCount };
  } catch (error) {
    return { 
      isValid: false, 
      error: `Invalid PDF file: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}