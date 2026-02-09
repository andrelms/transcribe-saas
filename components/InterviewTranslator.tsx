'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Settings, Upload, LinkIcon, FileText, X, Volume2, Copy, Check, Monitor, VolumeX } from 'lucide-react';
import SpeechRecognitionService, { TranscriptResult } from '@/lib/speechRecognition';
import SystemAudioCapture, { AudioCaptureResult } from '@/lib/systemAudioCapture';
import TranslationService from '@/lib/translationService';
import ResponseGenerator, { ResponseSuggestion } from '@/lib/responseGenerator';
import ContextExtractor, { ExtractedContext } from '@/lib/contextExtractor';
import SettingsPanel, { AIConfig } from './SettingsPanel';
import ContextModal from './ContextModal';

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
  const [currentInterimTranslation, setCurrentInterimTranslation] = useState<string>('');
  const [contexts, setContexts] = useState<ExtractedContext[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('pt-BR');
  const [learningLevel, setLearningLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showApiWarning, setShowApiWarning] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [audioSource, setAudioSource] = useState<'microphone' | 'system'>('microphone');
  const [selectedContext, setSelectedContext] = useState<ExtractedContext | null>(null);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted by default
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    provider: 'google',
    apiKey: '',
    model: 'gemini-3-flash-preview',
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionService | null>(null);
  const systemAudioRef = useRef<SystemAudioCapture | null>(null);
  const translationRef = useRef<TranslationService>(new TranslationService());
  const responseGenRef = useRef<ResponseGenerator>(new ResponseGenerator());
  const contextExtractorRef = useRef<ContextExtractor>(new ContextExtractor());
  const translationDebounceRef = useRef<NodeJS.Timeout | null>(null);

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
    systemAudioRef.current = new SystemAudioCapture(sourceLanguage);
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (systemAudioRef.current) {
        systemAudioRef.current.stop();
      }
      if (translationDebounceRef.current) {
        clearTimeout(translationDebounceRef.current);
      }
    };
  }, [sourceLanguage]);

  useEffect(() => {
    if (systemAudioRef.current && aiConfig.apiKey) {
      systemAudioRef.current.setApiConfig(aiConfig.apiKey, aiConfig.provider, aiConfig.model);
    }
  }, [aiConfig]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversations, currentInterim, currentInterimTranslation]);

  const handleTranscriptResult = async (result: TranscriptResult) => {
    console.log('📝 Transcrição recebida:', result.text, 'Final:', result.isFinal);

    if (result.isFinal) {
      // Clear interim states
      setCurrentInterim('');
      setCurrentInterimTranslation('');

      // Clear any pending translation debounce
      if (translationDebounceRef.current) {
        clearTimeout(translationDebounceRef.current);
        translationDebounceRef.current = null;
      }

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
      // Interim result - update immediately for real-time composition
      setCurrentInterim(result.text);

      // Clear previous debounce timer
      if (translationDebounceRef.current) {
        clearTimeout(translationDebounceRef.current);
      }

      // Debounce translation for interim results (translate after 600ms of no new input)
      translationDebounceRef.current = setTimeout(async () => {
        if (result.text.trim()) {
          try {
            console.log('🌐 Traduzindo interim:', result.text.substring(0, 50) + '...');
            const translation = await translationRef.current.translate(
              result.text,
              sourceLanguage,
              targetLanguage
            );
            setCurrentInterimTranslation(translation.translatedText);
            console.log('✅ Tradução interim:', translation.translatedText.substring(0, 50) + '...');
          } catch (error) {
            console.error('❌ Erro na tradução interim:', error);
            // Don't show error for interim translations
          }
        }
      }, 600); // Wait 600ms before translating interim results
    }
  };

  const toggleListening = async () => {
    if (audioSource === 'microphone') {
      if (!recognitionRef.current) {
        alert('⚠️ Web Speech API não disponível. Use Chrome ou Edge!');
        return;
      }

      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
        console.log('🛑 Gravação parada');
      } else {
        console.log('🎤 Iniciando gravação do microfone...');
        console.log('Idioma configurado:', sourceLanguage);
        recognitionRef.current.start(handleTranscriptResult, (error) => {
          console.error('❌ Erro na transcrição:', error);
          alert(`Erro na transcrição: ${error}\n\nVerifique:\n1. Permissão do microfone\n2. Use Chrome ou Edge\n3. HTTPS ou localhost`);
          setIsListening(false);
        });
        setIsListening(true);
      }
    } else {
      // System audio capture
      if (!systemAudioRef.current) {
        alert('⚠️ Captura de áudio do sistema não disponível!');
        return;
      }

      if (!aiConfig.apiKey) {
        alert('⚠️ Configure a API Key nas configurações primeiro!\n\nÁudio de sistema requer API do Whisper/Google para transcrição.');
        setIsSettingsOpen(true);
        return;
      }

      if (isListening) {
        systemAudioRef.current.stop();
        setIsListening(false);
        console.log('🛑 Captura de áudio do sistema parada');
      } else {
        console.log('🖥️ Iniciando captura de áudio do sistema...');
        await systemAudioRef.current.start(
          handleTranscriptResult as (result: AudioCaptureResult) => void,
          (error) => {
            console.error('❌ Erro na captura:', error);
            alert(`Erro na captura de áudio: ${error}\n\nVerifique:\n1. Compartilhamento de aba/tela permitido\n2. Aba selecionada tem áudio\n3. Use Chrome ou Edge`);
            setIsListening(false);
          }
        );
        setIsListening(true);
      }
    }
  };

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('📄 Iniciando upload do PDF:', file.name);
    setIsProcessing(true);

    try {
      const context = await contextExtractorRef.current.extractFromPDF(file);
      setContexts(prev => [...prev, context]);
      console.log('✅ PDF adicionado aos contextos!');

      // Show success feedback (optional - could add a toast notification)
      alert(`✅ PDF "${file.name}" processado com sucesso!\n\nClique no card para ver os detalhes.`);
    } catch (error: any) {
      console.error('❌ PDF upload error:', error);
      alert(`❌ Erro ao processar PDF:\n\n${error.message || error}\n\nVerifique:\n1. API Key configurada\n2. PDF não corrompido\n3. Conexão com internet`);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
    if (isMuted) {
      console.log('🔇 App está silenciado');
      return;
    }
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-lg transition ${
                isMuted
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-400'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              title={isMuted ? 'Sons desativados (clique para ativar)' : 'Sons ativados (clique para desativar)'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition"
              title="Configurações"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
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
          <div className="text-xs text-gray-400 mb-1 font-semibold">📄 Contextos ({contexts.length}): <span className="text-[10px] text-gray-500">(clique para ver detalhes)</span></div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {contexts.map((ctx, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSelectedContext(ctx);
                  setIsContextModalOpen(true);
                }}
                className="bg-blue-900/30 border border-blue-700 rounded px-2 py-1 flex items-start gap-2 group text-xs cursor-pointer hover:bg-blue-900/50 hover:border-blue-500 transition"
              >
                <FileText className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-blue-300 font-medium truncate">{ctx.source.name}</div>
                  <div className="text-blue-400/70 text-[10px] line-clamp-1">{ctx.summary}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeContext(idx);
                  }}
                  className="text-red-400 hover:text-red-300 transition flex-shrink-0 opacity-0 group-hover:opacity-100"
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
            {audioSource === 'microphone' ? (
              <Mic className="w-12 h-12 mb-2 opacity-50" />
            ) : (
              <Monitor className="w-12 h-12 mb-2 opacity-50" />
            )}
            <p className="text-center text-sm">
              {audioSource === 'microphone' ? (
                <>Clique no botão para capturar<br />áudio do seu microfone</>
              ) : (
                <>Clique no botão para capturar<br />áudio de outra aba (Meet, Zoom, Teams)</>
              )}
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
                {!isMuted && (
                  <button
                    onClick={() => speakText(turn.original, sourceLanguage)}
                    className="mt-1 text-blue-200 hover:text-white transition"
                    title="Ouvir texto"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                )}
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
                      {!isMuted && (
                        <button
                          onClick={() => speakText(suggestion.original, sourceLanguage)}
                          className="text-green-400 hover:text-green-300 transition"
                          title="Ouvir"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      )}
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
            <div className="max-w-[85%] bg-blue-500/30 border border-blue-500 rounded-xl rounded-tr-sm px-3 py-2">
              <p className="text-white font-medium text-base">{currentInterim}</p>
              {currentInterimTranslation && (
                <p className="text-blue-200 text-xs mt-1">{currentInterimTranslation}</p>
              )}
              <div className="flex items-center gap-1 mt-1">
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}} />
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}} />
                <p className="text-[10px] text-blue-300 ml-1">Ouvindo ao vivo...</p>
              </div>
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
        {/* Audio Source Toggle */}
        <div className="flex gap-1 mb-2">
          <button
            onClick={() => setAudioSource('microphone')}
            disabled={isListening}
            className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition flex items-center justify-center gap-1 ${
              audioSource === 'microphone'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            } ${isListening ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Capturar do microfone (Web Speech API)"
          >
            <Mic className="w-3 h-3" />
            Microfone
          </button>
          <button
            onClick={() => setAudioSource('system')}
            disabled={isListening}
            className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition flex items-center justify-center gap-1 ${
              audioSource === 'system'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            } ${isListening ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Capturar de aba/sistema (Meet, Zoom, Teams)"
          >
            <Monitor className="w-3 h-3" />
            Aba/Sistema
          </button>
        </div>

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
                : audioSource === 'microphone'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5" />
                Parar
              </>
            ) : (
              <>
                {audioSource === 'microphone' ? <Mic className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                Iniciar {audioSource === 'microphone' ? 'Microfone' : 'Aba/Sistema'}
              </>
            )}
          </button>
        </div>

        {/* Helper Text */}
        {audioSource === 'system' && (
          <div className="mt-1.5 text-[10px] text-purple-400 flex items-center gap-1">
            <Monitor className="w-3 h-3" />
            Você poderá selecionar qual aba (Meet, Zoom, Teams) deseja transcrever
          </div>
        )}
      </div>

      <ContextModal
        context={selectedContext}
        isOpen={isContextModalOpen}
        onClose={() => {
          setIsContextModalOpen(false);
          setSelectedContext(null);
        }}
      />

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveConfig}
        currentConfig={aiConfig}
      />
    </div>
  );
}
