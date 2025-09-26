const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const geminiModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-8b-latest",
  generationConfig: {
    temperature: 0.1,
    topK: 32,
    topP: 0.95,
    maxOutputTokens: 8192,
  },
});

module.exports = { geminiModel };