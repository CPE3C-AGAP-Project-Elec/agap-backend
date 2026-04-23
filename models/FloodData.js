const mongoose = require('mongoose');

const floodDataSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true,
  },
  coordinates: {
    lat: Number,
    lon: Number,
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
  },
  waterLevel: {
    type: Number,
    default: 0,
  },
  rainfall: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['normal', 'warning', 'alert', 'evacuate'],
    default: 'normal',
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('FloodData', floodDataSchema);
