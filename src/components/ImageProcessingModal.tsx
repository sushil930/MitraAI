import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiService } from '@/utils/apiService';
import { Loader2, Upload, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageProcessingModalProps {
  open: boolean;
  onClose: () => void;
}

const ImageProcessingModal: React.FC<ImageProcessingModalProps> = ({ open, onClose }) => {
  // Reference to file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [quality, setQuality] = useState<number>(90);
  const [keepAspectRatio, setKeepAspectRatio] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<string>('original');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // Reset form values
      setWidth('');
      setHeight('');
      setQuality(90);
      setKeepAspectRatio(true);
      setOutputFormat('original');
    }
  };
  
  // Trigger file input click
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Process image
  const handleProcessImage = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const processedImage = await apiService.processImage(
        selectedImage,
        width ? parseInt(width) : undefined,
        height ? parseInt(height) : undefined,
        quality,
        keepAspectRatio,
        outputFormat === 'original' ? '' : outputFormat // Convert 'original' to empty string for API
      );
      
      // Create download link and trigger download
      const url = URL.createObjectURL(processedImage);
      const link = document.createElement('a');
      link.href = url;
      
      // Create filename based on original name
      const ext = outputFormat && outputFormat !== 'original' ? outputFormat.toLowerCase() : selectedImage.name.split('.').pop();
      const filename = `${selectedImage.name.split('.')[0]}_processed.${ext}`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Image processed successfully');
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Cleanup preview URL on unmount or when image changes
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="mb-2">
          <DialogTitle>Image Processing Tool</DialogTitle>
          <DialogDescription>
            Resize, compress, and convert images with just a few clicks.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Area - Left Side */}
          <div className="space-y-2">
            <Label>Upload Image</Label>
            <div 
              className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors h-[260px] ${selectedImage ? 'border-primary' : 'border-muted'}`}
              onClick={handleUploadClick}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
              />
              
              {imagePreview ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-[200px] max-w-full object-contain rounded-md" 
                  />
                  <div className="text-sm text-center text-muted-foreground mt-2">
                    {selectedImage?.name} • {(selectedImage?.size / 1024).toFixed(2)} KB
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground text-center">
                    <span className="font-medium">Click to upload</span> or drag and drop
                    <br />SVG, PNG, JPG or GIF (max. 10MB)
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Settings Area - Right Side */}
          <div className="space-y-4">
            {selectedImage ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {/* Width */}
                  <div className="space-y-1">
                    <Label htmlFor="width">Width (pixels)</Label>
                    <Input 
                      id="width" 
                      type="number" 
                      placeholder="Original width" 
                      value={width} 
                      onChange={(e) => setWidth(e.target.value)}
                    />
                  </div>
                  
                  {/* Height */}
                  <div className="space-y-1">
                    <Label htmlFor="height">Height (pixels)</Label>
                    <Input 
                      id="height" 
                      type="number" 
                      placeholder="Original height" 
                      value={height} 
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Keep Aspect Ratio */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="aspect-ratio" className="cursor-pointer">Maintain aspect ratio</Label>
                  <Switch 
                    id="aspect-ratio" 
                    checked={keepAspectRatio} 
                    onCheckedChange={setKeepAspectRatio} 
                  />
                </div>
                
                {/* Quality Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label htmlFor="quality">Quality: {quality}%</Label>
                  </div>
                  <Slider 
                    id="quality" 
                    min={1} 
                    max={100} 
                    step={1} 
                    value={[quality]} 
                    onValueChange={(values) => setQuality(values[0])} 
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Lower quality, smaller file</span>
                    <span>Higher quality, larger file</span>
                  </div>
                </div>
                
                {/* Output Format */}
                <div className="space-y-1">
                  <Label htmlFor="format">Output Format</Label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger id="format">
                      <SelectValue placeholder="Original format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original">Original format</SelectItem>
                      <SelectItem value="JPEG">JPEG</SelectItem>
                      <SelectItem value="PNG">PNG</SelectItem>
                      <SelectItem value="WEBP">WebP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={onClose}>Cancel</Button>
                  <Button 
                    onClick={handleProcessImage} 
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Process & Download'
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-muted-foreground">
                  Please upload an image to see processing options.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageProcessingModal; 