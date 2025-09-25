// NodeTest/server/routes/reports.js
const express = require('express');
const { supabaseAdmin } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default; // Correct way to import for CommonJS
const router = express.Router();

// GET /api/reports (for the detailed table)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data: jobs, error } = await supabaseAdmin
            .from('analysis_jobs')
            .select('id, created_at, status, analysis_type, document_names, results, related_document_ids')
            .eq('user_id', userId)
            .eq('analysis_type', 'comparison')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ reports: jobs || [] });
    } catch (err) {
        console.error("[API] /reports error:", err);
        res.status(500).json({ error: "Failed to fetch reports." });
    }
});

// GET /api/reports/summary (for the charts and stats cards)
router.get('/summary', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { data: jobs, error } = await supabaseAdmin
            .from('analysis_jobs')
            .select('created_at, results')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .eq('analysis_type', 'comparison');

        if (error) throw error;
        
        if (!jobs || jobs.length === 0) {
            return res.json({
                totalComparisons: 0,
                totalConflicts: 0,
                comparisonsOverTime: [],
                conflictPercentage: 0
            });
        }
        
        let totalConflicts = 0;
        const comparisonsByDate = {};

        jobs.forEach(job => {
            const date = new Date(job.created_at).toISOString().split('T')[0];
            if (!comparisonsByDate[date]) {
                comparisonsByDate[date] = 0;
            }
            comparisonsByDate[date]++;
            
            if (job.results && job.results.contradictions && Array.isArray(job.results.contradictions)) {
                totalConflicts += job.results.contradictions.length;
            }
        });

        const comparisonsOverTime = Object.entries(comparisonsByDate)
            .map(([date, count]) => ({ date, comparisons: count }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const jobsWithConflicts = jobs.filter(j => j.results?.contradictions?.length > 0).length;

        const conflictPercentage = jobs.length > 0 ? (jobsWithConflicts / jobs.length) * 100 : 0;

        res.json({
            totalComparisons: jobs.length,
            totalConflicts,
            comparisonsOverTime,
            conflictPercentage: Math.round(conflictPercentage)
        });

    } catch (err) {
        console.error("[API] /reports/summary error:", err);
        res.status(500).json({ error: "Failed to fetch report summary." });
    }
});


// POST /api/reports/export (Enhanced Export Endpoint)
router.post('/export', authMiddleware, (req, res) => {
    const { reports } = req.body;

    if (!reports || !Array.isArray(reports) || reports.length === 0) {
        return res.status(400).json({ error: 'No reports data provided.' });
    }

    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        reports.forEach((report, index) => {
            if (index > 0) doc.addPage();
            
            let yPosition = 35;

            // --- HEADER ---
            doc.setFillColor(44, 62, 80); // Dark Blue
            doc.rect(0, 0, pageWidth, 30, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(255, 255, 255);
            doc.text('Smart Doc Checker', pageWidth / 2, 15, { align: 'center' });
            doc.setFontSize(10);
            doc.text('Comparison Analysis Report', pageWidth / 2, 22, { align: 'center' });
            
            const results = (typeof report.results === 'string') 
                ? JSON.parse(report.results) 
                : (report.results || {});
            
            // --- REPORT INFO TABLE ---
            autoTable(doc, {
                startY: yPosition,
                body: [
                    [{ content: `Documents Compared:`, styles: { fontStyle: 'bold' } }, (report.document_names || []).join(' vs ')],
                    [{ content: 'Analysis Date:', styles: { fontStyle: 'bold' } }, new Date(report.created_at).toLocaleString()],
                ],
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 2, font: 'helvetica' },
            });

            yPosition = doc.autoTable.previous.finalY + 15;

            // --- SUMMARY SECTION ---
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(44, 62, 80);
            doc.text('[ SUMMARY ]', 14, yPosition);
            yPosition += 8;
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(80, 80, 80);
            const summaryLines = doc.splitTextToSize(results.summary || 'No summary available.', pageWidth - 28);
            doc.text(summaryLines, 14, yPosition);
            yPosition += summaryLines.length * 6 + 15;

            const contradictions = results.contradictions || [];
            if (contradictions.length > 0) {
                if (yPosition > 220) { doc.addPage(); yPosition = 30; }
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(231, 76, 60);
                doc.text('[ CONTRADICTIONS FOUND ]', 14, yPosition);
                
                 const tableBody = contradictions.flatMap(c => [
                     [{ content: `Explanation: ${c.explanation}`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [245, 245, 245], textColor: [50,50,50] } }],
                     ...(c.sources || []).map(source => [
                         { content: `"${source.statement}"`, styles: { fontStyle: 'italic' } },
                         source.documentName
                     ])
                 ]);

                 autoTable(doc, {
                     startY: yPosition + 10,
                     head: [['Contradictory Statements', 'Source Document']],
                     body: tableBody,
                     theme: 'striped',
                     headStyles: { fillColor: [44, 62, 80] },
                     styles: { font: 'helvetica' }
                 });

            } else {
                 if (yPosition > 260) { doc.addPage(); yPosition = 30; }
                 doc.setFontSize(14);
                 doc.setFont('helvetica', 'bold');
                 doc.setTextColor(39, 174, 96);
                 doc.text('[ NO CONTRADICTIONS FOUND ]', 14, yPosition);
            }

            // --- FOOTER ---
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Page ${i}`, pageWidth - 20, doc.internal.pageSize.getHeight() - 10);
            }
        });
        
        const pdfOutput = doc.output('arraybuffer');
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=SmartDocChecker_Reports.pdf');
        res.send(Buffer.from(pdfOutput));

    } catch (error) {
        console.error("PDF Export Error:", error);
        res.status(500).json({ error: 'Failed to generate PDF report.' });
    }
});

module.exports = router;    