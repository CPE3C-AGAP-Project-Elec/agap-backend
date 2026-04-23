// Flood Risk Prediction Algorithm
class FloodRiskPredictor {
  constructor() {
    // Risk calculation weights
    this.weights = {
      currentRainfall: 0.35,
      forecastRainfall: 0.25,
      soilMoisture: 0.15,
      tideLevel: 0.15,
      historicalData: 0.10
    };
    
    // Risk thresholds (in mm of rainfall)
    this.thresholds = {
      low: { min: 0, max: 15, color: '#22c55e', message: 'Normal conditions' },
      medium: { min: 15, max: 30, color: '#eab308', message: 'Exercise caution' },
      high: { min: 30, max: 50, color: '#f97316', message: 'Prepare for flooding' },
      critical: { min: 50, max: 999, color: '#ef4444', message: 'EVACUATE IMMEDIATELY' }
    };
  }

  // Calculate flood risk based on multiple factors
  calculateRisk(weatherData, locationData = {}) {
    const currentRainfall = this.getCurrentRainfall(weatherData);
    const forecastRainfall = this.getForecastRainfall(weatherData);
    const soilMoisture = locationData.soilMoisture || this.estimateSoilMoisture(weatherData);
    const tideLevel = locationData.tideLevel || 0;
    const historicalRisk = this.getHistoricalRisk(locationData.location);

    let riskScore = 0;
    riskScore += (currentRainfall / 100) * this.weights.currentRainfall;
    riskScore += (forecastRainfall / 100) * this.weights.forecastRainfall;
    riskScore += (soilMoisture / 100) * this.weights.soilMoisture;
    riskScore += (tideLevel / 5) * this.weights.tideLevel;
    riskScore += historicalRisk * this.weights.historicalData;

    const riskPercentage = Math.min(Math.max(riskScore * 100, 0), 100);
    return this.getRiskLevel(riskPercentage);
  }

  // Get current rainfall from weather data
  getCurrentRainfall(weatherData) {
    if (!weatherData || weatherData.length === 0) return 0;
    const recentRainfall = weatherData.slice(0, 3).reduce((sum, day) => sum + (day.rainfall || 0), 0);
    return recentRainfall / 3;
  }

  // Get forecasted rainfall
  getForecastRainfall(weatherData) {
    if (!weatherData || weatherData.length < 3) return 0;
    const futureRainfall = weatherData.slice(3, 6).reduce((sum, day) => sum + (day.rainfall || 0), 0);
    return futureRainfall / 3;
  }

  // Estimate soil moisture based on recent rainfall
  estimateSoilMoisture(weatherData) {
    if (!weatherData || weatherData.length === 0) return 20;
    const totalRainfall = weatherData.slice(0, 7).reduce((sum, day) => sum + (day.rainfall || 0), 0);
    return Math.min(Math.max((totalRainfall / 100) * 100, 20), 100);
  }

  // Get historical risk for location
  getHistoricalRisk(location) {
    const riskMap = {
      'manila': 0.6,
      'quezon city': 0.5,
      'cebu': 0.4,
      'davao': 0.3,
      'bulacan': 0.7,
      'pampanga': 0.65,
      'cavite': 0.55,
      'laguna': 0.5,
      'rizal': 0.6,
      'batangas': 0.45
    };
    const locationKey = (location || '').toLowerCase();
    return riskMap[locationKey] || 0.4;
  }

  // Get risk level from percentage
  getRiskLevel(percentage) {
    if (percentage >= 70) return { level: 'critical', percentage, ...this.thresholds.critical };
    if (percentage >= 50) return { level: 'high', percentage, ...this.thresholds.high };
    if (percentage >= 25) return { level: 'medium', percentage, ...this.thresholds.medium };
    return { level: 'low', percentage, ...this.thresholds.low };
  }

  // Generate risk prediction for next 7 days
  generatePredictions(weatherData, location) {
    const predictions = [];
    const baseRisk = this.calculateRisk(weatherData, { location });
    
    for (let i = 1; i <= 7; i++) {
      let predictedRisk = baseRisk.percentage;
      
      if (weatherData[i] && weatherData[i].rainfall) {
        predictedRisk += (weatherData[i].rainfall / 50) * 10;
      }
      
      predictedRisk += (Math.random() - 0.5) * 10;
      predictedRisk = Math.min(Math.max(predictedRisk, 0), 100);
      
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      predictions.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        riskPercentage: Math.round(predictedRisk),
        riskLevel: this.getRiskLevel(predictedRisk).level,
        rainfall: weatherData[i]?.rainfall || Math.random() * 20,
        recommendation: this.getRecommendation(predictedRisk)
      });
    }
    
    return predictions;
  }

  // Get safety recommendation based on risk
  getRecommendation(riskPercentage) {
    if (riskPercentage >= 70) {
      return 'IMMEDIATE ACTION: Evacuate to higher ground. Avoid flooded areas.';
    }
    if (riskPercentage >= 50) {
      return 'HIGH ALERT: Prepare emergency kit. Monitor updates. Avoid travel.';
    }
    if (riskPercentage >= 25) {
      return 'MODERATE RISK: Stay alert. Check drainage systems. Be prepared.';
    }
    return 'LOW RISK: Normal precautions. Stay weather aware.';
  }

  // Generate alert message
  generateAlert(riskLevel, location) {
    const alerts = {
      critical: {
        title: '⚡ CRITICAL FLOOD WARNING ⚡',
        message: `IMMEDIATE EVACUATION RECOMMENDED for ${location}. Severe flooding expected.`,
        actions: ['Evacuate now', 'Move to higher ground', 'Call emergency services'],
        color: '#ef4444'
      },
      high: {
        title: '⚠️ HIGH FLOOD ALERT ⚠️',
        message: `Prepare for potential flooding in ${location}. Stay vigilant.`,
        actions: ['Prepare emergency kit', 'Secure belongings', 'Monitor updates'],
        color: '#f97316'
      },
      medium: {
        title: '📍 MODERATE FLOOD ALERT',
        message: `Possible localized flooding in ${location}. Exercise caution.`,
        actions: ['Check drainage', 'Avoid low areas', 'Stay informed'],
        color: '#eab308'
      },
      low: {
        title: '✅ NORMAL CONDITIONS',
        message: `No immediate flood threat in ${location}. Stay weather aware.`,
        actions: ['Normal activities', 'Monitor weather updates'],
        color: '#22c55e'
      }
    };
    return alerts[riskLevel] || alerts.low;
  }
}

module.exports = new FloodRiskPredictor();
