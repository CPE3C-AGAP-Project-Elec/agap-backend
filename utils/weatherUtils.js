const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Get mock weather data for testing
const getMockWeatherData = () => {
  const dates = ['Mar. 30', 'Mar. 31', 'Apr. 01', 'Apr. 02', 'Apr. 03'];
  const conditions = ['Clear', 'Clouds', 'Rain', 'Clouds', 'Clear'];
  const temps = [28.5, 27.8, 25.2, 26.9, 29.1];

  return dates.map((date, index) => ({
    date,
    temp: temps[index],
    condition: conditions[index],
    rainfall: conditions[index] === 'Rain' ? 15.5 : 0
  }));
};

// Determine flood risk based on weather data
const determineFloodRisk = (weatherData) => {
  if (!weatherData || weatherData.length === 0) return 'low';
  const recentRainfall = weatherData.slice(0, 3).reduce((sum, day) => sum + (day.rainfall || 0), 0);
  if (recentRainfall > 30) return 'high';
  if (recentRainfall > 15) return 'medium';
  return 'low';
};

// Process weather data from API
const processWeatherData = (forecastData) => {
  const dailyData = {};
  
  forecastData.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        temps: [],
        rainfall: 0
      };
    }
    
    dailyData[dateKey].temps.push(item.main.temp);
    if (item.rain) {
      dailyData[dateKey].rainfall += (item.rain['3h'] || 0);
    }
  });
  
  return Object.values(dailyData).slice(0, 5).map(day => ({
    date: day.date,
    temp: (day.temps.reduce((a, b) => a + b, 0) / day.temps.length).toFixed(1),
    rainfall: day.rainfall
  }));
};

// Main function to get weather and flood data
const getWeatherAndFloodData = async (lat, lon, useMock = false) => {
  if (useMock) {
    const weatherData = getMockWeatherData();
    const floodRisk = determineFloodRisk(weatherData);
    return { weather: weatherData, floodRisk, isMock: true };
  }
  
  try {
    const response = await fetch(
      `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) throw new Error('Weather API error');
    
    const forecastData = await response.json();
    const weatherData = processWeatherData(forecastData);
    const floodRisk = determineFloodRisk(weatherData);
    
    return { weather: weatherData, floodRisk, isMock: false };
  } catch (error) {
    console.error('Weather API error:', error);
    throw error;
  }
};

module.exports = {
  getMockWeatherData,
  determineFloodRisk,
  processWeatherData,
  getWeatherAndFloodData,
};
