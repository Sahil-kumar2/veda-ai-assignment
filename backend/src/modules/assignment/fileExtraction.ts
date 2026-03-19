export interface ExtractedReferenceMaterial {
  fileName: string;
  mimeType: string;
  size: number;
  extractedText: string;
}

const MAX_TEXT_PER_FILE = 3500;

const cleanText = (text: string): string =>
  text
    .replace(/\r/g, " ")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractTextFromPdfBuffer = (buffer: Buffer): string => {
  const latin = buffer.toString("latin1");
  const chunks = latin.match(/[A-Za-z0-9 ,.;:()\-_/]{6,}/g) ?? [];
  return cleanText(chunks.join(" "));
};

const extractTextFromBuffer = (file: Express.Multer.File): string => {
  const mime = file.mimetype;

  if (
    mime.startsWith("text/") ||
    mime === "application/json"
  ) {
    return cleanText(file.buffer.toString("utf8"));
  }

  if (mime === "application/pdf") {
    return extractTextFromPdfBuffer(file.buffer);
  }

  if (mime.startsWith("image/")) {
    return `[Image uploaded: ${file.originalname}].`;
  }

  if (
    mime === "application/msword" ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return `[Document uploaded: ${file.originalname}].`;
  }

  return "";
};

export const extractReferenceMaterials = (
  files: Express.Multer.File[]
): ExtractedReferenceMaterial[] => {
  return files
    .map((file) => {
      const extractedText = extractTextFromBuffer(file).slice(0, MAX_TEXT_PER_FILE);
      return {
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        extractedText,
      };
    })
    .filter((item) => item.extractedText.length > 0);
};

