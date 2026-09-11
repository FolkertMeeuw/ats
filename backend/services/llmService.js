const axios = require("axios");
const { OpenAI } = require("openai");
const { openaiApiKey } = require("../config/config");

const provider = (process.env.LLM_PROVIDER || "ollama").toLowerCase();
const model = process.env.LLM_MODEL || (provider === "ollama" ? "llama3.2" : "gpt-4o-mini");

let openaiClient = null;

if (provider === "openai") {
  if (!openaiApiKey) {
    console.error("OpenAI API Key is missing.");
  } else {
    openaiClient = new OpenAI({ apiKey: openaiApiKey });
    console.log("OpenAI client initialized successfully");
  }
}

console.log(`LLM Service aktiv: Provider=${provider}, Model=${model}`);

const extractWithOllama = async (prompt) => {
  const response = await axios.post("http://localhost:11434/api/generate", {
    model: model,
    prompt: prompt,
    stream: false,
  });
  return response.data?.response || "";
};

const extractWithOpenAI = async (prompt) => {
  if (!openaiClient) {
    throw new Error("OpenAI Client nicht initialisiert. API-Key fehlt.");
  }
  const response = await openaiClient.chat.completions.create({
    model: model,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 150,
  });
  return response.choices[0]?.message?.content || "";
};

const extractKeywords = async (textInput) => {
  const text = typeof textInput === "string"
    ? textInput
    : (textInput && typeof textInput.text === "string" ? textInput.text : String(textInput || ""));

  if (!text || text.trim().length === 0) {
    throw new Error("Input text is empty or invalid.");
  }

  const prompt = `Extract the most relevant and specific keywords from the following text. Focus on:
  - Technical skills (e.g., programming languages, frameworks, tools).
  - Professional achievements (e.g., projects, leadership roles, metrics-driven accomplishments).
  - Senior-level experience indicators (e.g., team management, strategic decision-making, architecture design).
  - Certifications, advanced degrees, and professional memberships.
  Return ONLY a comma-separated list of keywords. Do not include any intro, outro, or conversational text:\n\n${text}`;

  let responseText = "";
  if (provider === "openai") {
    console.log(`Verwende OpenAI (${model})...`);
    responseText = await extractWithOpenAI(prompt);
  } else {
    console.log(`Verwende Ollama (${model})...`);
    responseText = await extractWithOllama(prompt);
  }

  return responseText
    .trim()
    .split(",")
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
};

module.exports = extractKeywords;