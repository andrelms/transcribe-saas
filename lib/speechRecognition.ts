// Speech Recognition Service using Web Speech API

export interface TranscriptResult {
  text: string;
  isFinal: boolean;
  timestamp: number;
  confidence?: number;
}

export class SpeechRecognitionService {
  private recognition: any;
  private isListening: boolean = false;
  private onResultCallback?: (result: TranscriptResult) => void;
  private onErrorCallback?: (error: string) => void;
  private language: string = 'pt-BR';

  constructor(language: string = 'pt-BR') {
    this.language = language;
    this.initializeRecognition();
  }

  private initializeRecognition() {
    if (typeof window === 'undefined') {
      console.log('⚠️ Window undefined (SSR)');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('❌ Web Speech API NÃO suportada neste navegador!');
      console.log('Use Chrome, Edge ou Safari mais recente');
      return;
    }

    console.log('✅ Web Speech API detectada');
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.language;
    this.recognition.maxAlternatives = 1;

    // Enable automatic punctuation for better phrase detection
    if ('webkitSpeechRecognition' in window) {
      // Chrome-specific settings for better long phrase handling
      this.recognition.interimResults = true;
    }

    console.log('🎤 Configuração:', {
      continuous: true,
      interimResults: true,
      lang: this.language,
    });

    this.recognition.onstart = () => {
      console.log('✅ Microfone iniciado!');
    };

    this.recognition.onresult = (event: any) => {
      console.log('📝 Evento de resultado recebido');

      // Process all results from the event
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const isFinal = result.isFinal;
        const confidence = result[0].confidence;

        console.log(`${isFinal ? '✅ FINAL' : '⏳ Interim'}:`, transcript, `(${transcript.length} chars)`);

        // Send all results (interim and final) without splitting
        // This allows real-time composition like Google Translate
        if (this.onResultCallback && transcript.trim()) {
          this.onResultCallback({
            text: transcript,
            isFinal,
            timestamp: Date.now(),
            confidence: confidence || 0,
          });
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('❌ Erro na transcrição:', event.error);
      if (event.error === 'no-speech') {
        console.log('⚠️ Nenhuma fala detectada');
      } else if (event.error === 'not-allowed') {
        console.error('❌ Permissão do microfone negada!');
      }
      if (this.onErrorCallback) {
        this.onErrorCallback(event.error);
      }
    };

    this.recognition.onend = () => {
      console.log('🛑 Reconhecimento finalizado');
      // Restart if still supposed to be listening
      if (this.isListening) {
        console.log('🔄 Reiniciando transcrição...');
        try {
          this.recognition.start();
        } catch (error) {
          console.error('❌ Erro ao reiniciar:', error);
        }
      }
    };
  }

  setLanguage(language: string) {
    this.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  start(onResult: (result: TranscriptResult) => void, onError?: (error: string) => void) {
    if (!this.recognition) {
      const error = 'Web Speech API não disponível. Use Chrome ou Edge!';
      console.error('❌', error);
      if (onError) onError(error);
      return;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.isListening = true;

    try {
      console.log('🚀 Iniciando reconhecimento de voz...');
      this.recognition.start();
    } catch (error) {
      console.error('❌ Erro ao iniciar:', error);
      if (onError) onError(String(error));
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
    }
  }

  isActive() {
    return this.isListening;
  }

  private splitIntoSentences(text: string): string[] {
    // Split by sentence endings (., !, ?, ... etc) but keep reasonable chunks
    // Also split on commas if sentences are still too long
    const sentences: string[] = [];

    // First split by major punctuation
    const majorSplits = text.split(/([.!?]+\s+)/);
    let currentChunk = '';

    for (let i = 0; i < majorSplits.length; i++) {
      currentChunk += majorSplits[i];

      // If chunk is getting long (>150 chars) or we hit a sentence end, flush it
      if (currentChunk.length > 150 || /[.!?]+\s+$/.test(currentChunk)) {
        if (currentChunk.trim()) {
          sentences.push(currentChunk.trim());
          currentChunk = '';
        }
      }
    }

    // Add any remaining text
    if (currentChunk.trim()) {
      sentences.push(currentChunk.trim());
    }

    return sentences.length > 0 ? sentences : [text];
  }
}

export default SpeechRecognitionService;
