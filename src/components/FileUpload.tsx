
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/utils/assistantUtils';

interface FileUploadProps {
  files: File[];
  onRemoveFile: (index: number) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ files, onRemoveFile }) => {
  if (files.length === 0) return null;
  
  return (
    <div className="w-full space-y-2 animate-fade-in">
      <p className="text-sm text-muted-foreground">Uploaded Files</p>
      <div className="flex flex-wrap gap-2">
        {files.map((file, index) => {
          // Determine if the file is an image
          const isImage = file.type.startsWith('image/');
          
          return (
            <div 
              key={`${file.name}-${index}`}
              className="relative rounded-lg border border-border p-2 flex items-center gap-3 bg-background/50"
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
