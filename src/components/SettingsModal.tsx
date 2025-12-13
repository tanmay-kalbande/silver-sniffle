// ============================================================================
// SETTINGS MODAL - With API Key Validation & Connection Testing
// ============================================================================

import { useState } from 'react';
import { X, Key, Cpu, Eye, EyeOff, ExternalLink, Check, AlertCircle, Loader } from 'lucide-react';
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

const models: { id: AIModel; name: string; provider: string }[] = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
    { id: 'gemma-3-27b-it', name: 'Gemma 3 27B', provider: 'Google' },
    { id: 'gpt-oss-120b', name: 'GPT OSS 120B', provider: 'Cerebras' },
    { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'Mistral' },
    { id: 'mistral-medium-latest', name: 'Mistral Medium', provider: 'Mistral' },
    { id: 'glm-4.5-flash', name: 'GLM 4.5 Flash', provider: 'Zhipu' },
    { id: 'qwen-3-235b-a22b-instruct-2507', name: 'Qwen 235B', provider: 'Cerebras' },
    { id: 'zai-glm-4.6', name: 'ZAI GLM 4.6', provider: 'Cerebras' },
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
    const [activeTab, setActiveTab] = useState<SettingsTab>('keys');
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
            // Temporarily update AI service with test settings
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

            // Restore original settings
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
            
            // Restore original settings
            aiService.updateSettings(settings);
        }
    };

    const apiKeyFields = [
        { key: 'googleApiKey' as const, label: 'Google AI', url: 'https://aistudio.google.com/apikey', provider: 'google' },
        { key: 'mistralApiKey' as const, label: 'Mistral AI', url: 'https://console.mistral.ai/api-keys', provider: 'mistral' },
        { key: 'cerebrasApiKey' as const, label: 'Cerebras', url: 'https://cloud.cerebras.ai/', provider: 'cerebras' },
        { key: 'zhipuApiKey' as const, label: 'ZhipuAI', url: 'https://open.bigmodel.cn/', provider: 'zhipu' },
    ];

    const hasAnyKey = Object.values(localSettings).some(val => typeof val === 'string' && val.trim().length > 0);

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                    <h2 className="text-lg font-semibold">Settings</h2>
                    <button onClick={onClose} className="btn-icon">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-3 border-b border-[var(--color-border)]">
                    <button
                        onClick={() => setActiveTab('keys')}
                        className={`tab-button ${activeTab === 'keys' ? 'active' : ''}`}
                    >
                        <Key className="w-4 h-4 inline mr-1.5" />
                        API Keys
                    </button>
                    <button
                        onClick={() => setActiveTab('model')}
                        className={`tab-button ${activeTab === 'model' ? 'active' : ''}`}
                    >
                        <Cpu className="w-4 h-4 inline mr-1.5" />
                        Model
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-[50vh] overflow-y-auto">
                    {/* API Keys Tab */}
                    {activeTab === 'keys' && (
                        <div className="space-y-4">
                            {/* Info Box */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                <p className="text-xs text-blue-300">
                                    💡 Add at least one API key to start generating articles. All keys are stored locally in your browser.
                                </p>
                            </div>

                            {apiKeyFields.map((field) => {
                                const validation = localSettings[field.key] 
                                    ? validateApiKey(localSettings[field.key], field.provider)
                                    : { valid: true };

                                return (
                                    <div key={field.key}>
                                        <label className="flex items-center justify-between text-sm font-medium mb-2">
                                            {field.label}
                                            <a
                                                href={field.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-colors"
                                            >
                                                Get key <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showKey === field.key ? 'text' : 'password'}
                                                value={localSettings[field.key]}
                                                onChange={(e) => setLocalSettings((s) => ({ ...s, [field.key]: e.target.value }))}
                                                placeholder="Enter API key"
                                                className={`input-field pr-10 ${!validation.valid ? 'border-red-500/50' : ''}`}
                                            />
                                            <button
                                                onClick={() => setShowKey(showKey === field.key ? null : field.key)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 btn-icon p-1"
                                            >
                                                {showKey === field.key ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {!validation.valid && validation.message && (
                                            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
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
                                        className={`btn-secondary w-full ${testStatus === 'success' ? 'border-green-500/50 text-green-400' : testStatus === 'error' ? 'border-red-500/50 text-red-400' : ''}`}
                                    >
                                        {testStatus === 'testing' && (
                                            <>
                                                <Loader className="w-4 h-4 animate-spin" />
                                                Testing Connection...
                                            </>
                                        )}
                                        {testStatus === 'success' && (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Connection Successful!
                                            </>
                                        )}
                                        {testStatus === 'error' && (
                                            <>
                                                <AlertCircle className="w-4 h-4" />
                                                Connection Failed
                                            </>
                                        )}
                                        {testStatus === 'idle' && (
                                            <>
                                                Test Connection
                                            </>
                                        )}
                                    </button>
                                    {testError && (
                                        <p className="text-xs text-red-400 mt-2">{testError}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Model Tab */}
                    {activeTab === 'model' && (
                        <div className="space-y-2">
                            <p className="text-xs text-[var(--color-text-muted)] mb-3">
                                Select the AI model to use for generating articles. Different models have different strengths and response times.
                            </p>
                            {models.map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => setLocalSettings((s) => ({ ...s, selectedModel: model.id }))}
                                    className={`w-full p-3 rounded-lg text-left transition-all flex items-center justify-between ${localSettings.selectedModel === model.id
                                        ? 'bg-[var(--color-accent)] text-[var(--color-accent-text)]'
                                        : 'bg-[var(--color-card)] border border-[var(--color-border)] hover:border-white/20'
                                        }`}
                                >
                                    <span className="font-medium text-sm">{model.name}</span>
                                    <span className={`text-xs ${localSettings.selectedModel === model.id ? 'opacity-70' : 'text-[var(--color-text-muted)]'
                                        }`}>{model.provider}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-4 border-t border-[var(--color-border)]">
                    <button onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="btn-primary">
                        {saved ? (
                            <>
                                <Check className="w-4 h-4" />
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
