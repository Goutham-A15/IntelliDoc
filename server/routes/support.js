const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { supabaseAdmin } = require('../config/supabaseClient'); 
const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
    const { name, email, subject, message } = req.body;
    const userId = req.user.id;

    try {
        const { error } = await supabaseAdmin
            .from('support_tickets')
            .insert({
                user_id: userId,
                name: name,
                email: email,
                subject: subject,
                message: message,
                status: 'open'
            });

        if (error) {
            throw error;
        }

        res.status(200).json({ message: 'Support ticket submitted successfully.' });

    } catch (error) {
        console.error("Support ticket submission error:", error);
        res.status(500).json({ error: "Failed to submit support ticket." });
    }
});

module.exports = router;