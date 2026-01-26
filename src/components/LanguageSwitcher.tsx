'use client';

import { useAdminLanguage, useUserLanguage } from '@/context/AppContext';
import { Globe, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface LanguageSwitcherProps {
  context?: 'admin' | 'user';
}

export function LanguageSwitcher({ context = 'user' }: LanguageSwitcherProps) {
  // Always call both hooks (React rules of hooks)
  const adminLang = useAdminLanguage();
  const userLang = useUserLanguage();

  // Select the appropriate one based on context
  const { language, availableLanguages, setLanguage, loading } = context === 'admin'
    ? adminLang
    : userLang;

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // NOW we can do conditional returns
  const currentLanguage = availableLanguages.find(l => l.code === language);

  // Don't render until languages are loaded
  if (loading) {
    return null;
  }

  // If only one language, don't show switcher
  if (availableLanguages.length <= 1) {
    return null;
  }

  // Always show dropdown for 2+ languages
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors"
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <Globe className="h-5 w-5" />
        <span className="text-sm font-medium">
          {currentLanguage?.native_name || language.toUpperCase()}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 min-w-[160px] bg-card border rounded-md shadow-lg z-50">
          <div className="py-1">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full text-start px-4 py-2 text-sm hover:bg-accent transition-colors ${
                  lang.code === language ? 'bg-accent/50 font-medium' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{lang.native_name}</span>
                  {lang.code === language && (
                    <span className="text-xs text-primary">✓</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{lang.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
