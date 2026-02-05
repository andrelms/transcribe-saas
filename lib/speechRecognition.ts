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
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech Recognition API not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.language;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const isFinal = result.isFinal;
        const confidence = result[0].confidence;

        if (this.onResultCallback) {
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
      console.error('Speech recognition error:', event.error);
      if (this.onErrorCallback) {
        this.onErrorCallback(event.error);
      }
    };

    this.recognition.onend = () => {
      // Restart if still supposed to be listening
      if (this.isListening) {
        this.recognition.start();
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
      const error = 'Speech Recognition not available';
      if (onError) onError(error);
      return;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.isListening = true;

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
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
}

export default SpeechRecognitionService;
