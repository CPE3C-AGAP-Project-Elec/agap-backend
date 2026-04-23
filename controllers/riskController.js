const FloodRiskPredictor = require('../utils/floodRiskPredictor');
const { getWeatherAndFloodData } = require('../utils/weatherUtils');

// @desc    Get flood risk prediction
// @route   GET /api/risk/predict
// @access  Public
const getRiskPrediction = async (req, res) => {
  try {
    const { lat, lon, location } = req.query;
    
    let latitude = lat ? parseFloat(lat) : 14.5995;
    let longitude = lon ? parseFloat(lon) : 120.9842;
    let locationName = location || 'Manila';
    
    // Get weather data
    const weatherData = await getWeatherAndFloodData(latitude, longitude, true);
    
    // Calculate current risk
    const currentRisk = FloodRiskPredictor.calculateRisk(weatherData.weather, { location: locationName });
    
    // Generate predictions
    const predictions = FloodRiskPredictor.generatePredictions(weatherData.weather, locationName);
    
    // Generate alert
    const alert = FloodRiskPredictor.generateAlert(currentRisk.level, locationName);
    
    res.status(200).json({
      success: true,
      data: {
        currentRisk,
        predictions,
        alert,
        factors: {
          currentRainfall: FloodRiskPredictor.getCurrentRainfall(weatherData.weather),
          forecastRainfall: FloodRiskPredictor.getForecastRainfall(weatherData.weather),
          soilMoisture: FloodRiskPredictor.estimateSoilMoisture(weatherData.weather),
          historicalRisk: FloodRiskPredictor.getHistoricalRisk(locationName)
        },
        recommendations: FloodRiskPredictor.getRecommendation(currentRisk.percentage)
      }
    });
  } catch (error) {
    console.error('Risk prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate risk prediction'
    });
  }
};

// @desc    Get risk history for location
// @route   GET /api/risk/history
// @access  Public
const getRiskHistory = async (req, res) => {
  try {
    const { location, days = 30 } = req.query;
    
    // Generate mock historical data (replace with actual DB data)
    const history = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      history.push({
        date: date.toISOString(),
        riskPercentage: Math.random() * 100,
        riskLevel: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        rainfall: Math.random() * 60
      });
    }
    
    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Risk history error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get risk history' 
    });
  }
};

module.exports = {
  getRiskPrediction,
  getRiskHistory
};
