// Country Select Component for KYC Form
// Searchable dropdown with flags and ISO codes

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { COUNTRIES, searchCountries, getCountryByCode, type Country } from '../../lib/countries';

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  onBlur,
  disabled = false,
  className = '',
  placeholder = 'Select your country'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Get selected country for display
  const selectedCountry = value ? getCountryByCode(value) : null;

  // Update filtered countries when search changes
  useEffect(() => {
    const results = searchCountries(searchQuery);
    setFilteredCountries(results);
    setHighlightedIndex(-1);
  }, [searchQuery]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onBlur?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onBlur]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  // Handle country selection
  const handleCountrySelect = useCallback((country: Country) => {
    onChange(country.code);
    setIsOpen(false);
    setSearchQuery('');
  }, [onChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        break;
      
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredCountries.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCountries.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredCountries[highlightedIndex]) {
          handleCountrySelect(filteredCountries[highlightedIndex]);
        }
        break;
    }
  }, [isOpen, highlightedIndex, filteredCountries, handleCountrySelect]);

  // Clear selection
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  }, [onChange]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Select Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full justify-between h-10 px-3 py-2 text-left font-normal
          ${selectedCountry ? 'text-white' : 'text-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          bg-white/5 border-white/20 hover:bg-white/10 focus:ring-2 focus:ring-blue-500
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select country"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectedCountry ? (
            <>
              <span className="text-lg flex-shrink-0" role="img" aria-label={selectedCountry.name}>
                {selectedCountry.flag}
              </span>
              <span className="truncate">{selectedCountry.name}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">
                ({selectedCountry.code})
              </span>
            </>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedCountry && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-4 w-4 p-0 hover:bg-white/20 text-gray-400 hover:text-white"
              tabIndex={-1}
              aria-label="Clear selection"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <Card className="absolute z-50 w-full mt-1 p-0 bg-gray-800 border-white/20 shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchRef}
                type="text"
                placeholder="Search countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 bg-white/5 border-white/20 text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Countries List */}
          <div className="max-h-60 overflow-y-auto" role="listbox">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country, index) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={`
                    w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-white/10 transition-colors
                    ${index === highlightedIndex ? 'bg-white/10' : ''}
                    ${country.code === value ? 'bg-blue-600/20 text-blue-300' : 'text-white'}
                  `}
                  role="option"
                  aria-selected={country.code === value}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className="text-lg flex-shrink-0" role="img" aria-label={country.name}>
                    {country.flag}
                  </span>
                  <span className="flex-1 truncate">{country.name}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {country.code}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-8 text-center text-gray-400">
                {searchQuery ? `No countries found for "${searchQuery}"` : 'No countries available'}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-white/10 text-xs text-gray-400 text-center">
            {filteredCountries.length} countries shown
          </div>
        </Card>
      )}
    </div>
  );
};

export default CountrySelect;