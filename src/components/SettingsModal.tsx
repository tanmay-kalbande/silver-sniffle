// ============================================================================
// SETTINGS MODAL - Improved Model Selection UI
// ============================================================================

import { useState } from 'react';
import { X, Key, Cpu, Eye, EyeOff, ExternalLink, Check, AlertCircle, Loader, Sparkles } from 'lucide-react';
import { APISettings, AIModel } from '../types';
import { aiService } from '../services/aiService';

interface SettingsModalProps {
    isOpen: boolean;
    settings: APISettings;
    onSave: (settings: APISettings) => void;
    onClose: () => void;
}

type SettingsTab = 'keys' | 'model';
type TestStatus = 'idle' | 'testing' | 'success' | 'error';

const models: { id: AIModel; name: string; provider: string; description: string; recommended?: boolean }[] = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', description: 'Fast & efficient', recommended: true },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', description: 'Most capable' },
    { id: 'gemma-3-27b-it', name: 'Gemma 3 27B', provider: 'Google', description: 'Open source' },
    { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'Mistral', description: 'Powerful model' },
    { id: 'mistral-medium-latest', name: 'Mistral Medium', provider: 'Mistral', description: 'Balanced' },
    { id: 'gpt-oss-120b', name: 'GPT OSS 120B', provider: 'Cerebras', description: 'Ultra fast' },
    { id: 'qwen-3-235b-a22b-instruct-2507', name: 'Qwen 235B', provider: 'Cerebras', description: 'Multilingual' },
    { id: 'zai-glm-4.6', name: 'ZAI GLM 4.6', provider: 'Cerebras', description: 'Advanced reasoning' },
    { id: 'glm-4.5-flash', name: 'GLM 4.5 Flash', provider: 'Zhipu', description: 'Lightning fast' },
];

function validateApiKey(key: string, provider: string): { valid: boolean; message?: string } {
    if (!key.trim()) {
        return { valid: false, message: 'API key is required' };
    }

    switch (provider) {
        case 'google':
            if (!key.startsWith('AIza')) {
                return { valid: false, message: 'Google API keys should start with "AIza"' };
            }
            if (key.length < 30) {
                return { valid: false, message: 'Google API key is too short' };
            }
            break;
        case 'mistral':
            if (key.length < 20) {
                return { valid: false, message: 'Mistral API key seems too short' };
            }
            break;
        case 'cerebras':
        case 'zhipu':
            if (key.length < 10) {
                return { valid: false, message: 'API key seems too short' };
            }
            break;
    }

    return { valid: true };
}

