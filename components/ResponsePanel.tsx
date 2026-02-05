'use client';

import { Volume2, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ResponseSuggestion {
  original: string;
  translation: string;
  level: string;
}

interface ResponsePanelProps {
  suggestions: ResponseSuggestion[];
  isProcessing: boolean;
  sourceLanguage: string;
  onSpeak: (text: string, language: string) => void;
}

export default function ResponsePanel({
  suggestions,
  isProcessing,
  sourceLanguage,
  onSpeak,
}: ResponsePanelProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 h-[600px] flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Sugestões de Resposta</h2>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {isProcessing && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Gerando respostas...
            </span>
          </div>
        )}

        {!isProcessing && suggestions.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="text-center">
              As sugestões de resposta aparecerão aqui<br />
              quando alguém fizer uma pergunta
            </p>
          </div>
        )}

        {!isProcessing && suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20 hover:shadow-md transition"
          >
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  Resposta Sugerida #{index + 1}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSpeak(suggestion.original, sourceLanguage)}
                    className="text-purple-500 hover:text-purple-700 transition"
                    title="Ouvir resposta"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(suggestion.original, index)}
                    className="text-purple-500 hover:text-purple-700 transition"
                    title="Copiar resposta"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {suggestion.original}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                {suggestion.translation}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full">
                {suggestion.level || 'beginner'}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                Clique no ícone de som para praticar a pronúncia
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
