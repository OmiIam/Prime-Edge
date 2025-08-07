// File Upload Zone Component
// Drag-and-drop file upload with validation

import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileImage, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FileUploadZoneProps {
  onFilesChange: (files: FileList | File[]) => void;
  maxFiles: number;
  maxSize: number; // in bytes
  acceptedTypes: string[];
  disabled?: boolean;
  multiple?: boolean;
  accept?: string;
  capture?: string;
  className?: string;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesChange,
  maxFiles,
  maxSize,
  acceptedTypes,
  disabled = false,
  multiple = true,
  accept,
  capture,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validate files
  const validateFiles = useCallback((files: FileList | File[]): { valid: File[], invalid: string[] } => {
    const fileArray = Array.from(files);
    const valid: File[] = [];
    const invalid: string[] = [];

    // Check file count
    if (fileArray.length > maxFiles) {
      invalid.push(`Too many files. Maximum ${maxFiles} allowed.`);
      return { valid, invalid };
    }

    fileArray.forEach((file) => {
      // Check file size
      if (file.size > maxSize) {
        invalid.push(`${file.name}: File too large (max ${formatFileSize(maxSize)})`);
        return;
      }

      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        invalid.push(`${file.name}: Invalid file type. Allowed: ${acceptedTypes.join(', ')}`);
        return;
      }

      valid.push(file);
    });

    return { valid, invalid };
  }, [maxFiles, maxSize, acceptedTypes]);

  // Handle file selection
  const handleFiles = useCallback((files: FileList | File[]) => {
    if (disabled) return;

    const { valid, invalid } = validateFiles(files);

    if (invalid.length > 0) {
      // Show validation errors (could be replaced with toast notifications)
      console.error('File validation errors:', invalid);
      // You could show these errors in the UI or use toast notifications
      alert(invalid.join('\n'));
    }

    if (valid.length > 0) {
      onFilesChange(valid);
    }
  }, [disabled, validateFiles, onFilesChange]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    setDragCounter(prev => prev + 1);
    setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragOver(false);
      }
      return newCount;
    });
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    setDragCounter(0);
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, handleFiles]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, handleFiles]);

  // Trigger file input click
  const handleClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  // Handle keyboard interaction
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [disabled, handleClick]);

  return (
    <div className={className}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept || acceptedTypes.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
        capture={capture}
        aria-hidden="true"
      />

      {/* Upload Zone */}
      <Card
        className={`
          relative border-2 border-dashed transition-all duration-200 cursor-pointer
          ${isDragOver && !disabled
            ? 'border-blue-400 bg-blue-600/10 scale-105'
            : disabled
            ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed'
            : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
          }
        `}
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label={`Upload files. Maximum ${maxFiles} files, ${formatFileSize(maxSize)} each.`}
        aria-disabled={disabled}
      >
        <div className="p-8 text-center space-y-4">
          {/* Upload Icon */}
          <div className={`
            inline-flex p-4 rounded-full transition-colors
            ${isDragOver && !disabled
              ? 'bg-blue-600/20 text-blue-400'
              : disabled
              ? 'bg-gray-700 text-gray-500'
              : 'bg-white/10 text-gray-400'
            }
          `}>
            {capture ? (
              <FileImage className="h-8 w-8" />
            ) : (
              <Upload className="h-8 w-8" />
            )}
          </div>

          {/* Main Text */}
          <div className="space-y-2">
            <h3 className={`text-lg font-medium ${disabled ? 'text-gray-500' : 'text-white'}`}>
              {isDragOver && !disabled
                ? 'Drop files here'
                : capture
                ? 'Take a photo or upload files'
                : 'Drag and drop files here'
              }
            </h3>
            <p className={`text-sm ${disabled ? 'text-gray-600' : 'text-gray-400'}`}>
              {!disabled && (
                <>
                  or{' '}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-blue-400 hover:text-blue-300 underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClick();
                    }}
                    disabled={disabled}
                  >
                    browse files
                  </Button>
                </>
              )}
            </p>
          </div>

          {/* File Requirements */}
          <div className={`text-xs space-y-1 ${disabled ? 'text-gray-600' : 'text-gray-500'}`}>
            <p>Maximum {maxFiles} files • {formatFileSize(maxSize)} each</p>
            <p>Supported formats: {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}</p>
          </div>

          {/* Disabled State */}
          {disabled && (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Upload disabled</span>
            </div>
          )}
        </div>

        {/* Drag Overlay */}
        {isDragOver && !disabled && (
          <div className="absolute inset-0 bg-blue-600/20 border-2 border-blue-400 rounded-lg flex items-center justify-center">
            <div className="text-center space-y-2">
              <Upload className="h-12 w-12 text-blue-400 mx-auto" />
              <p className="text-lg font-medium text-blue-300">
                Release to upload files
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default FileUploadZone;