'use client';

import { useState, useRef } from 'react';
import { Upload, LinkIcon, FileText, X, Loader } from 'lucide-react';
import { ExtractedContext } from '@/lib/contextExtractor';

interface ContextPanelProps {
  contexts: ExtractedContext[];
  onPDFUpload: (file: File) => Promise<void>;
  onURLAdd: (url: string) => Promise<void>;
  onRemove: (index: number) => void;
}

export default function ContextPanel({
  contexts,
  onPDFUpload,
  onURLAdd,
  onRemove,
}: ContextPanelProps) {
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      await onPDFUpload(file);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleURLSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsLoading(true);
    try {
      await onURLAdd(urlInput);
      setUrlInput('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Contexto da Entrevista
      </h2>

      <div className="space-y-3 mb-4">
        {/* PDF Upload */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="pdf-upload"
          />
          <label
            htmlFor="pdf-upload"
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer transition"
          >
            <Upload className="w-4 h-4" />
            Upload PDF
          </label>
        </div>

        {/* URL Input */}
        <form onSubmit={handleURLSubmit} className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Cole um link (Canva, LinkedIn, etc.)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 transition"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </form>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader className="w-5 h-5 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            Processando...
          </span>
        </div>
      )}

      {/* Context List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {contexts.map((context, index) => (
          <div
            key={index}
            className="bg-gray-100 dark:bg-gray-700 rounded-md p-3 relative group"
          >
            <button
              onClick={() => onRemove(index)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <p className="font-semibold text-sm mb-1">{context.source.name}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {context.summary}
            </p>

            {context.keyPoints && context.keyPoints.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Pontos-chave:
                </p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                  {context.keyPoints.slice(0, 3).map((point, idx) => (
                    <li key={idx} className="line-clamp-1">• {point}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {contexts.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            Adicione PDFs ou links para melhorar as respostas
          </p>
        )}
      </div>
    </div>
  );
}
