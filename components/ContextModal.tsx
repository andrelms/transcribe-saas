'use client';

import { X, ExternalLink, FileText, Link as LinkIcon } from 'lucide-react';
import { ExtractedContext } from '@/lib/contextExtractor';

interface ContextModalProps {
  context: ExtractedContext | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ContextModal({ context, isOpen, onClose }: ContextModalProps) {
  if (!isOpen || !context) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-blue-500">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-blue-900 to-purple-900">
          <div className="flex items-center gap-3">
            {context.source.type === 'pdf' ? (
              <FileText className="w-6 h-6 text-blue-400" />
            ) : (
              <LinkIcon className="w-6 h-6 text-purple-400" />
            )}
            <div>
              <h2 className="text-xl font-bold text-white">{context.source.name}</h2>
              <p className="text-sm text-gray-400 flex items-center gap-2">
                {context.source.type === 'url' && context.source.url && (
                  <a
                    href={context.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-400 transition flex items-center gap-1"
                  >
                    {context.source.url.length > 50
                      ? context.source.url.substring(0, 50) + '...'
                      : context.source.url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {context.source.type === 'pdf' && (
                  <span>PDF Document</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-2 rounded-full hover:bg-gray-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary */}
          <div>
            <h3 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
              📝 Resumo
            </h3>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-200 leading-relaxed">{context.summary}</p>
            </div>
          </div>

          {/* Full Content */}
          <div>
            <h3 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
              📄 Conteúdo Completo
            </h3>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 max-h-96 overflow-y-auto">
              <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                {context.content}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div>
            <h3 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
              ℹ️ Informações
            </h3>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Tipo:</span>
                  <span className="ml-2 text-white font-medium">
                    {context.source.type === 'pdf' ? 'PDF' : 'Link/URL'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Caracteres:</span>
                  <span className="ml-2 text-white font-medium">
                    {context.content.length.toLocaleString()}
                  </span>
                </div>
                {context.source.type === 'url' && context.source.url && (
                  <div className="col-span-2">
                    <span className="text-gray-400">URL completa:</span>
                    <a
                      href={context.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-400 hover:text-blue-300 break-all"
                    >
                      {context.source.url}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Visual Indicator for Context Usage */}
          <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg p-4 border border-green-700/50">
            <p className="text-sm text-green-300 flex items-center gap-2">
              <span className="text-xl">✓</span>
              Este contexto está sendo usado para gerar respostas mais precisas e personalizadas
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
