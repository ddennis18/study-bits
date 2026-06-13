// Client-side PDF Text Extraction using CDN-loaded PDF.js

let loadingPromise: Promise<any> | null = null;

export function loadPdfJS(): Promise<any> {
  if ((window as any).pdfjsLib) {
    return Promise.resolve((window as any).pdfjsLib);
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    // 1. Inject CSS / style is not needed, but we need the main script:
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;

    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        // Configure worker CDN
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(pdfjsLib);
      } else {
        reject(new Error("pdfjsLib not found after script load."));
      }
    };

    script.onerror = () => {
      loadingPromise = null;
      reject(new Error("Failed to load PDF.js from CDN. Please check your network or paste text directly."));
    };

    document.head.appendChild(script);
  });

  return loadingPromise;
}

export async function extractTextFromPdf(file: File, onProgress?: (msg: string) => void): Promise<string> {
  onProgress?.("Initializing PDF.js reader...");
  const pdfjsLib = await loadPdfJS();

  const fileReader = new FileReader();

  return new Promise((resolve, reject) => {
    fileReader.onload = async (e) => {
      const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
      try {
        onProgress?.("Loading PDF document structure...");
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        let extractedText = "";
        const numPages = pdf.numPages;

        for (let i = 1; i <= numPages; i++) {
          onProgress?.(`Extracting text from page ${i} of ${numPages}...`);
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ");
          
          extractedText += pageText + "\n";
        }

        if (!extractedText.trim()) {
          reject(new Error("The PDF appears to be empty or contains scanned images without selectable text."));
        } else {
          resolve(extractedText);
        }
      } catch (err: any) {
        reject(new Error(`PDF parse error: ${err.message || err}`));
      }
    };

    fileReader.onerror = () => {
      reject(new Error("Error reading local PDF file buffer."));
    };

    fileReader.readAsArrayBuffer(file);
  });
}
