import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiService } from '@/utils/apiService';
import { CloudSun, Droplets, Wind, Thermometer, Loader2 } from 'lucide-react';

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
  weatherIcon: number;
}

const WeatherModal: React.FC<WeatherModalProps> = ({ open, onClose }) => {
  const [location, setLocation] = useState('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!location.trim()) {
      setError('Please enter a location');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiService.getWeather(location);
      setWeatherData(data);
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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CloudSun className="h-6 w-6" />
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

          {weatherData && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">{weatherData.locationName}</h3>
                <div className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg">
                <div className="text-4xl font-bold">
                  {weatherData.temperature.Value}°{weatherData.temperature.Unit}
                </div>
                <div className="space-y-1">
                  <div className="font-medium">{weatherData.weatherText}</div>
                  <div className="text-sm text-muted-foreground">
                    Feels like {weatherData.realFeelTemperature.Value}°{weatherData.realFeelTemperature.Unit}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-sm">Humidity</div>
                    <div className="font-medium">{weatherData.relativeHumidity}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                  <Wind className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-sm">Wind</div>
                    <div className="font-medium">{weatherData.wind.Value} {weatherData.wind.Unit}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                  <Thermometer className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-sm">UV Index</div>
                    <div className="font-medium">{weatherData.uvIndex} ({weatherData.uvIndexText})</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WeatherModal;