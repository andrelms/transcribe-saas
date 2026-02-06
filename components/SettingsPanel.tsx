'use client';

import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Save, X } from 'lucide-react';

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'ollama';
  apiKey: string;
  model: string;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AIConfig) => void;
  currentConfig: AIConfig;
}

const PROVIDER_MODELS: Record<string, { id: string; name: string }[]> = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o (Mais Recente)' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Mais Recente)' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
  ],
  google: [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview (Prioridade 1)' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview (Prioridade 2)' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Prioridade 3)' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (Prioridade 4)' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Prioridade 5)' },
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)' },
    { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro (Latest)' },
    { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash (Latest)' },
  ],
  ollama: [], // Will be loaded dynamically
};

export default function SettingsPanel({
  isOpen,
  onClose,
  onSave,
  currentConfig,
}: SettingsPanelProps) {
  const [config, setConfig] = useState<AIConfig>(currentConfig);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<{ id: string; name: string }[]>([]);
  const [ollamaAvailable, setOllamaAvailable] = useState(false);
  const [loadingOllama, setLoadingOllama] = useState(false);

  useEffect(() => {
    setConfig(currentConfig);
  }, [currentConfig]);

  // Load Ollama models when panel opens
  useEffect(() => {
    if (isOpen) {
      loadOllamaModels();
    }
  }, [isOpen]);

  const loadOllamaModels = async () => {
    setLoadingOllama(true);
    try {
      const response = await fetch('/api/ollama/models');
      const data = await response.json();

      if (data.available && data.models) {
        setOllamaAvailable(true);
        setOllamaModels(
          data.models.map((m: any) => ({
            id: m.name,
            name: `${m.name} (${(m.size / 1e9).toFixed(1)}GB)`,
          }))
        );
        PROVIDER_MODELS.ollama = data.models.map((m: any) => ({
          id: m.name,
          name: `${m.name} (${(m.size / 1e9).toFixed(1)}GB)`,
        }));
      } else {
        setOllamaAvailable(false);
        setOllamaModels([]);
      }
    } catch (error) {
      console.error('Failed to load Ollama models:', error);
      setOllamaAvailable(false);
      setOllamaModels([]);
    } finally {
      setLoadingOllama(false);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    onSave(config);
    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 500);
  };

  const getApiKeyPlaceholder = () => {
    switch (config.provider) {
      case 'openai':
        return 'sk-...';
      case 'anthropic':
        return 'sk-ant-...';
      case 'google':
        return 'AIza...';
      case 'ollama':
        return 'Não necessário (modelo local)';
      default:
        return 'Cole sua chave API aqui';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'OpenAI';
      case 'anthropic':
        return 'Anthropic (Claude)';
      case 'google':
        return 'Google (Gemini)';
      case 'ollama':
        return '🦙 Ollama (Local)';
      default:
        return provider;
    }
  };

  const requiresApiKey = (provider: string) => {
    return provider !== 'ollama';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Configurações da API
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Provedor de IA
            </label>
            <select
              value={config.provider}
              onChange={(e) => {
                const newProvider = e.target.value as AIConfig['provider'];
                const models = PROVIDER_MODELS[newProvider];
                setConfig({
                  ...config,
                  provider: newProvider,
                  model: models && models.length > 0 ? models[0].id : '',
                  apiKey: newProvider === 'ollama' ? 'local' : config.apiKey,
                });
              }}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="openai">{getProviderName('openai')}</option>
              <option value="anthropic">{getProviderName('anthropic')}</option>
              <option value="google">{getProviderName('google')}</option>
              <option value="ollama" disabled={!ollamaAvailable}>
                {getProviderName('ollama')} {!ollamaAvailable && '(Não disponível)'}
              </option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Escolha o provedor de IA que você deseja usar
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Modelo
            </label>
            <select
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {PROVIDER_MODELS[config.provider].map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Selecione o modelo específico para usar
            </p>
          </div>

          {/* API Key Input */}
          {requiresApiKey(config.provider) && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Chave da API
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder={getApiKeyPlaceholder()}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showApiKey ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Sua chave é armazenada localmente no navegador e nunca é compartilhada
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
              {config.provider === 'ollama' ? 'Como usar Ollama:' : 'Como obter sua chave da API:'}
            </h3>
            <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
              {config.provider === 'openai' && (
                <>
                  <li>1. Acesse <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com/api-keys</a></li>
                  <li>2. Faça login ou crie uma conta</li>
                  <li>3. Clique em "Create new secret key"</li>
                  <li>4. Copie a chave e cole acima</li>
                </>
              )}
              {config.provider === 'anthropic' && (
                <>
                  <li>1. Acesse <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline">console.anthropic.com</a></li>
                  <li>2. Faça login ou crie uma conta</li>
                  <li>3. Vá para "API Keys"</li>
                  <li>4. Crie uma nova chave e cole acima</li>
                </>
              )}
              {config.provider === 'google' && (
                <>
                  <li>1. Acesse <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">makersuite.google.com</a></li>
                  <li>2. Faça login com sua conta Google</li>
                  <li>3. Crie uma chave API</li>
                  <li>4. Copie e cole acima</li>
                </>
              )}
              {config.provider === 'ollama' && (
                <>
                  <li>🦙 <strong>Ollama detectado com {ollamaModels.length} modelo(s) instalado(s)</strong></li>
                  <li>✅ Nenhuma chave API necessária - roda 100% local e gratuito</li>
                  <li>📦 Para instalar mais modelos: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">ollama pull llama2</code></li>
                  <li>📋 Ver modelos: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">ollama list</code></li>
                  <li>📖 Mais info: <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="underline">ollama.ai</a></li>
                </>
              )}
            </ul>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-xs text-yellow-800 dark:text-yellow-400">
              ⚠️ <strong>Importante:</strong> Ao usar a chave no frontend, ela fica exposta no navegador.
              Para produção, recomenda-se usar variáveis de ambiente no backend (.env).
              Este modo é ideal para testes e desenvolvimento local.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!config.apiKey || isSaving}
            className={`px-6 py-2 rounded-lg font-semibold text-white transition flex items-center gap-2 ${
              !config.apiKey || isSaving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
}
