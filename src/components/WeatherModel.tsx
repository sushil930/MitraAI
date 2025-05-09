import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiService } from '@/utils/apiService';
import WeatherLottie from './WeatherLottie';
import { 
  CloudSun, 
  Droplets, 
  Wind, 
  Thermometer, 
  Loader2,
  SunIcon,
  MoonIcon,
  CloudRainIcon,
  CloudSnowIcon,
  CloudFogIcon,
  CloudLightningIcon,
  CloudIcon,
  UmbrellaIcon,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherModalProps {
  open: boolean;
  onClose: () => void;
}

interface WeatherData {
  locationName: string;
  weatherText: string;
  temperature: { Value: number; Unit: string };
  realFeelTemperature: { Value: number; Unit: string };
  relativeHumidity: number;
  wind: { Value: number; Unit: string };
  uvIndex: number;
  uvIndexText: string;
  weatherIcon?: number;
  hasPrecipitation?: boolean;
  precipitationType?: string;
  cloudCover?: number;
  pressure?: { Value: number; Unit: string };
  visibility?: { Value: number; Unit: string };
  isDayTime?: boolean;
  // Add forecast data
  forecast?: {
    daily: Array<{
      date: string;
      day: {
        weatherText: string;
        temperature: { min: number; max: number };
        weatherIcon?: number;
      }
    }>;
    hourly?: Array<{
      time: string;
      temperature: number;
      weatherText: string;
      weatherIcon?: number;
    }>;
  };
}

// Get temperature class based on value
const getTemperatureClass = (temp: number) => {
  if (temp >= 30) return "text-red-600"; // Hot
  if (temp >= 20) return "text-orange-500"; // Warm
  if (temp >= 10) return "text-yellow-500"; // Mild
  if (temp >= 0) return "text-blue-400"; // Cool
  return "text-blue-600"; // Cold
};

// Weather icon component for the forecast (now using Lottie)
const WeatherIcon = ({ condition, isDayTime = true, size = "md" }: { condition: string, isDayTime?: boolean, size?: "sm" | "md" | "lg" }) => {
  return <WeatherLottie condition={condition} isDayTime={isDayTime} size={size} />;
};

// Simulated temperature data for the graph
const generateHourlyTemperatures = (currentTemp: number) => {
  const hours = [];
  const temps = [];
  const now = new Date();
  const currentHour = now.getHours();
  
  // Generate reasonable temperature fluctuations
  for (let i = 0; i < 24; i++) {
    const hour = (currentHour + i) % 24;
    hours.push(`${hour}:00`);
    
    // Create a natural temperature curve
    let tempOffset = 0;
    if (hour >= 6 && hour <= 14) {
      // Rising temperature in morning/midday
      tempOffset = (i < 8) ? i : (14 - hour);
    } else if (hour >= 15 && hour <= 21) {
      // Falling temperature in evening
      tempOffset = -((hour - 14) / 2);
    } else {
      // Coolest at night
      tempOffset = -4;
    }
    
    temps.push(Math.round(currentTemp + tempOffset));
  }
  
  return { hours, temps };
};

// Generate mock forecast data
const generateMockForecast = (location: string, currentTemp: number) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weatherTypes = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rain', 'Thunderstorm', 'Snow'];
  const forecast = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    const dayName = days[date.getDay()];
    
    // Randomize weather but keep it somewhat realistic
    const randomWeatherIndex = Math.floor(Math.random() * 3) + (i % weatherTypes.length);
    const weatherText = weatherTypes[randomWeatherIndex % weatherTypes.length];
    
    // Temperature variation
    const maxTemp = Math.round(currentTemp + (Math.random() * 6) - 2);
    const minTemp = Math.round(maxTemp - (4 + Math.random() * 4));
    
    forecast.push({
      date: dayName,
      day: {
        weatherText,
        temperature: { 
          min: minTemp,
          max: maxTemp 
        }
      }
    });
  }
  
  return forecast;
};

