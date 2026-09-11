const { OpenAI } = require("openai");
const { openaiApiKey } = require("../config/config");

let openaiClient = null;

const getOpenAIClient = () => {
  if (!openaiClient) {
    if (!openaiApiKey) {
      throw new Error("OpenAI API Key ist nicht konfiguriert.");
    }
    openaiClient = new OpenAI({ apiKey: openaiApiKey });
  }
  return openaiClient;
};

/**
 * Extract keywords from text using OpenAI.
 * @param {string|object} textInput - The input text or an object containing a text property.
 * @returns {Promise<string[]>} - Extracted keywords as an array.
 */
const extractKeywords = async (textInput) => {
  // Ensure text is always a primitive string
  const text = typeof textInput === "string"
    ? textInput
    : (textInput && typeof textInput.text === "string" ? textInput.text : String(textInput || ""));

  console.log("Processing text for keyword extraction length:", text.length);

  // Validate input text
  if (!text || text.trim().length === 0) {
    console.error("No valid text provided for keyword extraction.");
    throw new Error("Input text is empty or invalid.");
  }

  try {
    const prompt = `Extract the most relevant and specific keywords from the following text. Focus on:
    - Technical skills (e.g., programming languages, frameworks, tools).
    - Professional achievements (e.g., projects, leadership roles, metrics-driven accomplishments).
    - Senior-level experience indicators (e.g., team management, strategic decision-making, architecture design).
    - Certifications, advanced degrees, and professional memberships.
    Return a comma-separated list of keywords:\n\n${text}`;

    console.log("OpenAI Prompt sent successfully");

    const openai = getOpenAIClient();

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
    });

    console.log("Response received from OpenAI");

    // Extract and process keywords
    const keywords = response.choices[0].message.content
      .trim()
      .split(",")
      .map((keyword) => keyword.trim());

    console.log("Extracted Keywords:", keywords);
    return keywords;
  } catch (error) {
    console.error("Error during keyword extraction:", error.response?.data || error.message);
    throw new Error("Failed to extract keywords using OpenAI.");
  }
};

module.exports = extractKeywords;