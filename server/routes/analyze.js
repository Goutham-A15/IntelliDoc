const express = require('express');
const { geminiModel } = require('../utils/geminiClient');
const { supabaseAdmin } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');
const { extractTextFromDocument } = require('../utils/textExtractor');

const router = express.Router();

const OPERATION_COST = 1; 

// POST /api/analyze/comparison
router.post('/comparison', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('credits')
      .eq('id', userId)   
      .single();  

    if (userError) throw new Error('User not found.');
    if (user.credits < OPERATION_COST) {
      return res.status(402).json({ error: "Insufficient credits to perform this operation." });
    }

    const { documentIds } = req.body;

    if (!documentIds || documentIds.length < 2) {
      return res.status(400).json({ error: "At least two document IDs are required." });
    }

    // Extract text from all documents
    const docResults = await Promise.all(
        documentIds.map(id => extractTextFromDocument(id, userId).then(text => ({id, text})))
    );

    const { data: docDetails, error: docDetailsError } = await supabaseAdmin
        .from('documents')
        .select('id, filename')
        .in('id', documentIds);
    
    if (docDetailsError) throw docDetailsError;

    const docNameMap = new Map(docDetails.map(d => [d.id, d.filename]));
    
    const documentsToAnalyze = docResults.map(doc => ({
        name: docNameMap.get(doc.id) || `doc-${doc.id}`,
        text: doc.text
    }));

    const documentsPromptBlock = documentsToAnalyze.map((doc, index) => 
`DOCUMENT ${index + 1} ("${doc.name}"):
---
${doc.text}
---
`
    ).join('\n');


    const prompt = `
      You are an expert document analyzer. Compare the following ${documentsToAnalyze.length} documents for contradictions among any or all of them.

      ${documentsPromptBlock}

      Return your findings as a valid JSON object with "summary" and "contradictions" keys.
      - "summary": A brief, one-paragraph summary of the overall consistency across all documents.
      - "contradictions": An array of objects. If you find a contradiction, each object MUST have:
        - "id": a unique string ID.
        - "explanation": a detailed explanation of why the statements contradict each other.
        - "severity": a rating of 'low', 'medium', or 'high'.
        - "sources": an array of at least two source objects, where each object has:
          - "documentName": the name of the document the statement came from.
          - "statement": the specific contradictory quote from the document.
      - **If there are NO contradictions, you MUST return an empty array for "contradictions": [].**
      
      Respond ONLY with the raw JSON object. Ensure all strings in the JSON are properly escaped.
    `;

    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();
    const analysisResult = JSON.parse(responseText.match(/\{[\s\S]*\}/)[0]);
    
    if (analysisResult) {
        await supabaseAdmin
            .from('documents')
            .update({ is_compared: true })
            .in('id', documentIds);
    }
    
    const newCredits = user.credits - OPERATION_COST;

    const { error: transactionError } = await supabaseAdmin.rpc('update_credits_and_log', {
      p_user_id: userId,
      p_credits_change: -OPERATION_COST,
      p_operation_name: 'Compare Documents',
      p_credits_used: OPERATION_COST
    });
    
    if(transactionError) {
        console.error("Credit deduction transaction failed:", transactionError);
    }

    const { error: jobError } = await supabaseAdmin
      .from('analysis_jobs')
      .insert({
        user_id: userId,
        status: 'completed',
        analysis_type: 'comparison',
        results: JSON.stringify(analysisResult),
        related_document_ids: documentIds,
        document_names: documentsToAnalyze.map(d => d.name)
      });

    if (jobError) console.error("Analysis job insert failed:", jobError);
    
    // --- NEW: Add Notification Logic ---
    const docNames = documentsToAnalyze.map(d => d.name).join(' & ');
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      category: 'report',
      title: 'Comparison Complete',
      description: `Your analysis of "${docNames}" is ready to view.`
    });

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