require('dotenv').config();

module.exports = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  port: process.env.PORT || 5001,
};