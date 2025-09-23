const express = require('express');
const { geminiModel } = require('../utils/geminiClient');
const { extractTextFromDocument } = require('../utils/textExtractor');
const { supabaseAdmin } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// --- NEW HELPER FUNCTION: Adds a delay ---
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// POST /api/analyze (for single documents)
// POST /api/analyze/comparison
// POST /api/analyze/comparison
router.post('/comparison', authMiddleware, async (req, res) => {
  try {
    const { document1, document2, documentIds } = req.body;
    const userId = req.user.id;

    if (!document1?.text || !document2?.text || !documentIds || documentIds.length !== 2) {
      return res.status(400).json({ error: "Two documents with text and IDs are required." });
    }

    const prompt = `
      You are an expert document analyzer. Compare DOCUMENT 1 ("${document1.name}") and DOCUMENT 2 ("${document2.name}") for contradictions.

      DOCUMENT 1:
      ---
      ${document1.text}
      ---

      DOCUMENT 2:
      ---
      ${document2.text}
      ---

      Return your findings as a valid JSON object with "summary" and "contradictions" keys.
      - "summary": A brief, one-paragraph summary. If consistent, state that.
      - "contradictions": An array of objects. If you find a contradiction, each object MUST have non-empty string properties: "id", "statement1", "statement2", "explanation", and a "severity" of 'low', 'medium', or 'high'.
      - **If there are NO contradictions, you MUST return an empty array: [].**
      
      Respond ONLY with the raw JSON object. Ensure all strings in the JSON are properly escaped.
    `;
    
    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();
    
    // --- FIX: Robust JSON Cleaning and Parsing ---
    const jsonStringMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonStringMatch) {
      throw new Error("AI did not return a valid JSON object.");
    }
    const jsonString = jsonStringMatch[0];
    const analysisResult = JSON.parse(jsonString);
    // --- END FIX ---

    // Filter out any malformed contradiction objects from the AI
    if (analysisResult.contradictions && Array.isArray(analysisResult.contradictions)) {
        analysisResult.contradictions = analysisResult.contradictions.filter(c => 
            c.statement1 && c.statement2 && c.explanation
        );
    }
    
    // Save the successful analysis to the database for history
    await supabaseAdmin
      .from('analysis_jobs')
      .insert({
        user_id: userId,
        status: 'completed',
        analysis_type: 'comparison',
        results: analysisResult,
        related_document_ids: documentIds 
      });

    // Increment usage count by 1 ONLY after a successful analysis and save
    await supabaseAdmin.rpc('increment_usage', { user_id_in: userId, increment_value: 1 });
    
    res.json(analysisResult);

  } catch (error) {
    console.error("[API] /analyze/comparison error:", error.message);
    res.status(500).json({ error: "AI comparison failed due to an internal error." });
  }
});


// GET /api/analysis/:jobId
router.get('/:jobId', authMiddleware, async (req, res) => {
    try {
        const { jobId } = req.params;
        const { data: analysisJob, error } = await supabaseAdmin
            .from("analysis_jobs")
            .select(`*, documents (*)`)
            .eq("id", jobId)
            .eq("user_id", req.user.id)
            .single();

        if (error || !analysisJob) {
            return res.status(404).json({ error: "Analysis job not found" });
        }

        res.json({ analysisJob });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});


module.exports = router;