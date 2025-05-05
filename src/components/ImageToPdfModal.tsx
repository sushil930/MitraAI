import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiService } from '@/utils/apiService';
import { FileImage, Upload, X, FileUp, Loader2, Check, AlertCircle } from 'lucide-react';
import { Icon } from '@iconify/react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImageToPdfModalProps {
  open: boolean;
  onClose: () => void;
}

const ImageToPdfModal: React.FC<ImageToPdfModalProps> = ({ open, onClose }) => {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        setError(`File "${file.name}" is not an image. Only image files are allowed.`);
      }
      return isImage;
    });

    // Check if adding these files would exceed the 10 image limit
    if (selectedImages.length + validFiles.length > 10) {
      setError('Maximum 10 images allowed. Please remove some images first.');
      // Add only up to the limit
      const remainingSlots = 10 - selectedImages.length;
      if (remainingSlots > 0) {
        setSelectedImages(prev => [...prev, ...validFiles.slice(0, remainingSlots)]);
      }
      return;
    }

    setSelectedImages(prev => [...prev, ...validFiles]);
    setError(null);
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const handleConvertToPdf = async () => {
    if (selectedImages.length === 0) {
      setError('Please select at least one image');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const pdfBlob = await apiService.convertImagesToPdf(selectedImages);
      
      // Create a download link for the PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'converted_document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess(true);
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to convert images to PDF');
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="tabler:file-type-pdf" className="h-6 w-6" />
            Image to PDF Converter
          </DialogTitle>
          <DialogDescription>
            Convert up to 10 images into a single PDF document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Input (hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            multiple
            className="hidden"
          />

          {/* Upload Button */}
          <div className="flex justify-center">
            <Button 
              onClick={triggerFileInput} 
              variant="outline" 
              className="w-full py-8 border-dashed border-2"
              disabled={loading || selectedImages.length >= 10}
            >
              <Upload className="mr-2 h-5 w-5" />
              {selectedImages.length >= 10 ? 'Maximum images reached' : 'Select Images'}
            </Button>
          </div>

          {/* Selected Images */}
          {selectedImages.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Selected Images ({selectedImages.length}/10)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedImages.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-md overflow-hidden border bg-muted">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Selected image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-80 group-hover:opacity-100"
                      onClick={() => handleRemoveImage(index)}
                      disabled={loading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <p className="text-xs truncate mt-1">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <Check className="h-4 w-4" />
              <AlertDescription>PDF created successfully! Download started.</AlertDescription>
            </Alert>
          )}

          {/* Convert Button */}
          <Button
            onClick={handleConvertToPdf}
            className="w-full"
            disabled={selectedImages.length === 0 || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Convert to PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageToPdfModal;