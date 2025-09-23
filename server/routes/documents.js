const express = require('express');
const multer = require('multer');
const { supabaseAdmin } = require('../config/supabaseClient');
const { extractTextFromDocument } = require('../utils/textExtractor');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/documents
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('documents')
            .select('*, analysis_jobs(*)')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ documents: data });
    } catch (error) {
        console.error("Error fetching documents:", error.message);
        res.status(500).json({ error: 'Failed to fetch documents.' });
    }
});

// DELETE /api/documents/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { data: doc, error: docError } = await supabaseAdmin
            .from('documents')
            .select('storage_path, text_storage_path')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (docError) throw new Error("Document not found or permission denied.");

        const filesToDelete = [doc.storage_path, doc.text_storage_path].filter(Boolean);
        if (filesToDelete.length > 0) {
            await supabaseAdmin.storage.from('documents').remove(filesToDelete);
        }

        await supabaseAdmin.from('documents').delete().eq('id', id);

        // --- FIX: Decrement the user's usage count ---
        const { error: decrementError } = await supabaseAdmin.rpc('decrement_usage', { user_id_in: userId });
        if (decrementError) console.error("Error decrementing usage:", decrementError.message);
        // --- END FIX ---

        res.json({ message: 'Document deleted successfully.' });
    } catch (error) {
        console.error("Error deleting document:", error.message);
        res.status(500).json({ error: 'Failed to delete document.' });
    }
});

// POST /api/documents/upload
router.post('/upload', authMiddleware, upload.array('files'), async (req, res) => {
    try {
        const uploadedDocuments = [];
        const userId = req.user.id;
        
        for (const file of req.files) {
            const uniqueFilename = `${userId}/${Date.now()}-${file.originalname}`;
            const { data: storageData, error: storageError } = await supabaseAdmin.storage
                .from('documents')
                .upload(uniqueFilename, file.buffer, { contentType: file.mimetype });

            if (storageError) throw storageError;

            const { data: docData, error: dbError } = await supabaseAdmin
                .from('documents')
                .insert({
                    user_id: userId,
                    filename: file.originalname,
                    file_size: file.size,
                    file_type: file.mimetype,
                    storage_path: storageData.path,
                    upload_status: 'uploaded',
                }).select().single();

            if (dbError) throw dbError;
            uploadedDocuments.push(docData);
        }

        // --- FIX: The logic that incremented the analysis usage count has been removed. ---
        // This route now ONLY uploads documents and does not affect the analysis count.
        // --- END FIX ---

        res.json({ message: 'Files uploaded successfully', documents: uploadedDocuments });
    } catch (error) {
        console.error("Error uploading files:", error.message);
        res.status(500).json({ error: 'Upload failed.' });
    }
});


// POST /api/documents/extract-and-save-text
router.post('/extract-and-save-text', authMiddleware, async (req, res) => {
  const { documentId } = req.body;
  const userId = req.user.id;

  try { 
    const textContent = await extractTextFromDocument(documentId, userId);

    const textStoragePath = `${userId}/${documentId}-extracted.txt`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(textStoragePath, textContent, {
        contentType: "text/plain;charset=utf-8",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { error: dbError } = await supabaseAdmin
      .from("documents")
      .update({ text_storage_path: textStoragePath })
      .eq("id", documentId);

    if (dbError) throw dbError;

    res.json({ message: "Text extracted and saved successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/documents/get-extracted-text
router.post('/get-extracted-text', authMiddleware, async (req, res) => {
    try {
        const { textPath } = req.body;
        if (!textPath) {
            return res.status(400).json({ error: "textPath is required" });
        }

        // It uses Supabase to download the file
        const { data, error } = await supabaseAdmin.storage
            .from("documents")
            .download(textPath);

        if (error) {
            console.error("Storage download error:", error);
            return res.status(404).json({ error: "Extracted text file not found." });
        }

        // Then it sends the file's content back to the frontend
        const textContent = await data.text();
        res.setHeader('Content-Type', 'text/plain');
        res.status(200).send(textContent);

    } catch (error) {
        console.error("[API ERROR] /documents/get-extracted-text:", error.message);
        res.status(500).json({ error: "Failed to retrieve extracted text." });
    }
});

// POST /api/documents/view
router.post('/view', authMiddleware, async (req, res) => {
    try {
        const { storagePath } = req.body;
        const { data, error } = await supabaseAdmin.storage
            .from('documents')
            .createSignedUrl(storagePath, 60); // 60-second validity

        if (error) throw error;
        res.json({ signedUrl: data.signedUrl });
    } catch (error) {
        res.status(500).json({ error: "Failed to create signed URL." });
    }
});

module.exports = router;