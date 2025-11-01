// TypeScript types cho weather data
export interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  description: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  icon: string;
  timestamp: string;
}

export interface WeatherHistory {
  city: string;
  searchTime: string;
  temperature: number;
}

export interface WeatherWidgetProps {
  current: WeatherData;
  history: WeatherHistory[];
  action: 'get' | 'history';
  message: string;
}