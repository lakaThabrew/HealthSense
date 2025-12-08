
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Parser that actively strips markdown syntax for a clean look
  const parseContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Handle Disclaimer styling specifically
      if (line.includes("Disclaimer: HealthSense")) {
        return (
          <p key={index} className="text-xs text-slate-500 dark:text-slate-400 italic mt-4 border-t dark:border-slate-700 pt-2 border-slate-200">
            {line.replace(/\*/g, '')}
          </p>
        );
      }

      // Clean the line of common markdown symbols
      let cleanLine = line
        .replace(/\*\*/g, '')   // Remove bold **
        .replace(/__/g, '')     // Remove bold __
        .replace(/^#+\s/, '')   // Remove Headers #
        .replace(/^\*\s/, '')   // Remove list bullets *
        .replace(/^-\s/, '')    // Remove list dashes -
        .trim();

      // If line was a list item (started with * or -), add bullet manually for structure without markdown chars
      const isListItem = line.trim().startsWith('* ') || line.trim().startsWith('- ');
      const isHeader = line.trim().endsWith(':') && line.length < 50;

      if (isHeader) {
          return <div key={index} className="mt-3 mb-1 font-bold text-indigo-800 dark:text-indigo-400">{cleanLine}</div>
      }

      if (isListItem) {
        return (
          <div key={index} className="flex items-start ml-2 mb-1">
            <span className="mr-2 text-indigo-500 dark:text-indigo-400">•</span>
            <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{cleanLine}</span>
          </div>
        );
      }

      // Empty lines
      if (line.trim() === '') {
        return <div key={index} className="h-2"></div>;
      }

      // Standard paragraph
      return <p key={index} className="mb-1 text-slate-700 dark:text-slate-300 leading-relaxed">{cleanLine}</p>;
    });
  };

  return <div className="text-sm md:text-base">{parseContent(content)}</div>;
};

export default MarkdownRenderer;