export function SettingsModal({ isOpen, settings, onSave, onClose }: SettingsModalProps) {
    const [localSettings, setLocalSettings] = useState<APISettings>(settings);
    const [activeTab, setActiveTab] = useState<SettingsTab>('model');
    const [showKey, setShowKey] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [testStatus, setTestStatus] = useState<TestStatus>('idle');
    const [testError, setTestError] = useState<string>('');

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(localSettings);
        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            onClose();
        }, 1000);
    };

    const testConnection = async () => {
        setTestStatus('testing');
        setTestError('');

        try {
            const originalSettings = { ...settings };
            aiService.updateSettings(localSettings);

            const stream = aiService.generateStreamingResponse([
                { role: 'user', content: 'Reply with just "OK" if you can read this.' }
            ]);

            let response = '';
            for await (const chunk of stream) {
                response += chunk;
                if (response.toLowerCase().includes('ok')) {
                    break;
                }
            }

            aiService.updateSettings(originalSettings);

            if (response.toLowerCase().includes('ok')) {
                setTestStatus('success');
                setTimeout(() => setTestStatus('idle'), 3000);
            } else {
                setTestStatus('error');
                setTestError('Unexpected response from API');
            }
        } catch (error) {
            setTestStatus('error');
            const errorMessage = error instanceof Error ? error.message : 'Connection failed';
            setTestError(errorMessage);
            aiService.updateSettings(settings);
        }
    };

    const apiKeyFields = [
        { key: 'googleApiKey' as const, label: 'Google AI', url: 'https://aistudio.google.com/apikey', provider: 'google', icon: '🔵' },
        { key: 'mistralApiKey' as const, label: 'Mistral AI', url: 'https://console.mistral.ai/api-keys', provider: 'mistral', icon: '🟠' },
        { key: 'cerebrasApiKey' as const, label: 'Cerebras', url: 'https://cloud.cerebras.ai/', provider: 'cerebras', icon: '🟣' },
        { key: 'zhipuApiKey' as const, label: 'ZhipuAI', url: 'https://open.bigmodel.cn/', provider: 'zhipu', icon: '🔴' },
    ];

    const hasAnyKey = Object.values(localSettings).some(val => typeof val === 'string' && val.trim().length > 0);

    // Group models by provider
    const groupedModels = models.reduce((acc, model) => {
        if (!acc[model.provider]) acc[model.provider] = [];
        acc[model.provider].push(model);
        return acc;
    }, {} as Record<string, typeof models>);

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content max-w-3xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Settings</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-4 border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('model')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                            activeTab === 'model'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                    >
                        <Cpu className="w-5 h-5" />
                        AI Model
                    </button>
                    <button
                        onClick={() => setActiveTab('keys')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                            activeTab === 'keys'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                    >
                        <Key className="w-5 h-5" />
                        API Keys
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {/* Model Selection Tab */}
                    {activeTab === 'model' && (
                        <div className="space-y-6">
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                                <p className="text-sm text-blue-300">
                                    💡 Choose the AI model that powers your article generation. Different models have different strengths.
                                </p>
                            </div>

                            {Object.entries(groupedModels).map(([provider, providerModels]) => (
                                <div key={provider}>
                                    <h3 className="text-lg font-bold text-white mb-3 uppercase tracking-wider">{provider}</h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        {providerModels.map((model) => (
                                            <button
                                                key={model.id}
                                                onClick={() => setLocalSettings((s) => ({ ...s, selectedModel: model.id }))}
                                                className={`relative p-4 rounded-xl text-left transition-all ${
                                                    localSettings.selectedModel === model.id
                                                        ? 'bg-gradient-to-br from-blue-500/20 to-purple-600/20 border-2 border-blue-500/50 shadow-lg'
                                                        : 'bg-white/5 border-2 border-white/10 hover:border-white/30 hover:bg-white/10'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-white text-lg">{model.name}</span>
                                                            {model.recommended && (
                                                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full font-bold">
                                                                    RECOMMENDED
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-400">{model.description}</p>
                                                    </div>
                                                    {localSettings.selectedModel === model.id && (
                                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                                            <Check className="w-5 h-5 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* API Keys Tab */}
                    {activeTab === 'keys' && (
                        <div className="space-y-5">
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                                <p className="text-sm text-blue-300">
                                    💡 Add at least one API key to start generating. Keys are stored locally in your browser.
                                </p>
                            </div>

                            {apiKeyFields.map((field) => {
                                const validation = localSettings[field.key] 
                                    ? validateApiKey(localSettings[field.key], field.provider)
                                    : { valid: true };

                                return (
                                    <div key={field.key} className="bg-white/5 border border-white/10 rounded-xl p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="flex items-center gap-2 text-base font-bold text-white">
                                                <span className="text-2xl">{field.icon}</span>
                                                {field.label}
                                            </label>
                                            <a
                                                href={field.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors font-medium"
                                            >
                                                Get API Key <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type={showKey === field.key ? 'text' : 'password'}
                                                value={localSettings[field.key]}
                                                onChange={(e) => setLocalSettings((s) => ({ ...s, [field.key]: e.target.value }))}
                                                placeholder="Enter your API key..."
                                                className={`w-full bg-white/5 border-2 ${
                                                    !validation.valid ? 'border-red-500/50' : 'border-white/10 focus:border-blue-500/50'
                                                } rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none transition-all`}
                                            />
                                            <button
                                                onClick={() => setShowKey(showKey === field.key ? null : field.key)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                {showKey === field.key ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        {!validation.valid && validation.message && (
                                            <p className="text-sm text-red-400 mt-2 flex items-center gap-1.5 font-medium">
                                                <AlertCircle className="w-4 h-4" />
                                                {validation.message}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Connection Test */}
                            {hasAnyKey && (
                                <div className="pt-2">
                                    <button
                                        onClick={testConnection}
                                        disabled={testStatus === 'testing'}
                                        className={`w-full px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 ${
                                            testStatus === 'success'
                                                ? 'bg-green-500/20 border-2 border-green-500/50 text-green-300'
                                                : testStatus === 'error'
                                                ? 'bg-red-500/20 border-2 border-red-500/50 text-red-300'
                                                : 'bg-white/5 border-2 border-white/10 text-white hover:border-white/30'
                                        }`}
                                    >
                                        {testStatus === 'testing' && (
                                            <>
                                                <Loader className="w-5 h-5 animate-spin" />
                                                Testing Connection...
                                            </>
                                        )}
                                        {testStatus === 'success' && (
                                            <>
                                                <Check className="w-5 h-5" />
                                                Connection Successful!
                                            </>
                                        )}
                                        {testStatus === 'error' && (
                                            <>
                                                <AlertCircle className="w-5 h-5" />
                                                Connection Failed
                                            </>
                                        )}
                                        {testStatus === 'idle' && <>Test Connection</>}
                                    </button>
                                    {testError && (
                                        <p className="text-sm text-red-400 mt-3 font-medium">{testError}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-white/10">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-3 bg-white/5 border-2 border-white/10 hover:border-white/30 rounded-xl font-semibold transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
                    >
                        {saved ? (
                            <>
                                <Check className="w-5 h-5" />
                                Saved!
                            </>
                        ) : (
                            'Save Settings'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
