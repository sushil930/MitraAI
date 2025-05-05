import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CloudSun, Languages, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WeatherModal from '@/components/WeatherModel';
import TranslationModal from '@/components/TranslationModal';
import QrScannerModal from '@/components/QrScannerModal';
import ImageToPdfModal from '@/components/ImageToPdfModal'; // Import the new component
import { Icon } from '@iconify/react';

const Tools: React.FC = () => {
  const navigate = useNavigate();
  const [weatherModalOpen, setWeatherModalOpen] = useState(false);
  const [translationModalOpen, setTranslationModalOpen] = useState(false);
  const [qrScannerModalOpen, setQrScannerModalOpen] = useState(false);
  const [imageToPdfModalOpen, setImageToPdfModalOpen] = useState(false); // New state for Image to PDF

  const goBack = () => {
    navigate('/');
  };

  // List of tools with their icons, titles, descriptions, and onClick handlers
  const toolsList = [
    {
      icon: <CloudSun className="h-8 w-8" />,
      title: 'Weather',
      description: 'Check current weather conditions for any location',
      onClick: () => setWeatherModalOpen(true)
    },
    {
      icon: <Languages className="h-8 w-8" />,
      title: 'Translation',
      description: 'Translate text between multiple languages',
      onClick: () => setTranslationModalOpen(true)
    },
    {
      icon: <QrCode className="h-8 w-8" />,
      title: 'QR Scanner',
      description: 'Scan QR codes using your camera',
      onClick: () => setQrScannerModalOpen(true)
    },
    {
      icon: <Icon icon="tabler:file-type-pdf" className="h-8 w-8" />, // Using Iconify for PDF icon
      title: 'Image to PDF',
      description: 'Convert multiple images into a single PDF document',
      onClick: () => setImageToPdfModalOpen(true)
    }
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
      
      {/* Use max-w-6xl for better spacing with 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {toolsList.map((tool, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow flex flex-col">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  {tool.icon}
                </div>
                <CardTitle>{tool.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
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
      
      {/* Translation Modal */}
      <TranslationModal open={translationModalOpen} onClose={() => setTranslationModalOpen(false)} />

      {/* QR Scanner Modal */}
      <QrScannerModal open={qrScannerModalOpen} onClose={() => setQrScannerModalOpen(false)} />
      
      {/* Image to PDF Modal */}
      <ImageToPdfModal open={imageToPdfModalOpen} onClose={() => setImageToPdfModalOpen(false)} />
    </div>
  );
};

export default Tools;