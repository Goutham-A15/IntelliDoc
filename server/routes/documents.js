const express = require('express');
const multer = require('multer');
const { supabaseAdmin } = require('../config/supabaseClient');
const { extractTextFromDocument } = require('../utils/textExtractor');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/documents (no changes here)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('documents')
            .select('*, analysis_jobs(*), is_compared')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ documents: data });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch documents.' });
    }
});

// DELETE /api/documents/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
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

        const { error: decrementError } = await supabaseAdmin.rpc('increment_documents_uploaded', {
            p_user_id: userId,
            p_increment_value: -1
        });
        if (decrementError) console.error("Error decrementing document count:", decrementError);

        res.json({ message: 'Document deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete document.' });
    }
});

// POST /api/documents/upload
router.post('/upload', authMiddleware, upload.array('files'), async (req, res) => {
    const userId = req.user.id;
    try {
        const uploadedDocuments = [];
        
        for (const file of req.files) {
            // --- FIX: Check for existing file before uploading ---
            const { data: existingFile, error: checkError } = await supabaseAdmin
                .from('documents')
                .select('id')
                .eq('user_id', userId)
                .eq('filename', file.originalname)
                .single();

            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found, which is good
                throw checkError;
            }

            if (existingFile) {
                // If the file exists, return a 409 Conflict error
                return res.status(409).json({ error: `File "${file.originalname}" already exists.` });
            }
            // --- END FIX ---
            
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

        if (uploadedDocuments.length > 0) {
            const { error: incrementError } = await supabaseAdmin.rpc('increment_documents_uploaded', {
                p_user_id: userId,
                p_increment_value: uploadedDocuments.length
            });
            if (incrementError) console.error("Error incrementing document count:", incrementError);
        }

        res.json({ message: 'Files uploaded successfully', documents: uploadedDocuments });
    } catch (error) {
        // If it's our specific conflict error, we don't need to log it as a server failure
        if (error.message.includes("already exists")) {
            return res.status(409).json({ error: error.message });
        }
        console.error("Upload error:", error);
        res.status(500).json({ error: 'Upload failed due to a server error.' });
    }
});


// ... (The rest of the file remains unchanged) ...
// POST /api/documents/extract-and-save-text
router.post('/extract-and-save-text', authMiddleware, async (req, res) => {
  const { documentId } = req.body;
  const userId = req.user.id;
  try { 
    const textContent = await extractTextFromDocument(documentId, userId);
    const textStoragePath = `${userId}/${documentId}-extracted.txt`;
    await supabaseAdmin.storage.from("documents").upload(textStoragePath, textContent, { contentType: "text/plain;charset=utf-8", upsert: true });
    await supabaseAdmin.from("documents").update({ text_storage_path: textStoragePath }).eq("id", documentId);
    res.json({ message: "Text extracted and saved successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/documents/get-extracted-text
router.post('/get-extracted-text', authMiddleware, async (req, res) => {
    try {
        const { textPath } = req.body;
        if (!textPath) return res.status(400).json({ error: "textPath is required" });
        const { data, error } = await supabaseAdmin.storage.from("documents").download(textPath);
        if (error) return res.status(404).json({ error: "Extracted text file not found." });
        const textContent = await data.text();
        res.setHeader('Content-Type', 'text/plain');
        res.status(200).send(textContent);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve extracted text." });
    }
});

// POST /api/documents/view
router.post('/view', authMiddleware, async (req, res) => {
    try {
        const { storagePath } = req.body;
        const { data, error } = await supabaseAdmin.storage.from('documents').createSignedUrl(storagePath, 60);
        if (error) throw error;
        res.json({ signedUrl: data.signedUrl });
    } catch (error) {
        res.status(500).json({ error: "Failed to create signed URL." });
    }
});

module.exports = router;