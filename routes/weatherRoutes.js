const express = require('express');
const router = express.Router();
const { getFloodData } = require('../controllers/weatherController');

router.get('/flood-data', getFloodData);

module.exports = router;
