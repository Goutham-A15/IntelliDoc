const express = require('express');
const { supabaseAdmin } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/history
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: jobs, error } = await supabaseAdmin
            .from('analysis_jobs')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Efficiently fetch all document names for the user
        const { data: documents } = await supabaseAdmin
            .from('documents')
            .select('id, filename')
            .eq('user_id', userId);
        
        const docNameMap = new Map(documents.map(doc => [doc.id, doc.filename]));

        // Add document names to each history item
        const history = jobs.map(job => ({
            ...job,
            document_names: job.related_document_ids?.map(id => docNameMap.get(id) || 'Deleted Document') || []
        }));

        res.json({ history });
    } catch (error) {
        console.error("[API] /history error:", error.message);
        res.status(500).json({ error: "Failed to fetch analysis history." });
    }
});

module.exports = router;