const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { supabaseAdmin } = require('../config/supabaseClient');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get user data (this is for the 'Document Analyses' count)
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('usage_count, usage_limit, subscription_tier')
            .eq('id', userId)
            .single();

        if (userError) throw userError;

        // --- FIX: Correctly count the total number of documents uploaded ---
        // This performs a live count on the documents table for the current user.
        const { count: totalDocuments, error: documentsError } = await supabaseAdmin
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
        
        if (documentsError) throw documentsError;
        // --- END FIX ---

        // (The reports count logic is kept for future use)
        const { count: reportsGenerated, error: reportsError } = await supabaseAdmin
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (reportsError) console.error("Error counting reports:", reportsError.message);

        res.json({
            current_usage: userData.usage_count, // This is now ONLY for Document Analyses
            usage_limit: userData.usage_limit,
            subscription_tier: userData.subscription_tier,
            documents_this_month: totalDocuments || 0, // This is the new, correct count for uploaded docs
            reports_generated: reportsGenerated || 0,
        });
    } catch (error) {
        console.error("Error in /api/usage:", error.message);
        res.status(500).json({ error: "Failed to fetch usage data." });
    }
});

module.exports = router;