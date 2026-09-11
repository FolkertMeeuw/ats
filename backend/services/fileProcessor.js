const pdfParseModule = require("pdf-parse");
const fs = require("fs");

const extractTextFromFile = async (filePath, originalName) => {
  console.log("File path for text extraction:", filePath);

  if (!fs.existsSync(filePath)) {
    throw new Error("File not found");
  }

  console.log("Valid file path:", filePath);

  // Use pdf-parse for PDFs
  if (originalName.toLowerCase().endsWith(".pdf")) {
    console.log("Using pdf-parse for PDF extraction");
    const dataBuffer = fs.readFileSync(filePath);

    // Konvertierung in Uint8Array zur Kompatibilität mit pdfjs-dist / pdf-parse v2+
    const uint8ArrayData = new Uint8Array(dataBuffer.buffer, dataBuffer.byteOffset, dataBuffer.byteLength);

    let parsedResult = null;
    const target = pdfParseModule.default || pdfParseModule;

    if (typeof target === "function") {
      try {
        parsedResult = await target(uint8ArrayData);
      } catch (err) {
        if (err.message && err.message.includes("cannot be invoked without 'new'")) {
          const instance = new target(uint8ArrayData);
          parsedResult = typeof instance.then === "function" ? await instance : instance;
        } else {
          throw err;
        }
      }
    } else if (typeof pdfParseModule.PDFParse === "function") {
      const instance = new pdfParseModule.PDFParse(uint8ArrayData);
      parsedResult = typeof instance.then === "function" ? await instance : instance;
    } else if (typeof target === "object" && target !== null) {
      // Fallback für Objekt-Exporte mit getText/extract
      parsedResult = target;
    } else {
      throw new Error("pdf-parse Modul konnte nicht korrekt initialisiert werden.");
    }

    // Falls die Instanz selbst eine asynchrone getText()-Methode besitzt
    if (parsedResult && typeof parsedResult.getText === "function") {
      parsedResult = await parsedResult.getText();
    }

    // Extrahieren und Auflösen von eventuellen Promises im text-Property
    let extractedText = "";
    if (typeof parsedResult === "string") {
      extractedText = parsedResult;
    } else if (parsedResult && parsedResult.text) {
      extractedText = typeof parsedResult.text === "function"
        ? await parsedResult.text()
        : await parsedResult.text;
    } else if (parsedResult && typeof parsedResult === "object") {
      extractedText = parsedResult.text || parsedResult.content || "";
    }

    // Sicherstellen, dass ein sauberer String vorliegt
    extractedText = String(extractedText || "").trim();

    console.log("Extracted text length:", extractedText.length);
    return extractedText;
  }

  // Fallback for plain text files (.txt, .md, .csv, etc.)
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (error, text) => {
      if (error) {
        console.error("File read error:", error);
        return reject(new Error("Failed to extract text from file"));
      }

      const cleanText = text ? text.trim() : "";
      console.log("Full Extracted text length:", cleanText.length);
      resolve(cleanText);
    });
  });
};

module.exports = { extractTextFromFile };