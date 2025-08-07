// Upload Progress Component
// Shows upload progress for KYC file submissions

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileImage, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Upload,
  Clock
} from 'lucide-react';
import { UploadStatus } from '../../types/kyc';

interface UploadProgressProps {
  uploads: UploadStatus[];
  onRetry?: (uploadId: string) => void;
  onCancel?: (uploadId: string) => void;
  className?: string;
}

const UploadProgress: React.FC<UploadProgressProps> = ({
  uploads,
  onRetry,
  onCancel,
  className = ''
}) => {
  // Get status display info
  const getStatusInfo = (status: UploadStatus['status']) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="h-4 w-4" />,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10',
          borderColor: 'border-yellow-400/30',
          label: 'Waiting'
        };
      case 'uploading':
        return {
          icon: <Upload className="h-4 w-4 animate-pulse" />,
          color: 'text-blue-400',
          bgColor: 'bg-blue-400/10',
          borderColor: 'border-blue-400/30',
          label: 'Uploading'
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          color: 'text-green-400',
          bgColor: 'bg-green-400/10',
          borderColor: 'border-green-400/30',
          label: 'Complete'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          borderColor: 'border-red-400/30',
          label: 'Failed'
        };
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format upload speed
  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Calculate remaining time
  const formatTimeRemaining = (upload: UploadStatus): string => {
    if (upload.status !== 'uploading' || !upload.speed || upload.progress === 100) {
      return '';
    }
    
    const remainingBytes = (upload.file.size * (100 - upload.progress)) / 100;
    const secondsRemaining = remainingBytes / upload.speed;
    
    if (secondsRemaining < 60) {
      return `${Math.ceil(secondsRemaining)}s remaining`;
    } else if (secondsRemaining < 3600) {
      return `${Math.ceil(secondsRemaining / 60)}m remaining`;
    } else {
      return `${Math.ceil(secondsRemaining / 3600)}h remaining`;
    }
  };

  if (uploads.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">
          Upload Progress ({uploads.filter(u => u.status === 'completed').length}/{uploads.length} complete)
        </h4>
      </div>

      <div className="space-y-3">
        {uploads.map((upload) => {
          const statusInfo = getStatusInfo(upload.status);
          const timeRemaining = formatTimeRemaining(upload);

          return (
            <div
              key={upload.id}
              className={`
                border rounded-lg p-4 transition-all
                ${statusInfo.bgColor} ${statusInfo.borderColor}
              `}
            >
              {/* File Info Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* File Type Icon */}
                  <div className={`p-1.5 rounded ${statusInfo.bgColor}`}>
                    {upload.file.type.startsWith('image/') ? (
                      <FileImage className="h-4 w-4 text-blue-400" />
                    ) : (
                      <FileText className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  
                  {/* File Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {upload.file.name}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${statusInfo.color} ${statusInfo.borderColor}`}
                      >
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">
                        {formatFileSize(upload.file.size)}
                      </span>
                      {upload.type && (
                        <span className="text-xs text-gray-400">
                          {upload.type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Icon & Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={statusInfo.color}>
                    {statusInfo.icon}
                  </div>
                  
                  {/* Action Buttons */}
                  {upload.status === 'error' && onRetry && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRetry(upload.id)}
                      className="text-blue-400 hover:text-blue-300 h-6 px-2 text-xs"
                    >
                      Retry
                    </Button>
                  )}
                  
                  {(upload.status === 'pending' || upload.status === 'uploading') && onCancel && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onCancel(upload.id)}
                      className="text-red-400 hover:text-red-300 h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {upload.status === 'uploading' && (
                <div className="space-y-2">
                  <Progress 
                    value={upload.progress} 
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      {upload.progress.toFixed(1)}% complete
                    </span>
                    <div className="flex items-center gap-3 text-gray-400">
                      {upload.speed && (
                        <span>{formatSpeed(upload.speed)}</span>
                      )}
                      {timeRemaining && (
                        <span>{timeRemaining}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Completed Progress */}
              {upload.status === 'completed' && (
                <div className="space-y-2">
                  <Progress value={100} className="h-2" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-green-400">Upload complete</span>
                    {upload.uploadedAt && (
                      <span className="text-gray-400">
                        {new Date(upload.uploadedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Error Details */}
              {upload.status === 'error' && upload.error && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-400/30 rounded text-xs text-red-300">
                  {upload.error}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall Progress Summary */}
      <div className="flex items-center justify-between text-sm text-gray-400 pt-2 border-t border-white/10">
        <span>
          {uploads.filter(u => u.status === 'completed').length} of {uploads.length} files uploaded
        </span>
        {uploads.some(u => u.status === 'uploading') && (
          <span className="text-blue-400">
            Uploading...
          </span>
        )}
        {uploads.every(u => u.status === 'completed') && uploads.length > 0 && (
          <span className="text-green-400 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            All files uploaded
          </span>
        )}
        {uploads.some(u => u.status === 'error') && (
          <span className="text-red-400 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            Some uploads failed
          </span>
        )}
      </div>
    </div>
  );
};

export default UploadProgress;