const TemperatureGraph = ({ temps, hours }: { temps: number[], hours: string[] }) => {
  const maxTemp = Math.max(...temps);
  const minTemp = Math.min(...temps);
  const range = maxTemp - minTemp;
  
  return (
    <div className="w-full h-36 relative mt-4 mb-8">
      {/* Temperature Line */}
      <div className="absolute inset-0 flex items-end">
        <svg className="w-full h-full" viewBox={`0 0 ${temps.length} 100`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          
          {/* Area under the line */}
          <path
            d={`
              M 0,${100 - ((temps[0] - minTemp) / range) * 80} 
              ${temps.map((temp, i) => `L ${i},${100 - ((temp - minTemp) / range) * 80}`).join(' ')}
              L ${temps.length - 1},100 L 0,100 Z
            `}
            fill="url(#tempGradient)"
            opacity="0.5"
          />
          
          {/* Line */}
          <path
            d={`
              M 0,${100 - ((temps[0] - minTemp) / range) * 80} 
              ${temps.map((temp, i) => `L ${i},${100 - ((temp - minTemp) / range) * 80}`).join(' ')}
            `}
            stroke="#F59E0B"
            strokeWidth="2"
            fill="none"
          />
          
          {/* Temperature points */}
          {temps.map((temp, i) => (
            <circle
              key={i}
              cx={i}
              cy={100 - ((temp - minTemp) / range) * 80}
              r="1"
              fill="#F59E0B"
            />
          ))}
        </svg>
      </div>
      
      {/* Temperature Labels */}
      <div className="absolute inset-x-0 top-0 flex justify-between text-xs text-gray-400">
        {temps.filter((_, i) => i % 4 === 0).map((temp, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-yellow-500 font-medium">{temp}°</span>
          </div>
        ))}
      </div>
      
      {/* Hour Labels */}
      <div className="absolute inset-x-0 bottom-0 flex justify-between text-xs text-gray-400">
        {hours.filter((_, i) => i % 4 === 0).map((hour, i) => (
          <div key={i} className="flex flex-col items-center">
            <span>{hour}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const WeatherModal: React.FC<WeatherModalProps> = ({ open, onClose }) => {
  const [location, setLocation] = useState('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('temperature');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  
  const handleSearch = async () => {
    if (!location.trim()) {
      setError('Please enter a location');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get weather data from API
      const data = await apiService.getWeather(location);
      
      // Generate mock hourly temperatures and forecast
      const { hours, temps } = generateHourlyTemperatures(data.temperature.Value);
      const mockForecast = generateMockForecast(location, data.temperature.Value);
      
      // Enhance the weather data with our mock data
      setWeatherData({
        ...data,
        forecast: {
          daily: mockForecast,
          hourly: hours.map((time, i) => ({
            time,
            temperature: temps[i],
            weatherText: data.weatherText,
          }))
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather data');
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Format current date and time
  const now = new Date();
  const formattedDate = now.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const formattedTime = now.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Get the selected day's weather data
  const getSelectedDayWeather = () => {
    if (!weatherData || !weatherData.forecast?.daily || selectedDayIndex >= weatherData.forecast.daily.length) {
      return null;
    }
    
    const selectedDay = weatherData.forecast.daily[selectedDayIndex];
    return {
      date: selectedDay.date,
      weatherText: selectedDay.day.weatherText,
      temperature: {
        Value: selectedDay.day.temperature.max,
        Unit: weatherData.temperature.Unit
      },
      realFeelTemperature: {
        Value: selectedDay.day.temperature.max - 2, // Approximation
        Unit: weatherData.temperature.Unit
      },
      minTemperature: selectedDay.day.temperature.min,
    };
  };
  
  const selectedDayWeather = getSelectedDayWeather();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className={weatherData && !loading 
        ? "sm:max-w-[600px] md:max-w-[750px] dark:bg-gray-900 bg-white dark:text-white text-gray-900 p-0 border-0" 
        : "sm:max-w-[550px] md:max-w-[650px]"
      }>
        {!weatherData && !loading ? (
          // Initial state - before any search
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <WeatherLottie condition="partly cloudy" size="sm" />
                Weather Forecast
              </DialogTitle>
              <DialogDescription>
                Get current weather conditions for any location
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter city name (e.g., London, New York)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  {error}
                </div>
              )}
            </div>
          </>
        ) : loading ? (
          // Loading state
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <WeatherLottie condition="partly cloudy" size="sm" />
                Weather Forecast
              </DialogTitle>
              <DialogDescription>
                Get current weather conditions for any location
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter city name (e.g., London, New York)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={true}
                />
                <Button disabled={true}>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </Button>
              </div>

              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
                <p className="mt-2 text-muted-foreground">Fetching weather data...</p>
              </div>
            </div>
          </>
        ) : (
          // Weather data display state
          <div className="p-6 space-y-6">
            {/* Search bar */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter city name"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
              />
              <Button 
                onClick={handleSearch} 
                disabled={loading}
                className="dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">
                {error}
              </div>
            )}

            {weatherData && (
              <div className="space-y-6">
                {/* Header with current weather */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="weather-icon-container bg-gray-100 dark:bg-gray-800/50 p-2 rounded-full flex items-center justify-center">
                      <WeatherLottie 
                        condition={selectedDayIndex === 0 ? weatherData.weatherText : selectedDayWeather?.weatherText || weatherData.weatherText}
                        isDayTime={weatherData.isDayTime} 
                        size="lg"
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-baseline gap-2">
                        <div className="text-5xl font-bold text-yellow-500">
                          {selectedDayIndex === 0 
                            ? weatherData.temperature.Value 
                            : selectedDayWeather?.temperature.Value || weatherData.temperature.Value}
                        </div>
                        <div className="text-xl text-gray-500 dark:text-gray-400">°{weatherData.temperature.Unit} | °F</div>
                      </div>
                      
                      <div className="text-lg mt-1">
                        {selectedDayIndex === 0 
                          ? weatherData.weatherText 
                          : selectedDayWeather?.weatherText || weatherData.weatherText}
                      </div>
                      
                      {selectedDayIndex === 0 ? (
                        <div className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                          <div>Precipitation: {weatherData.hasPrecipitation ? (weatherData.precipitationType || "Yes") : "0%"}</div>
                          <div>Humidity: {weatherData.relativeHumidity}%</div>
                          <div>Wind: {weatherData.wind.Value} {weatherData.wind.Unit}</div>
                        </div>
                      ) : (
                        <div className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                          <div>Min Temperature: {selectedDayWeather?.minTemperature || 0}°{weatherData.temperature.Unit}</div>
                          <div>Feels like: {selectedDayWeather?.realFeelTemperature.Value || 0}°{weatherData.temperature.Unit}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-medium">Weather</div>
                    <div className="text-lg text-gray-500 dark:text-gray-400">
                      {selectedDayIndex === 0 ? formattedDate : `${selectedDayWeather?.date || ''}`}
                    </div>
                    <div className="text-lg text-gray-500 dark:text-gray-400">
                      {selectedDayIndex === 0 ? formattedTime : ''}
                    </div>
                    <div className="text-lg">
                      {selectedDayIndex === 0 
                        ? weatherData.weatherText 
                        : selectedDayWeather?.weatherText || weatherData.weatherText}
                    </div>
                  </div>
                </div>
                
                {/* Tabs for different weather data */}
                <Tabs defaultValue="temperature" className="w-full" onValueChange={setActiveTab}>
                  <TabsList className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 w-full justify-start rounded-none p-0">
                    <TabsTrigger 
                      value="temperature" 
                      className={`py-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-yellow-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-none`}
                    >
                      Temperature
                    </TabsTrigger>
                    <TabsTrigger 
                      value="precipitation" 
                      className="py-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-none"
                    >
                      Precipitation
                    </TabsTrigger>
                    <TabsTrigger 
                      value="wind" 
                      className="py-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-none"
                    >
                      Wind
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="temperature" className="pt-4 pb-0 px-0">
                    {weatherData.forecast?.hourly && (
                      <TemperatureGraph 
                        temps={weatherData.forecast.hourly.map(h => h.temperature)} 
                        hours={weatherData.forecast.hourly.map(h => h.time)} 
                      />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="precipitation" className="pt-4 pb-0 px-0">
                    <div className="h-36 flex items-center justify-center text-gray-500 dark:text-gray-400">
                      <div>Precipitation data chart would appear here</div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="wind" className="pt-4 pb-0 px-0">
                    <div className="h-36 flex items-center justify-center text-gray-500 dark:text-gray-400">
                      <div>Wind data chart would appear here</div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                {/* 7-day forecast */}
                {weatherData.forecast?.daily && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex space-x-3 overflow-x-auto pb-2 px-1">
                      {weatherData.forecast.daily.map((day, index) => (
                        <div 
                          key={index} 
                          className={`flex flex-col items-center p-3 min-w-[80px] rounded-lg cursor-pointer transition-colors dark:hover:bg-gray-700/70 hover:bg-gray-100 ${index === selectedDayIndex ? 'dark:bg-gray-800 bg-gray-200' : ''}`}
                          onClick={() => setSelectedDayIndex(index)}
                        >
                          <div className="font-medium">{day.date}</div>
                          <div className="my-2">
                            <WeatherIcon condition={day.day.weatherText} />
                          </div>
                          <div className="text-md font-medium text-yellow-500">{day.day.temperature.max}°</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{day.day.temperature.min}°</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WeatherModal;