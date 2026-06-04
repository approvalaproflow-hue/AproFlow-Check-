import heic2any from "heic2any";

/**
 * Validates, converts (if HEIC), and compresses images to JPEG format.
 * Returns the resolved file name and base64 encoded data URL string.
 */
export async function processAndValidateFile(file: File): Promise<{ name: string; content: string }> {
  const name = file.name;
  const ext = name.split(".").pop()?.toLowerCase();
  
  // Validate file types: PDF, PNG, JPG, JPEG, WEBP, HEIC, HEIF
  const allowedExtensions = ["pdf", "png", "jpg", "jpeg", "webp", "heic", "heif"];
  if (!ext || !allowedExtensions.includes(ext)) {
    throw new Error(`Unsupported file type: .${ext}. Please upload a PDF, PNG, JPG, JPEG, WEBP, or HEIC file.`);
  }

  // File size limit (15MB for raw capture, but we compress images to < 300KB)
  const maxSize = 15 * 1024 * 1024; // 15MB
  if (file.size > maxSize) {
    throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed limit is 15MB.`);
  }

  let processedFile: File | Blob = file;
  let finalName = name;

  // Convert Apple HEIC/HEIF files to standard high-compatibility JPEG
  if (ext === "heic" || ext === "heif") {
    try {
      const convertResponse = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.8
      });
      const resultBlob = Array.isArray(convertResponse) ? convertResponse[0] : convertResponse;
      
      // Generate a new JPG file name
      const cleanName = finalName.replace(/\.(heic|heif)$/i, "");
      finalName = `${cleanName}.jpg`;
      
      processedFile = new File([resultBlob], finalName, {
        type: "image/jpeg"
      });
    } catch (err: any) {
      console.error("HEIC conversion failed:", err);
      throw new Error(`Failed to convert Apple HEIC image: ${err.message || err}.`);
    }
  }

  // Standard FileReader for PDF documents
  if (processedFile.type === "application/pdf" || finalName.toLowerCase().endsWith(".pdf")) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === "string") {
          resolve({ name: finalName, content: e.target.result });
        } else {
          reject(new Error("Failed to read PDF file format."));
        }
      };
      reader.onerror = () => reject(new Error("Error reading PDF file."));
      reader.readAsDataURL(processedFile);
    });
  }

  // Load and compress image format (PNG, JPEG, WEBP, JPG) using HTML5 canvas
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Downscale high-resolution mobile camera pictures (limit to max 1600px width/height)
          const MAX_DIM = 1600;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            throw new Error("Could not construct 2D context on utility canvas.");
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Compress to standard JPEG with 0.8 quality factor (reduces file size drastically to ~150KB while retaining crisp readability)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          resolve({ name: finalName, content: dataUrl });
        } catch (err: any) {
          reject(err);
        }
      };
      img.onerror = () => {
        reject(new Error("Unable to parse image data. Please ensure it is a valid image."));
      };
      
      if (typeof e.target?.result === "string") {
        img.src = e.target.result;
      } else {
        reject(new Error("Failed to load image as DataURL."));
      }
    };
    reader.onerror = () => reject(new Error("FileReader failed to process picture."));
    reader.readAsDataURL(processedFile);
  });
}
