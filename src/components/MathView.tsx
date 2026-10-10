/**
 * Mathematical Formatting Component
 * Renders mathematical expressions cleanly using KaTeX instead of displaying raw LaTeX strings.
 * Formats mathematical variables, summations, fractions, subscripts, and Greek symbols.
 */

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  math?: string;
  formula?: string;
  block?: boolean;
  className?: string;
  fontSize?: 'sm' | 'base' | 'lg' | 'xl';
}

export const MathView: React.FC<MathViewProps> = ({ 
  math, 
  formula,
  block = false, 
  className = '',
  fontSize = block ? 'base' : 'sm'
}) => {
  const content = math || formula || '';
  const html = useMemo(() => {
    if (!content) return '';

    try {
      let cleaned = content.trim();

      // If wrapped in $$...$$ or $...$, strip outer delimiters for KaTeX renderToString
      if (cleaned.startsWith('$$') && cleaned.endsWith('$$') && cleaned.length > 4) {
        cleaned = cleaned.slice(2, -2).trim();
      } else if (cleaned.startsWith('$') && cleaned.endsWith('$') && cleaned.length > 2) {
        cleaned = cleaned.slice(1, -1).trim();
      }

      return katex.renderToString(cleaned, {
        displayMode: block,
        throwOnError: false,
        output: 'htmlAndMathml',
        trust: true
      });
    } catch (e) {
      console.warn('KaTeX render error:', e);
      return `<span class="font-mono text-xs text-zinc-300">${math}</span>`;
    }
  }, [math, block]);

  const sizeClasses = {
    sm: 'text-[12px]',
    base: 'text-[14px]',
    lg: 'text-[16px]',
    xl: 'text-[18px]'
  }[fontSize];

  if (block) {
    return (
      <div 
        className={`math-formula-box overflow-x-auto my-1.5 text-zinc-100 flex items-center justify-start ${sizeClasses} ${className}`} 
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    );
  }

  return (
    <span 
      className={`inline-flex items-center align-middle text-zinc-100 ${sizeClasses} ${className}`} 
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
};
