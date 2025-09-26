const express = require('express');
const router = express.Router();

const documentRoutes = require('./documents');
const analyzeRoutes = require('./analyze');
const billingRoutes = require('./billing');
const reportRoutes = require('./reports');
const usageRoutes = require('./usage');
const historyRoutes = require('./history'); 
const notificationRoutes = require('./notifications');
const supportRoutes = require('./support'); // Add this line

router.use('/documents', documentRoutes);
router.use('/analyze', analyzeRoutes);
router.use('/billing', billingRoutes);
router.use('/reports', reportRoutes);
router.use('/usage', usageRoutes);
router.use('/history', historyRoutes); 
router.use('/notifications', notificationRoutes);
router.use('/support', supportRoutes); 

module.exports = router;