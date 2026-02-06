'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Settings, Upload, LinkIcon, FileText, X, Volume2, Copy, Check } from 'lucide-react';
import SpeechRecognitionService, { TranscriptResult } from '@/lib/speechRecognition';
import TranslationService from '@/lib/translationService';
import ResponseGenerator, { ResponseSuggestion } from '@/lib/responseGenerator';
import ContextExtractor, { ExtractedContext } from '@/lib/contextExtractor';
import SettingsPanel, { AIConfig } from './SettingsPanel';

interface ConversationTurn {
  id: string;
  original: string;
  translation: string;
  timestamp: number;
  suggestions: ResponseSuggestion[];
}

export default function InterviewTranslator() {
  const [isListening, setIsListening] = useState(false);
  const [conversations, setConversations] = useState<ConversationTurn[]>([]);
  const [currentInterim, setCurrentInterim] = useState<string>('');
  const [contexts, setContexts] = useState<ExtractedContext[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('pt-BR');
  const [learningLevel, setLearningLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showApiWarning, setShowApiWarning] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    provider: 'google',
    apiKey: '',
    model: 'gemini-3-flash-preview',
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionService | null>(null);
  const translationRef = useRef<TranslationService>(new TranslationService());
  const responseGenRef = useRef<ResponseGenerator>(new ResponseGenerator());
  const contextExtractorRef = useRef<ContextExtractor>(new ContextExtractor());

  useEffect(() => {
    const savedConfig = localStorage.getItem('aiConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setAiConfig(config);
        setShowApiWarning(!config.apiKey);
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    }
  }, []);

  useEffect(() => {
    recognitionRef.current = new SpeechRecognitionService(sourceLanguage);
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [sourceLanguage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversations, currentInterim]);

  const handleTranscriptResult = async (result: TranscriptResult) => {
    console.log('📝 Transcrição recebida:', result.text, 'Final:', result.isFinal);

    if (result.isFinal) {
      setCurrentInterim('');
      setIsProcessing(true);
      console.log('🔄 Processando frase final:', result.text);

      try {
        console.log('🌐 Traduzindo...');
        const translation = await translationRef.current.translate(
          result.text,
          sourceLanguage,
          targetLanguage
        );
        console.log('✅ Tradução:', translation.translatedText);

        const combinedContext = await contextExtractorRef.current.combineContexts(contexts);
        console.log('🤖 Gerando respostas com contexto...');
        const suggestions = await responseGenRef.current.generateResponse(
          result.text,
          combinedContext,
          sourceLanguage,
          targetLanguage,
          learningLevel
        );
        console.log('✅ Sugestões geradas:', suggestions.length);

        const turn: ConversationTurn = {
          id: Date.now().toString(),
          original: result.text,
          translation: translation.translatedText,
          timestamp: result.timestamp,
          suggestions: suggestions || [],
        };

        setConversations(prev => [...prev, turn]);
      } catch (error) {
        console.error('❌ Erro no processamento:', error);
        alert(`Erro: ${error}\n\nVerifique se configurou a API Key!`);
      } finally {
        setIsProcessing(false);
      }
    } else {
      setCurrentInterim(result.text);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('⚠️ Web Speech API não disponível. Use Chrome ou Edge!');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      console.log('🛑 Gravação parada');
    } else {
      console.log('🎤 Iniciando gravação...');
      console.log('Idioma configurado:', sourceLanguage);
      recognitionRef.current.start(handleTranscriptResult, (error) => {
        console.error('❌ Erro na transcrição:', error);
        alert(`Erro na transcrição: ${error}\n\nVerifique:\n1. Permissão do microfone\n2. Use Chrome ou Edge\n3. HTTPS ou localhost`);
        setIsListening(false);
      });
      setIsListening(true);
    }
  };

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const context = await contextExtractorRef.current.extractFromPDF(file);
      setContexts(prev => [...prev, context]);
    } catch (error) {
      console.error('PDF upload error:', error);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleURLAdd = async () => {
    const url = prompt('Cole o link (Canva, LinkedIn, etc.):');
    if (!url) return;

    try {
      const context = await contextExtractorRef.current.extractFromURL(url);
      setContexts(prev => [...prev, context]);
    } catch (error) {
      console.error('URL extraction error:', error);
    }
  };

  const removeContext = (index: number) => {
    setContexts(prev => prev.filter((_, i) => i !== index));
  };

  const speakText = (text: string, language: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSaveConfig = (config: AIConfig) => {
    setAiConfig(config);
    localStorage.setItem('aiConfig', JSON.stringify(config));
    localStorage.setItem('aiApiKey', config.apiKey);
    localStorage.setItem('aiProvider', config.provider);
    localStorage.setItem('aiModel', config.model);
    setShowApiWarning(!config.apiKey);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Compact Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-3 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">🎙️ Tradutor de Entrevistas</h1>
            <p className="text-xs text-gray-400">
              {sourceLanguage === 'en' ? '🇺🇸' : '🇧🇷'} → {targetLanguage === 'pt-BR' ? '🇧🇷' : '🇺🇸'}
            </p>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition"
            title="Configurações"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {showApiWarning && (
          <div className="mt-1 bg-yellow-900/50 border border-yellow-700 rounded p-1.5 flex items-center justify-between text-xs">
            <span className="text-yellow-300">⚠️ Configure API</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="bg-yellow-700 hover:bg-yellow-600 text-white px-2 py-0.5 rounded"
            >
              Config
            </button>
          </div>
        )}
      </header>

      {/* Context Display - More Visible */}
      {contexts.length > 0 && (
        <div className="bg-gray-800 border-b border-gray-700 px-3 py-2 flex-shrink-0">
          <div className="text-xs text-gray-400 mb-1 font-semibold">📄 Contextos ({contexts.length}):</div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {contexts.map((ctx, idx) => (
              <div
                key={idx}
                className="bg-blue-900/30 border border-blue-700 rounded px-2 py-1 flex items-start gap-2 group text-xs"
              >
                <FileText className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-blue-300 font-medium truncate">{ctx.source.name}</div>
                  <div className="text-blue-400/70 text-[10px] line-clamp-1">{ctx.summary}</div>
                </div>
                <button
                  onClick={() => removeContext(idx)}
                  className="text-red-400 hover:text-red-300 transition flex-shrink-0"
                  title="Remover"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compact Conversation Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {conversations.length === 0 && !currentInterim && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Mic className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-center text-sm">
              Clique no botão para iniciar<br />
              a captura de áudio
            </p>
          </div>
        )}

        {conversations.map((turn) => (
          <div key={turn.id} className="space-y-2">
            {/* Question - Compact */}
            <div className="flex justify-end">
              <div className="max-w-[85%] bg-blue-600 rounded-xl rounded-tr-sm px-3 py-2 shadow-lg">
                <p className="text-white font-medium text-base">{turn.original}</p>
                <p className="text-blue-200 text-xs mt-0.5">{turn.translation}</p>
                <button
                  onClick={() => speakText(turn.original, sourceLanguage)}
                  className="mt-1 text-blue-200 hover:text-white transition"
                >
                  <Volume2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Suggested Responses - Compact */}
            {turn.suggestions.map((suggestion, idx) => (
              <div key={idx} className="flex justify-start">
                <div className="max-w-[85%] bg-gray-800 border border-gray-700 rounded-xl rounded-tl-sm px-3 py-2 shadow-lg">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1">
                      <p className="text-white font-medium text-base">{suggestion.original}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{suggestion.translation}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => speakText(suggestion.original, sourceLanguage)}
                        className="text-green-400 hover:text-green-300 transition"
                        title="Ouvir"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(suggestion.original, `${turn.id}-${idx}`)}
                        className="text-green-400 hover:text-green-300 transition"
                        title="Copiar"
                      >
                        {copiedId === `${turn.id}-${idx}` ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <span className="text-[10px] text-green-500 font-medium">
                    Sugestão {idx + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}

        {currentInterim && (
          <div className="flex justify-end">
            <div className="max-w-[85%] bg-blue-500/30 border border-blue-500 rounded-xl rounded-tr-sm px-3 py-2 animate-pulse">
              <p className="text-blue-200 italic text-sm">{currentInterim}</p>
              <p className="text-[10px] text-blue-400 mt-0.5">Ouvindo...</p>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="max-w-[85%] bg-gray-800 border border-gray-700 rounded-xl rounded-tl-sm px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                <p className="text-gray-400 text-xs ml-1">Gerando respostas...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-3 py-2 flex-shrink-0 sticky bottom-0">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handlePDFUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full text-gray-300 transition"
            title="Upload PDF"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button
            onClick={handleURLAdd}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full text-gray-300 transition"
            title="Adicionar Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            onClick={toggleListening}
            className={`flex-1 py-2.5 px-4 rounded-full font-semibold text-white transition flex items-center justify-center gap-2 text-sm ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5" />
                Parar
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                Iniciar
              </>
            )}
          </button>
        </div>
      </div>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveConfig}
        currentConfig={aiConfig}
      />
    </div>
  );
}
