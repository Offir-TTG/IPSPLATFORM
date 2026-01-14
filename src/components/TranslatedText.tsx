'use client';

import React from 'react';

/**
 * TranslatedText component - Wraps translated text to suppress hydration warnings
 *
 * This component is needed because:
 * 1. Server renders with empty translations (no localStorage access)
 * 2. Client loads cached translations synchronously from localStorage
 * 3. This causes hydration mismatch which is expected for i18n
 *
 * Usage:
 * <TranslatedText as="h1" className="...">{t('key', 'fallback')}</TranslatedText>
 */

interface TranslatedTextProps {
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function TranslatedText({
  as: Component = 'span',
  className,
  style,
  children
}: TranslatedTextProps) {
  return (
    <Component
      className={className}
      style={style}
      suppressHydrationWarning
    >
      {children}
    </Component>
  );
}
