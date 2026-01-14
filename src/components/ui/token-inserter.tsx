'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export interface Token {
  key: string;
  label: string;
  labelKey?: string; // Translation key for label
  description?: string;
  descriptionKey?: string; // Translation key for description
  category?: string;
}

interface TokenInserterProps {
  tokens: Token[];
  onInsertToken: (tokenKey: string) => void;
  direction?: 'ltr' | 'rtl';
  isRtl?: boolean;
  t?: (key: string, fallback: string) => string; // Translation function
}

export const TokenInserter: React.FC<TokenInserterProps> = ({
  tokens,
  onInsertToken,
  direction = 'ltr',
  isRtl = false,
  t,
}) => {
  // Group tokens by category
  const groupedTokens: Record<string, Token[]> = {};
  tokens.forEach((token) => {
    const category = token.category || 'general';
    if (!groupedTokens[category]) {
      groupedTokens[category] = [];
    }
    groupedTokens[category].push(token);
  });

  const translate = (key: string | undefined, fallback: string) => {
    if (!key || !t) return fallback;
    return t(key, fallback);
  };

  return (
    <div className={`space-y-2 ${isRtl ? 'text-right' : 'text-left'}`} dir={direction}>
      <p className="text-xs font-medium text-muted-foreground">
        {translate('lms.lesson.token_insert_help', isRtl ? 'לחץ להוספת מציין מיקום:' : 'Click to insert placeholder:')}
      </p>
      <div className="flex flex-wrap gap-2">
        {Object.entries(groupedTokens).map(([category, categoryTokens]) => (
          <div key={category} className="contents">
            {categoryTokens.map((token) => (
              <Button
                key={token.key}
                variant="outline"
                size="sm"
                type="button"
                onClick={() => onInsertToken(token.key)}
                className="h-7 text-xs px-2 py-0.5"
                title={translate(token.descriptionKey, token.description || '')}
              >
                <Plus className={`h-3 w-3 ${isRtl ? 'ml-1' : 'mr-1'}`} />
                <span className="text-xs font-medium">{translate(token.labelKey, token.label)}</span>
              </Button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TokenInserter;
