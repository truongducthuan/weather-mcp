import { WeatherData, WeatherHistory } from '../types/weather.types.js';

// Mock weather service (trong production, dùng API thật như OpenWeatherMap)
export class WeatherService {
  private history: WeatherHistory[] = [];

  async getWeather(city: string): Promise<WeatherData> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock data (trong thực tế, call API ở đây)
    const mockWeather: WeatherData = {
      city: city,
      country: 'VN',
      temperature: Math.floor(Math.random() * 15) + 25, // 25-40°C
      feelsLike: Math.floor(Math.random() * 15) + 27,
      description: this.getRandomWeather(),
      humidity: Math.floor(Math.random() * 30) + 60, // 60-90%
      windSpeed: Math.floor(Math.random() * 10) + 5, // 5-15 km/h
      pressure: Math.floor(Math.random() * 20) + 1000, // 1000-1020 hPa
      icon: '01d',
      timestamp: new Date().toISOString()
    };

    // Save to history
    this.history.push({
      city: city,
      searchTime: new Date().toISOString(),
      temperature: mockWeather.temperature
    });

    // Keep only last 10 searches
    if (this.history.length > 10) {
      this.history = this.history.slice(-10);
    }

    return mockWeather;
  }

  getHistory(): WeatherHistory[] {
    return [...this.history];
  }

  private getRandomWeather(): string {
    const conditions = [
      'Nắng đẹp',
      'Có mây',
      'Nhiều mây',
      'Mưa nhẹ',
      'Trời quang',
      'Nắng nóng'
    ];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }
}

// Example với OpenWeatherMap API (uncomment để dùng)
/*
export class WeatherService {
  private apiKey = process.env.OPENWEATHER_API_KEY;
  private baseUrl = 'https://api.openweathermap.org/data/2.5/weather';

  async getWeather(city: string): Promise<WeatherData> {
    const response = await fetch(
      `${this.baseUrl}?q=${city}&appid=${this.apiKey}&units=metric&lang=vi`
    );
    
    if (!response.ok) {
      throw new Error('Weather API error');
    }
    
    const data = await response.json();
    
    return {
      city: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6),
      pressure: data.main.pressure,
      icon: data.weather[0].icon,
      timestamp: new Date().toISOString()
    };
  }
}
*/