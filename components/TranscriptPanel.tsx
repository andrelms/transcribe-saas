'use client';

import { useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';

interface TranscriptEntry {
  id: string;
  original: string;
  translation: string;
  timestamp: number;
  isFinal: boolean;
}

interface TranscriptPanelProps {
  transcripts: TranscriptEntry[];
  currentInterim: string;
  sourceLanguage: string;
  targetLanguage: string;
  onSpeak: (text: string, language: string) => void;
}

export default function TranscriptPanel({
  transcripts,
  currentInterim,
  sourceLanguage,
  targetLanguage,
  onSpeak,
}: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, currentInterim]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 h-[600px] flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Transcrição e Tradução</h2>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2"
      >
        {transcripts.map((entry) => (
          <div
            key={entry.id}
            className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-r"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Original:
                  </p>
                  <button
                    onClick={() => onSpeak(entry.original, sourceLanguage)}
                    className="text-blue-500 hover:text-blue-700 transition"
                    title="Ouvir original"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-900 dark:text-white mb-2">
                  {entry.original}
                </p>

                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Tradução:
                  </p>
                  <button
                    onClick={() => onSpeak(entry.translation, targetLanguage)}
                    className="text-green-500 hover:text-green-700 transition"
                    title="Ouvir tradução"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-green-700 dark:text-green-400">
                  {entry.translation}
                </p>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {formatTime(entry.timestamp)}
              </span>
            </div>
          </div>
        ))}

        {currentInterim && (
          <div className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-r animate-pulse">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Processando...
            </p>
            <p className="text-gray-700 dark:text-gray-300 italic">
              {currentInterim}
            </p>
          </div>
        )}

        {transcripts.length === 0 && !currentInterim && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="text-center">
              Clique em "Iniciar Gravação" para começar<br />
              a transcrever e traduzir em tempo real
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
