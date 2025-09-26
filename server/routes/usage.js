const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { supabaseAdmin } = require('../config/supabaseClient');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get user data, including credits, subscription tier, and documents_uploaded count
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('credits, subscription_tier, documents_uploaded') // Corrected: Removed usage_limit
            .eq('id', userId)
            .single();

        if (userError) throw userError;

        // 2. Get the total count of operations from the log table
        const { count: operationsCount, error: countError } = await supabaseAdmin
            .from('operation_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (countError) throw countError;

        // 3. Send back all the data
        res.json({
            credits: userData.credits,
            subscription_tier: userData.subscription_tier,
            operations_performed: operationsCount || 0,
            documents_uploaded: userData.documents_uploaded || 0,
        });
    } catch (error) {
        console.error("Error in /api/usage:", error.message);
        res.status(500).json({ error: "Failed to fetch usage data." });
    }
});

module.exports = router;