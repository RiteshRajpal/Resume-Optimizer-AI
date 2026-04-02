// src/lib/parsers.js
// ─────────────────────────────────────────────────────────────────────────────
// Browser-based text extraction from PDF and DOCX files
// Uses: pdf.js (loaded from CDN) + mammoth.js (loaded from CDN)
// ─────────────────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = 10;

/**
 * Validate uploaded file
 * @param {File} file
 */
function validateFile(file) {
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_FILE_SIZE_MB) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
  }
  const name = file.name.toLowerCase();
  if (!name.endsWith('.pdf') && !name.endsWith('.docx') && !name.endsWith('.doc')) {
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
  }
}

/**
 * Extract text from a PDF file using pdf.js
 * @param {File} file
 * @returns {Promise<string>}
 */
async function extractPDFText(file) {
  if (!window.pdfjsLib) {
    throw new Error('PDF parser not loaded. Please refresh and try again.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Reconstruct text with spacing preserved
    let lastY = null;
    let pageText = '';
    for (const item of textContent.items) {
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
        pageText += '\n';
      }
      pageText += item.str + ' ';
      lastY = item.transform[5];
    }
    fullText += pageText.trim() + '\n\n';
  }

  const cleaned = fullText
    .replace(/\s{3,}/g, '  ')     // collapse excessive spaces
    .replace(/\n{4,}/g, '\n\n\n') // max 3 consecutive newlines
    .trim();

  if (!cleaned) throw new Error('Could not extract text from PDF. The file may be scanned or image-only.');
  return cleaned;
}

/**
 * Extract text from a DOCX file using mammoth.js
 * @param {File} file
 * @returns {Promise<string>}
 */
async function extractDOCXText(file) {
  if (!window.mammoth) {
    throw new Error('DOCX parser not loaded. Please refresh and try again.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer });

  if (result.messages?.length) {
    console.warn('DOCX parse warnings:', result.messages);
  }

  const text = result.value?.trim();
  if (!text) throw new Error('Could not extract text from DOCX. The file may be empty or corrupted.');
  return text;
}

/**
 * Extract text from any supported resume file
 * @param {File} file - PDF or DOCX
 * @returns {Promise<string>}
 */
export async function extractFileText(file) {
  validateFile(file);
  
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) {
    return extractPDFText(file);
  } else {
    return extractDOCXText(file);
  }
}

/**
 * Load CDN scripts for pdf.js and mammoth.js
 * Call this early (e.g., in App.jsx useEffect)
 */
export function loadParsers() {
  const scripts = [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
      onload: () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
      }
    },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js' },
  ];

  scripts.forEach(({ src, onload }) => {
    if (document.querySelector(`script[src="${src}"]`)) return;
    const s = document.createElement('script');
    s.src = src;
    if (onload) s.onload = onload;
    document.head.appendChild(s);
  });
}
