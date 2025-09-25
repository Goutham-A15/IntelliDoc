const express = require('express');
const { supabaseAdmin } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ notifications: data || [] });
  } catch (err) {
    console.error("[API] /notifications GET error:", err);
    res.status(500).json({ error: "Failed to fetch notifications." });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    res.status(204).send(); // 204 No Content is standard for a successful delete
  } catch (err) {
    console.error("[API] /notifications DELETE error:", err);
    res.status(500).json({ error: "Failed to delete notification." });
  }
});

module.exports = router;