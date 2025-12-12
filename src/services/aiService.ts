// ============================================================================
// AI SERVICE - Multi-Model Support with Human-Style Defaults
// ============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIModel, APISettings, Memory, WritingExample } from '../types';

// Default system prompt for human-sounding writing
const humanWritingPrompt = `You are a skilled human writer creating content for Medium articles. Your writing should:

1. SOUND HUMAN, NOT AI:
   - Use natural conversational language
   - Include contractions (I'm, you'll, we're, don't)
   - Vary sentence lengths naturally
   - Express genuine opinions and emotions
   - Share personal anecdotes when appropriate

2. AVOID THESE AI PATTERNS:
   - Never start with "In today's..." or "In the world of..."
   - Never use "Let's dive in" or "Let's explore"
   - Avoid "Whether you're a... or a..."
   - Skip "It's important to note that..."
   - No excessive hedging or qualifiers
   - Don't overuse transition words

3. BE ENGAGING:
   - Start with a hook that grabs attention
   - Use specific examples and stories
   - Be direct and confident
   - End with impact, not generic calls to action

You write like a real person sharing their expertise, not like an AI generating content.`;

// OpenAI-compatible streaming response
async function* streamOpenAICompatResponse(
    url: string,
    apiKey: string,
    model: string,
    messages: { role: string; content: string }[],
    systemPrompt: string
): AsyncGenerator<string> {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages,
            ],
            stream: true,
            temperature: 0.8,
            max_tokens: 8000,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') return;

                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) yield content;
                } catch {
                    // Skip invalid JSON
                }
            }
        }
    }
}

class AiService {
    private settings: APISettings = {
        googleApiKey: '',
        mistralApiKey: '',
        cerebrasApiKey: '',
        zhipuApiKey: '',
        selectedModel: 'gemini-2.5-flash',
    };

    private memories: Memory[] = [];
    private examples: WritingExample[] = [];

    updateSettings(settings: APISettings): void {
        this.settings = settings;
    }

    updateMemories(memories: Memory[]): void {
        this.memories = memories;
    }

    updateExamples(examples: WritingExample[]): void {
        this.examples = examples;
    }

    private buildSystemPrompt(): string {
        let prompt = humanWritingPrompt;

        // Add memories if available
        if (this.memories.length > 0) {
            prompt += '\n\n--- AUTHOR CONTEXT ---\n';
            this.memories.forEach((m) => {
                prompt += `[${m.category.toUpperCase()}] ${m.title}: ${m.content}\n`;
            });
        }

        // Add writing examples if available
        if (this.examples.length > 0) {
            prompt += '\n\n--- WRITING STYLE EXAMPLES ---\n';
            prompt += 'Match this writing style, tone, and vocabulary:\n\n';
            this.examples.forEach((e, i) => {
                prompt += `Example ${i + 1}: "${e.content.slice(0, 500)}..."\n\n`;
            });
        }

        return prompt;
    }

    private getModelConfig(model: AIModel): { provider: 'google' | 'mistral' | 'cerebras' | 'zhipu'; modelId: string } {
        switch (model) {
            case 'gemini-2.5-flash':
            case 'gemini-2.5-pro':
                return { provider: 'google', modelId: model };
            case 'mistral-large-latest':
            case 'mistral-medium-latest':
                return { provider: 'mistral', modelId: model };
            case 'glm-4.5-flash':
                return { provider: 'zhipu', modelId: model };
            case 'gpt-oss-120b':
            case 'qwen-3-235b-a22b-instruct-2507':
            case 'zai-glm-4.6':
                return { provider: 'cerebras', modelId: model };
            default:
                return { provider: 'google', modelId: 'gemini-2.5-flash' };
        }
    }

    async *generateStreamingResponse(
        messages: { role: string; content: string }[]
    ): AsyncGenerator<string> {
        const { provider, modelId } = this.getModelConfig(this.settings.selectedModel);
        const systemPrompt = this.buildSystemPrompt();

        switch (provider) {
            case 'google': {
                if (!this.settings.googleApiKey) throw new Error('Google API key not set');
                const genAI = new GoogleGenerativeAI(this.settings.googleApiKey);
                const model = genAI.getGenerativeModel({ model: modelId });

                const chat = model.startChat({
                    history: messages.slice(0, -1).map((m) => ({
                        role: m.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: m.content }],
                    })),
                    generationConfig: { temperature: 0.8, maxOutputTokens: 8000 },
                });

                const lastMessage = messages[messages.length - 1];
                const fullMessage = `${systemPrompt}\n\n${lastMessage.content}`;
                const result = await chat.sendMessageStream(fullMessage);

                for await (const chunk of result.stream) {
                    yield chunk.text();
                }
                break;
            }

            case 'mistral': {
                if (!this.settings.mistralApiKey) throw new Error('Mistral API key not set');
                yield* streamOpenAICompatResponse(
                    'https://api.mistral.ai/v1/chat/completions',
                    this.settings.mistralApiKey,
                    modelId,
                    messages,
                    systemPrompt
                );
                break;
            }

            case 'cerebras': {
                if (!this.settings.cerebrasApiKey) throw new Error('Cerebras API key not set');
                yield* streamOpenAICompatResponse(
                    'https://api.cerebras.ai/v1/chat/completions',
                    this.settings.cerebrasApiKey,
                    modelId,
                    messages,
                    systemPrompt
                );
                break;
            }

            case 'zhipu': {
                if (!this.settings.zhipuApiKey) throw new Error('Zhipu API key not set');
                yield* streamOpenAICompatResponse(
                    'https://open.bigmodel.cn/api/paas/v4/chat/completions',
                    this.settings.zhipuApiKey,
                    modelId,
                    messages,
                    systemPrompt
                );
                break;
            }
        }
    }
}

export const aiService = new AiService();
