const express = require('express');
const { supabaseAdmin } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/history
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // fetch completed comparison jobs for this user
    const { data: jobs, error } = await supabaseAdmin
      .from('analysis_jobs')
      .select('id, created_at, status, analysis_type, related_document_ids, results, document_names')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .eq('analysis_type', 'comparison')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[API] /history - supabase error:", error);
      return res.status(500).json({ error: "Failed to fetch analysis jobs." });
    }

    const jobsArray = jobs || [];

    // collect referenced document ids across all jobs
    const referencedIds = Array.from(
      new Set(jobsArray.flatMap((j) => j.related_document_ids || []))
    );

    let documents = [];
    if (referencedIds.length > 0) {
      const { data: docsData, error: docsErr } = await supabaseAdmin
        .from('documents')
        .select('id, filename')
        .in('id', referencedIds);

      if (docsErr) {
        console.error("[API] /history - documents fetch error:", docsErr);
        // don't fail everything; continue with empty doc list
      } else {
        documents = docsData || [];
      }
    }

    const docNameMap = new Map((documents || []).map((d) => [d.id, d.filename]));

    // normalize jobs: parse results if needed, map document names
    const history = jobsArray.map((job) => {
      let results = job.results;
      if (typeof results === "string") {
        try {
          results = JSON.parse(results);
        } catch (e) {
          results = { summary: String(results || ""), contradictions: [] };
        }
      }
      if (!results) results = { summary: "", contradictions: [] };
      if (!Array.isArray(results.contradictions)) results.contradictions = [];

      const document_names =
        job.document_names ||
        (Array.isArray(job.related_document_ids)
          ? job.related_document_ids.map((id) => docNameMap.get(id) || "Deleted Document")
          : []);

      return {
        id: job.id,
        created_at: job.created_at,
        document_names,
        results,
      };
    });

    res.json({ history });
  } catch (err) {
    console.error("[API] /history error:", err);
    res.status(500).json({ error: "Failed to fetch analysis history." });
  }
});

// DELETE /api/history/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabaseAdmin
      .from('analysis_jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Ensure users can only delete their own history

    if (error) {
      console.error("[API] /history/:id - delete error:", error);
      throw new Error("Database error: Could not delete the history item.");
    }

    res.json({ message: 'History item deleted successfully.' });
  } catch (err) {
    console.error("[API] /history/:id delete error:", err);
    res.status(500).json({ error: 'Failed to delete history item.' });
  }
});

module.exports = router;
