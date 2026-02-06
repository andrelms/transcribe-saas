// System Audio Capture using Screen Capture API + Web Audio API

export interface AudioCaptureResult {
  text: string;
  isFinal: boolean;
  timestamp: number;
  confidence?: number;
}

export class SystemAudioCapture {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private isCapturing: boolean = false;
  private onResultCallback?: (result: AudioCaptureResult) => void;
  private onErrorCallback?: (error: string) => void;
  private language: string = 'pt-BR';
  private apiKey: string = '';
  private provider: string = 'google';
  private model: string = 'gemini-3-flash-preview';

  // Buffer for audio chunks
  private audioChunks: Float32Array[] = [];
  private bufferDuration: number = 5000; // Increased to 5 seconds for longer phrases
  private minBufferDuration: number = 2000; // Minimum 2 seconds
  private maxBufferDuration: number = 10000; // Maximum 10 seconds
  private lastTranscriptTime: number = 0;
  private silenceThreshold: number = 0.01; // Amplitude threshold for silence detection
  private silenceDuration: number = 0; // Track silence duration
  private isSpeaking: boolean = false;

  constructor(language: string = 'pt-BR') {
    this.language = language;
  }

  setApiConfig(apiKey: string, provider: string, model: string) {
    this.apiKey = apiKey;
    this.provider = provider;
    this.model = model;
  }

  setLanguage(language: string) {
    this.language = language;
  }

  async start(onResult: (result: AudioCaptureResult) => void, onError?: (error: string) => void) {
    console.log('🖥️ Iniciando captura de áudio do sistema...');

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;

    try {
      // Request screen/tab capture with audio
      // NOTE: getDisplayMedia REQUIRES video=true even for audio-only capture
      this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // Required by API, we'll just ignore the video track
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 16000, // Whisper works well with 16kHz
        } as any,
      });

      // Stop video track immediately since we only want audio
      const videoTracks = this.mediaStream.getVideoTracks();
      videoTracks.forEach(track => track.stop());

      console.log('✅ Stream de áudio capturado');

      // Create audio context
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;

      // Use ScriptProcessorNode for audio processing
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      source.connect(this.analyser);
      this.analyser.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.processor.onaudioprocess = (e) => {
        if (!this.isCapturing) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const chunk = new Float32Array(inputData);
        this.audioChunks.push(chunk);

        // Detect if there's speech or silence
        const rms = this.calculateRMS(inputData);
        const isSilent = rms < this.silenceThreshold;

        if (!isSilent) {
          this.isSpeaking = true;
          this.silenceDuration = 0;
        } else if (this.isSpeaking) {
          this.silenceDuration += (inputData.length / 16000) * 1000; // ms
        }

        // Check if we should transcribe
        const totalSamples = this.audioChunks.reduce((sum, c) => sum + c.length, 0);
        const durationMs = (totalSamples / 16000) * 1000;

        // Transcribe if:
        // 1. We have minimum buffer AND detected silence for 800ms (natural pause)
        // 2. OR we reached maximum buffer duration (prevent overflow)
        const shouldTranscribe =
          (durationMs >= this.minBufferDuration && this.silenceDuration >= 800) ||
          durationMs >= this.maxBufferDuration;

        if (shouldTranscribe && this.audioChunks.length > 0) {
          console.log(`📊 Transcrevendo após ${durationMs.toFixed(0)}ms (silêncio: ${this.silenceDuration.toFixed(0)}ms)`);
          this.transcribeBuffer();
          this.isSpeaking = false;
          this.silenceDuration = 0;
        }
      };

      this.isCapturing = true;
      console.log('✅ Captura de áudio do sistema ativa');

      // Handle stream end
      this.mediaStream.getAudioTracks()[0].addEventListener('ended', () => {
        console.log('🛑 Usuário parou o compartilhamento');
        this.stop();
        if (onError) onError('Compartilhamento de áudio encerrado');
      });

    } catch (error) {
      console.error('❌ Erro ao capturar áudio do sistema:', error);
      const errorMsg = error instanceof Error ? error.message : 'Falha ao capturar áudio';
      if (onError) onError(errorMsg);
    }
  }

  private async transcribeBuffer() {
    if (this.audioChunks.length === 0) return;

    // Combine all chunks
    const totalLength = this.audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.audioChunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    // Clear buffer for next batch
    this.audioChunks = [];

    // Convert Float32Array to WAV blob
    const wavBlob = this.audioBufferToWav(combined, 16000);

    try {
      console.log('🌐 Enviando áudio para transcrição...');
      console.log('📊 Tamanho do áudio:', wavBlob.size, 'bytes');
      console.log('🔑 API Key configurada:', !!this.apiKey);
      console.log('🤖 Provider:', this.provider);

      // Send to transcription API
      const formData = new FormData();
      formData.append('audio', wavBlob, 'audio.wav');
      formData.append('language', this.language);
      formData.append('apiKey', this.apiKey);
      formData.append('provider', this.provider);
      formData.append('model', this.model);

      const response = await fetch('/api/transcribe-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro HTTP:', response.status, errorData);
        throw new Error(`Transcription API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      if (data.text && data.text.trim() && this.onResultCallback) {
        console.log('✅ Transcrição:', data.text);
        this.onResultCallback({
          text: data.text,
          isFinal: true,
          timestamp: Date.now(),
          confidence: data.confidence || 0.9,
        });
      } else {
        console.log('⚠️ Transcrição vazia ou sem conteúdo');
      }
    } catch (error) {
      console.error('❌ Erro detalhado na transcrição:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(`Falha na transcrição: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  private audioBufferToWav(buffer: Float32Array, sampleRate: number): Blob {
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;

    const dataSize = buffer.length * bytesPerSample;
    const bufferSize = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // audio format (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, buffer[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  stop() {
    console.log('🛑 Parando captura de áudio do sistema...');

    this.isCapturing = false;

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.audioChunks = [];
  }

  isActive() {
    return this.isCapturing;
  }
}

export default SystemAudioCapture;
