const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/checkout', authMiddleware, async (req, res) => {
    // Mock checkout logic
    const { planId } = req.body;
    res.json({ checkoutUrl: `/billing/checkout-success?plan=${planId}&session_id=cs_mock_${Date.now()}` });
});

module.exports = router;