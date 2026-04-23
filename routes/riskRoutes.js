const express = require('express');
const router = express.Router();
const { getRiskPrediction, getRiskHistory } = require('../controllers/riskController');

// GET /api/risk/predict - Get flood risk prediction
router.get('/predict', getRiskPrediction);

// GET /api/risk/history - Get risk history for location
router.get('/history', getRiskHistory);

module.exports = router;
