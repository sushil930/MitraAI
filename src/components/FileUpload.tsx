
import React from 'react';
import { X, Search } from 'lucide-react'; // Add Search icon
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/utils/assistantUtils';

interface FileUploadProps {
  files: File[];
  onRemoveFile: (index: number) => void;
  onSelectImageForSearch?: (index: number) => void; // New prop
  selectedImageForSearch?: File | null; // New prop
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  files, 
  onRemoveFile, 
  onSelectImageForSearch,
  selectedImageForSearch 
}) => {
  if (files.length === 0) return null;
  
  return (
    <div className="w-full space-y-2 animate-fade-in">
      <p className="text-sm text-muted-foreground">
        {selectedImageForSearch ? (
          <span className="flex items-center text-assistant-pink">
            <Search className="h-3 w-3 mr-1" /> 
            Ask a question about the selected image
          </span>
        ) : (
          "Uploaded Files"
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {files.map((file, index) => {
          // Determine if the file is an image
          const isImage = file.type.startsWith('image/');
          const isSelected = selectedImageForSearch === file;
          
          return (
            <div 
              key={`${file.name}-${index}`}
              className={`relative rounded-lg border p-2 flex items-center gap-3 bg-background/50 ${isSelected ? 'border-assistant-pink ring-1 ring-assistant-pink' : 'border-border'}`}
            >
              {isImage ? (
                <div className="w-12 h-12 rounded-md overflow-hidden bg-secondary/30 flex items-center justify-center">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={file.name}
                    className="w-full h-full object-cover"
                    onLoad={() => URL.revokeObjectURL(URL.createObjectURL(file))}
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-md bg-secondary/30 flex items-center justify-center">
                  <span className="text-xs uppercase font-medium">
                    {file.name.split('.').pop() || 'file'}
                  </span>
                </div>
              )}
              
              <div className="overflow-hidden max-w-[150px]">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              
              {/* Add search button for images */}
              {isImage && onSelectImageForSearch && (
                <Button
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  className={`absolute bottom-1 right-7 h-6 w-6 p-0 rounded-full ${isSelected ? 'bg-assistant-pink hover:bg-assistant-pink/90' : ''}`}
                  onClick={() => onSelectImageForSearch(index)}
                  title={isSelected ? "Selected for search" : "Search this image"}
                >
                  <Search className="h-3 w-3" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
                onClick={() => onRemoveFile(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileUpload;
