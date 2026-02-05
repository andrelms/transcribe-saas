'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Upload, Link as LinkIcon, FileText, Globe, Volume2 } from 'lucide-react';
import SpeechRecognitionService, { TranscriptResult } from '@/lib/speechRecognition';
import TranslationService from '@/lib/translationService';
import ResponseGenerator from '@/lib/responseGenerator';
import ContextExtractor, { ExtractedContext } from '@/lib/contextExtractor';
import TranscriptPanel from './TranscriptPanel';
import ResponsePanel from './ResponsePanel';
import ContextPanel from './ContextPanel';
import LanguageSelector from './LanguageSelector';

interface TranscriptEntry {
  id: string;
  original: string;
  translation: string;
  timestamp: number;
  isFinal: boolean;
}

export default function InterviewTranslator() {
  const [isListening, setIsListening] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [currentInterim, setCurrentInterim] = useState<string>('');
  const [contexts, setContexts] = useState<ExtractedContext[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('pt-BR');
  const [learningLevel, setLearningLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [isProcessing, setIsProcessing] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionService | null>(null);
  const translationRef = useRef<TranslationService>(new TranslationService());
  const responseGenRef = useRef<ResponseGenerator>(new ResponseGenerator());
  const contextExtractorRef = useRef<ContextExtractor>(new ContextExtractor());

  useEffect(() => {
    recognitionRef.current = new SpeechRecognitionService(sourceLanguage);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [sourceLanguage]);

  const handleTranscriptResult = async (result: TranscriptResult) => {
    if (result.isFinal) {
      setCurrentInterim('');

      // Translate the final transcript
      try {
        const translation = await translationRef.current.translate(
          result.text,
          sourceLanguage,
          targetLanguage
        );

        const entry: TranscriptEntry = {
          id: Date.now().toString(),
          original: result.text,
          translation: translation.translatedText,
          timestamp: result.timestamp,
          isFinal: true,
        };

        setTranscripts(prev => [...prev, entry]);

        // Generate response suggestions
        generateResponses(result.text);
      } catch (error) {
        console.error('Translation error:', error);
      }
    } else {
      setCurrentInterim(result.text);
    }
  };

  const generateResponses = async (question: string) => {
    setIsProcessing(true);
    try {
      const combinedContext = await contextExtractorRef.current.combineContexts(contexts);
      const responses = await responseGenRef.current.generateResponse(
        question,
        combinedContext,
        sourceLanguage,
        targetLanguage,
        learningLevel
      );
      setSuggestions(responses);
    } catch (error) {
      console.error('Response generation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start(handleTranscriptResult, (error) => {
        console.error('Speech recognition error:', error);
        setIsListening(false);
      });
      setIsListening(true);
    }
  };

  const handlePDFUpload = async (file: File) => {
    try {
      const context = await contextExtractorRef.current.extractFromPDF(file);
      setContexts(prev => [...prev, context]);
    } catch (error) {
      console.error('PDF upload error:', error);
    }
  };

  const handleURLAdd = async (url: string) => {
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
          Tradutor de Entrevistas em Tempo Real
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Transcrição, tradução e sugestões de resposta para iniciantes
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Controls and Context */}
        <div className="lg:col-span-1 space-y-6">
          {/* Language Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Idiomas
            </h2>
            <LanguageSelector
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              onSourceChange={setSourceLanguage}
              onTargetChange={setTargetLanguage}
            />

            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">
                Nível de Aprendizado
              </label>
              <select
                value={learningLevel}
                onChange={(e) => setLearningLevel(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Iniciante (A1-A2)</option>
                <option value="intermediate">Intermediário (B1-B2)</option>
                <option value="advanced">Avançado (C1-C2)</option>
              </select>
            </div>
          </div>

          {/* Recording Control */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <button
              onClick={toggleListening}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-3 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-6 h-6" />
                  Parar Gravação
                </>
              ) : (
                <>
                  <Mic className="w-6 h-6" />
                  Iniciar Gravação
                </>
              )}
            </button>
            {isListening && (
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                Ouvindo... Fale naturalmente
              </p>
            )}
          </div>

          {/* Context Panel */}
          <ContextPanel
            contexts={contexts}
            onPDFUpload={handlePDFUpload}
            onURLAdd={handleURLAdd}
            onRemove={removeContext}
          />
        </div>

        {/* Middle Panel - Transcript */}
        <div className="lg:col-span-1">
          <TranscriptPanel
            transcripts={transcripts}
            currentInterim={currentInterim}
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
            onSpeak={speakText}
          />
        </div>

        {/* Right Panel - Response Suggestions */}
        <div className="lg:col-span-1">
          <ResponsePanel
            suggestions={suggestions}
            isProcessing={isProcessing}
            sourceLanguage={sourceLanguage}
            onSpeak={speakText}
          />
        </div>
      </div>
    </div>
  );
}
