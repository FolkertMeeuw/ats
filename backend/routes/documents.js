const express = require('express');
const extractKeywords = require("../services/llmService");
const findSoftMatches = require('../services/softMatchingService');

const router = express.Router();

router.post("/process", async (req, res) => {
  const { fileId, fileText } = req.body;

  if (!fileText) {
    console.error("No text provided for processing");
    return res.status(400).json({ error: "No text provided for processing" });
  }

  try {
    // Extract keywords using LLM service
    const keywords = await extractKeywords(fileText);
    console.log("Extracted Keywords:", keywords);

    res.json({
      message: `Document with ID ${fileId} processed successfully.`,
      keywords,
      fileId,
    });
  } catch (error) {
    console.error("Error processing document:", error.message);
    res.status(500).json({ error: "Failed to process the document" });
  }
});

router.post('/match', async (req, res) => {
  const { resumeKeywords, jobKeywords } = req.body;

  // Validate input
  if (!Array.isArray(resumeKeywords) || !Array.isArray(jobKeywords)) {
    return res.status(400).json({ error: "Both resumeKeywords and jobKeywords must be arrays." });
  }

  try {
    // Perform soft matching
    const softMatches = await findSoftMatches(resumeKeywords, jobKeywords);
    console.log("Soft Matches:", softMatches);

    // Respond with matches
    res.json({
      message: "Matching completed successfully.",
      softMatches,
    });
  } catch (error) {
    console.error("Error during matching:", error.message);
    res.status(500).json({ error: "Failed to perform matching." });
  }
});

module.exports = router;