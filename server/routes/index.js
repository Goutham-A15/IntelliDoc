const express = require('express');
const router = express.Router();

const documentRoutes = require('./documents');
const analyzeRoutes = require('./analyze');
const billingRoutes = require('./billing');
const reportRoutes = require('./reports');
const usageRoutes = require('./usage');
const historyRoutes = require('./history'); // Add this line

router.use('/documents', documentRoutes);
router.use('/analyze', analyzeRoutes);
router.use('/billing', billingRoutes);
router.use('/reports', reportRoutes);
router.use('/usage', usageRoutes);
router.use('/history', historyRoutes); // Add this line

module.exports = router;