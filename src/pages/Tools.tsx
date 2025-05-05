import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CloudSun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WeatherModal from '@/components/WeatherModel'; // Corrected import path

const Tools: React.FC = () => {
  const navigate = useNavigate();
  const [weatherModalOpen, setWeatherModalOpen] = useState(false);

  const goBack = () => {
    navigate('/');
  };

  // List of tools with their icons, titles, descriptions, and placeholder onClick handlers
  const toolsList = [
    {
      icon: <CloudSun className="h-8 w-8" />,
      title: 'Weather',
      description: 'Check current weather conditions for any location',
      onClick: () => setWeatherModalOpen(true)
    }
    // All other tools have been removed
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={goBack} className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Tools</h1>
      </div>
      
      <p className="text-muted-foreground mb-8">
        A collection of helpful tools to assist with various tasks.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {toolsList.map((tool, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-full bg-primary/10">
                  {tool.icon}
                </div>
                <CardTitle>{tool.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{tool.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button onClick={tool.onClick} className="w-full">
                Open {tool.title}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>More tools coming soon!</p>
      </div>

      {/* Weather Modal */}
      <WeatherModal open={weatherModalOpen} onClose={() => setWeatherModalOpen(false)} />
    </div>
  );
};

export default Tools;