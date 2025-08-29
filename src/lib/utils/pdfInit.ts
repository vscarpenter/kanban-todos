// PDF.js initialization utilities
let pdfjs: typeof import('pdfjs-dist') | null = null;

export async function initializePDFJS() {
  if (pdfjs) return pdfjs;
  
  if (typeof window === 'undefined') {
    throw new Error('PDF.js can only be initialized on the client side');
  }
  
  try {
    // Dynamic import of PDF.js
    pdfjs = await import('pdfjs-dist');
    
    // Configure the worker source for PDF.js
    // Use the CDN version that matches our installed version (5.4.54)
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.worker.min.mjs`;
    
    return pdfjs;
  } catch (error) {
    console.error('Failed to initialize PDF.js:', error);
    throw error;
  }
}

export function isPDFJSInitialized(): boolean {
  return pdfjs !== null;
}