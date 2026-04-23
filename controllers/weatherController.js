const { getWeatherAndFloodData } = require('../utils/weatherUtils');

// @desc    Get weather and flood data for a location
// @route   GET /api/weather/flood-data
// @access  Public
const getFloodData = async (req, res) => {
  try {
    const { lat, lon, location, useMock } = req.query;
    
    let latitude, longitude;
    
    if (lat && lon) {
      latitude = parseFloat(lat);
      longitude = parseFloat(lon);
    } else if (location) {
      // Geocode location (simplified - you can add geocoding here)
      latitude = 14.5995;
      longitude = 120.9842;
    } else {
      latitude = 14.5995;
      longitude = 120.9842;
    }
    
    const data = await getWeatherAndFloodData(latitude, longitude, useMock === 'true');
    
    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Weather controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weather data',
      error: error.message
    });
  }
};

module.exports = {
  getFloodData,
};
