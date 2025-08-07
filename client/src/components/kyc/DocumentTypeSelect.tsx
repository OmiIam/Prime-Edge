// Document Type Selector Component
// Multi-select for identity document types

import React, { useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, FileText, CreditCard, Bookmark, IdCard } from 'lucide-react';
import { DocumentType } from '../../types/kyc';

interface DocumentTypeOption {
  type: DocumentType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const DOCUMENT_TYPE_OPTIONS: DocumentTypeOption[] = [
  {
    type: 'PASSPORT',
    label: 'Passport',
    icon: <Bookmark className="h-4 w-4" />,
    description: 'Government-issued passport'
  },
  {
    type: 'DRIVERS_LICENSE',
    label: 'Driver\'s License',
    icon: <CreditCard className="h-4 w-4" />,
    description: 'Valid driver\'s license'
  },
  {
    type: 'NATIONAL_ID',
    label: 'National ID',
    icon: <IdCard className="h-4 w-4" />,
    description: 'National identity card'
  },
  {
    type: 'STATE_ID',
    label: 'State ID',
    icon: <FileText className="h-4 w-4" />,
    description: 'State-issued ID card'
  }
];

interface DocumentTypeSelectProps {
  values: DocumentType[];
  onChange: (types: DocumentType[]) => void;
  maxSelections?: number;
  disabled?: boolean;
  className?: string;
}

const DocumentTypeSelect: React.FC<DocumentTypeSelectProps> = ({
  values,
  onChange,
  maxSelections = 3,
  disabled = false,
  className = ''
}) => {
  // Toggle document type selection
  const toggleDocumentType = useCallback((type: DocumentType) => {
    if (disabled) return;

    if (values.includes(type)) {
      // Remove if already selected
      onChange(values.filter(t => t !== type));
    } else if (values.length < maxSelections) {
      // Add if under limit
      onChange([...values, type]);
    }
  }, [values, onChange, maxSelections, disabled]);

  // Remove specific document type
  const removeDocumentType = useCallback((type: DocumentType, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(values.filter(t => t !== type));
  }, [values, onChange, disabled]);

  // Get option for document type
  const getOption = (type: DocumentType): DocumentTypeOption => {
    return DOCUMENT_TYPE_OPTIONS.find(opt => opt.type === type) || DOCUMENT_TYPE_OPTIONS[0];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">
          Document Types * ({values.length}/{maxSelections} selected)
        </h4>
        {values.length > 0 && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange([])}
            className="text-xs text-gray-400 hover:text-white h-6"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Selected Types Display */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((type, index) => {
            const option = getOption(type);
            return (
              <Badge
                key={`${type}-${index}`}
                variant="secondary"
                className="flex items-center gap-2 px-3 py-1 bg-blue-600/20 text-blue-300 border-blue-400/30 hover:bg-blue-600/30"
              >
                {option.icon}
                <span>{option.label}</span>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => removeDocumentType(type, e)}
                    className="h-4 w-4 p-0 hover:bg-blue-400/20 text-blue-300 hover:text-white ml-1"
                    tabIndex={-1}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Document Type Options */}
      <div className="grid gap-3 md:grid-cols-2">
        {DOCUMENT_TYPE_OPTIONS.map((option) => {
          const isSelected = values.includes(option.type);
          const isDisabled = disabled || (!isSelected && values.length >= maxSelections);

          return (
            <Card
              key={option.type}
              className={`
                cursor-pointer transition-all duration-200 border p-4
                ${isSelected 
                  ? 'border-blue-400/50 bg-blue-600/10 shadow-lg shadow-blue-600/20' 
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }
                ${isDisabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:scale-[1.02]'
                }
              `}
              onClick={() => !isDisabled && toggleDocumentType(option.type)}
              role="button"
              tabIndex={isDisabled ? -1 : 0}
              onKeyDown={(e) => {
                if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  toggleDocumentType(option.type);
                }
              }}
              aria-pressed={isSelected}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  p-2 rounded-lg transition-colors
                  ${isSelected 
                    ? 'bg-blue-600/20 text-blue-400' 
                    : 'bg-white/10 text-gray-400'
                  }
                `}>
                  {option.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h5 className={`
                    font-medium text-sm
                    ${isSelected ? 'text-blue-300' : 'text-white'}
                  `}>
                    {option.label}
                  </h5>
                  <p className="text-xs text-gray-400 mt-1">
                    {option.description}
                  </p>
                </div>

                {isSelected && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path 
                          fillRule="evenodd" 
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-400 space-y-1">
        <p>• Select the types of identity documents you'll be uploading</p>
        <p>• You can select up to {maxSelections} different document types</p>
        <p>• Make sure each document is clear, readable, and shows all corners</p>
      </div>

      {/* Validation Message */}
      {values.length === 0 && (
        <p className="text-yellow-400 text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Please select at least one document type
        </p>
      )}

      {values.length >= maxSelections && (
        <p className="text-blue-400 text-sm">
          Maximum document types selected ({maxSelections})
        </p>
      )}
    </div>
  );
};

export default DocumentTypeSelect;