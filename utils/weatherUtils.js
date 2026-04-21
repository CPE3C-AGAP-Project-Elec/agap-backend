// Backend weather utility functions

export const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || 'a98002a25bf3a1094840f3531298de43';
export const OPENWEATHER_BASE_URL = import.meta.env.VITE_OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5';

export const getMockWeatherData = () => {
  const dates = ['Mar. 30', 'Mar. 31', 'Apr. 01', 'Apr. 02', 'Apr. 03'];
  const conditions = ['Clear', 'Clouds', 'Rain', 'Clouds', 'Clear'];
  const temps = [28.5, 27.8, 25.2, 26.9, 29.1];
  const descriptions = ['clear sky', 'scattered clouds', 'light rain', 'broken clouds', 'clear sky'];

  return dates.map((date, index) => ({
    date,
    temp: temps[index],
    condition: conditions[index],
    icon: conditions[index] === 'Rain' ? '10d' : conditions[index] === 'Clouds' ? '03d' : '01d',
    description: descriptions[index],
    rainfall: conditions[index] === 'Rain' ? 15.5 : 0
  }));
};

export const getMockFloodHistoryData = () => {
  const dates = ['Mar. 30', 'Mar. 31', 'Apr. 01', 'Apr. 02', 'Apr. 03'];
  const levels = ['low', 'medium', 'high', 'medium', 'low'];

  return dates.map((date, index) => ({
    date,
    level: levels[index],
    rainfall: [0, 12.3, 25.7, 8.9, 2.1][index]
  }));
};

export const determineFloodRisk = (weatherData) => {
  if (!weatherData || weatherData.length === 0) return 'low';
  const recentRainfall = weatherData.slice(0, 3).reduce((sum, day) => sum + (day.rainfall || 0), 0);
  if (recentRainfall > 30) return 'high';
  if (recentRainfall > 15) return 'medium';
  return 'low';
};

// Process weather data from OpenWeatherMap API
export const processWeatherData = (forecastData) => {
  const dailyData = {};
  
  forecastData.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit',
      timeZone: 'Asia/Manila'
    });
    
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        fullDate: date,
        temps: [],
        weatherItems: []
      };
    }
    
    dailyData[dateKey].temps.push(item.main.temp);
    dailyData[dateKey].weatherItems.push({
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      main: item.weather[0].main,
      dt: item.dt,
      rain: item.rain || null
    });
  });
  
  const weatherHistory = Object.values(dailyData)
    .sort((a, b) => a.fullDate - b.fullDate)
    .slice(0, 5)
    .map(day => {
      const avgTemp = (day.temps.reduce((a, b) => a + b, 0) / day.temps.length).toFixed(1);
      
      let selectedWeather = day.weatherItems[0];
      const middayItem = day.weatherItems.find(item => {
        const hour = new Date(item.dt * 1000).getHours();
        return hour >= 11 && hour <= 14;
      });
      
      if (middayItem) {
        selectedWeather = middayItem;
      }
      
      const totalRainfall = day.weatherItems.reduce((sum, item) => {
        return sum + (item.rain?.rain || item.rain?.['3h'] || 0);
      }, 0);
      
      return {
        date: day.date,
        temp: avgTemp,
        condition: selectedWeather.main,
        icon: selectedWeather.icon,
        description: selectedWeather.description,
        rainfall: totalRainfall
      };
    });
    
  return weatherHistory;
};

export const generateFloodHistoryFromWeather = (weatherHistory) => {
  return weatherHistory.map(day => {
    let level = 'low';
    if (day.rainfall > 20) {
      level = 'high';
    } else if (day.rainfall > 5) {
      level = 'medium';
    }
    
    return {
      date: day.date,
      level: level,
      rainfall: day.rainfall.toFixed(1)
    };
  });
};

// Fetch weather data from OpenWeatherMap
export const fetchWeatherDataFromAPI = async (lat, lon) => {
  try {
    const response = await fetch(
      `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const forecastData = await response.json();
    return forecastData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};

// Main function to get all weather and flood data
export const getWeatherAndFloodData = async (lat, lon, useMock = false) => {
  if (useMock) {
    const weatherData = getMockWeatherData();
    const floodHistoryData = getMockFloodHistoryData();
    const floodRisk = determineFloodRisk(weatherData);
    
    return {
      weather: weatherData,
      floodHistory: floodHistoryData,
      floodRisk: floodRisk,
      isMock: true
    };
  }
  
  try {
    const forecastData = await fetchWeatherDataFromAPI(lat, lon);
    const weatherData = processWeatherData(forecastData);
    const floodHistoryData = generateFloodHistoryFromWeather(weatherData);
    const floodRisk = determineFloodRisk(weatherData);
    
    return {
      weather: weatherData,
      floodHistory: floodHistoryData,
      floodRisk: floodRisk,
      isMock: false
    };
  } catch (error) {
    console.error('Error getting weather data:', error);
    throw error;
  }
};
