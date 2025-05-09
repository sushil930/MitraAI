import React from 'react';
import Lottie from 'lottie-react';

// Import weather animations
import clearDay from '@/icons/production/fill/lottie/clear-day.json';
import clearNight from '@/icons/production/fill/lottie/clear-night.json';
import cloudy from '@/icons/production/fill/lottie/cloudy.json';
import fogDay from '@/icons/production/fill/lottie/fog-day.json';
import fogNight from '@/icons/production/fill/lottie/fog-night.json';
import overcastDayRain from '@/icons/production/fill/lottie/overcast-day-rain.json';
import overcastNightRain from '@/icons/production/fill/lottie/overcast-night-rain.json';
import overcastDaySnow from '@/icons/production/fill/lottie/overcast-day-snow.json';
import overcastNightSnow from '@/icons/production/fill/lottie/overcast-night-snow.json';
import thunderstormsDay from '@/icons/production/fill/lottie/thunderstorms-day.json';
import thunderstormsNight from '@/icons/production/fill/lottie/thunderstorms-night.json';
import partlyCloudy from '@/icons/production/fill/lottie/overcast-day.json';
import partlyCloudyNight from '@/icons/production/fill/lottie/overcast-night.json';

interface WeatherLottieProps {
  condition: string;
  isDayTime?: boolean;
  size?: "sm" | "md" | "lg";
}

const WeatherLottie: React.FC<WeatherLottieProps> = ({ condition, isDayTime = true, size = "md" }) => {
  const text = condition.toLowerCase();
  
  // Map sizes to pixel values
  const sizeMap = {
    sm: { width: 40, height: 40 },
    md: { width: 60, height: 60 },
    lg: { width: 80, height: 80 }
  };
  
  // Select the appropriate animation based on weather condition
  let animation;
  
  if (text.includes('thunder') || text.includes('lightning') || text.includes('storm')) {
    animation = isDayTime ? thunderstormsDay : thunderstormsNight;
  } else if (text.includes('rain') || text.includes('shower') || text.includes('drizzle')) {
    animation = isDayTime ? overcastDayRain : overcastNightRain;
  } else if (text.includes('snow') || text.includes('flurries') || text.includes('ice')) {
    animation = isDayTime ? overcastDaySnow : overcastNightSnow;
  } else if (text.includes('fog') || text.includes('haze') || text.includes('mist')) {
    animation = isDayTime ? fogDay : fogNight;
  } else if (text.includes('cloud') || text.includes('overcast') || text.includes('partly')) {
    animation = isDayTime ? partlyCloudy : partlyCloudyNight;
  } else if (text.includes('clear') || text.includes('sunny')) {
    animation = isDayTime ? clearDay : clearNight;
  } else {
    // Default animation
    animation = isDayTime ? clearDay : clearNight;
  }
  
  return (
    <div style={{ width: sizeMap[size].width, height: sizeMap[size].height }}>
      <Lottie 
        animationData={animation} 
        loop={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default WeatherLottie; 