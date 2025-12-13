// ============================================================================
// AI SERVICE - Enhanced with Better Human Writing Tone
// ============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIModel, APISettings, Memory, WritingExample } from '../types';

// Enhanced system prompt for truly human-sounding writing
const humanWritingPrompt = `You are a skilled human writer creating engaging content. Your writing must be INDISTINGUISHABLE from a real person.

🎯 CRITICAL: WRITE LIKE A REAL HUMAN, NOT AI

❌ NEVER USE THESE AI CLICHÉS:
- "In today's world/landscape/digital age"
- "Let's dive in/deep dive/explore"
- "Whether you're a beginner or expert"
- "It's important to note/understand"
- "In conclusion/To summarize"
- "At the end of the day"
- Excessive transition words (Moreover, Furthermore, Additionally)
- Generic calls-to-action

✅ HUMAN WRITING PRINCIPLES:

1. CONVERSATIONAL TONE:
   - Write like you're talking to a friend over coffee
   - Use contractions naturally (I'm, you'll, we're, don't, can't)
   - Ask rhetorical questions
   - Use "you" to address readers directly
   - Include personal pronouns (I, we, my)

2. AUTHENTIC VOICE:
   - Share opinions confidently (no hedging with "might" or "perhaps" everywhere)
   - Use specific examples from real life
   - Include occasional humor or wit
   - Show personality and emotion
   - Be direct - cut filler words

3. NATURAL RHYTHM:
   - Vary sentence length dramatically
   - Some short. Some medium. And some that flow longer with multiple connected thoughts.
   - Start sentences differently (avoid repetitive patterns)
   - Use fragments for emphasis. Like this.

4. ENGAGING HOOKS:
   - Start with a bold statement, question, or mini-story
   - NO "In this article, we'll explore..."
   - Jump straight into the interesting part
   - Create curiosity immediately

5. REAL EXAMPLES:
   - Use specific numbers, names, scenarios
   - Include relatable situations readers have experienced
   - Share actual insights, not generic advice
   - Make examples vivid and memorable

6. STRONG ENDINGS:
   - End with impact, not summary
   - Leave readers with one powerful takeaway
   - NO "So there you have it" or "I hope you found this helpful"
   - Call to reflection, not just action

7. FORMATTING:
   - Short paragraphs (2-4 sentences max)
   - Use subheadings that create curiosity
   - Bold key phrases sparingly
   - Include occasional one-sentence paragraphs for punch

Remember: The best writing doesn't announce itself. It flows naturally, keeps readers engaged, and sounds like one human sharing insights with another.`;

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
            temperature: 0.85, // Slightly higher for more natural variation
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
            prompt += 'Use this information naturally in your writing:\n';
            this.memories.forEach((m) => {
                prompt += `• ${m.content}\n`;
            });
        }

        // Add writing examples if available
        if (this.examples.length > 0) {
            prompt += '\n\n--- WRITING STYLE TO MATCH ---\n';
            prompt += 'Study this writing style carefully and replicate it:\n\n';
            this.examples.forEach((e, i) => {
                prompt += `Example ${i + 1}:\n"${e.content.slice(0, 600)}..."\n\n`;
            });
            prompt += 'Match this exact tone, vocabulary, sentence structure, and personality.';
        }

        return prompt;
    }

    private getModelConfig(model: AIModel): { provider: 'google' | 'mistral' | 'cerebras' | 'zhipu'; modelId: string } {
        switch (model) {
            case 'gemini-2.5-flash':
            case 'gemini-2.5-pro':
            case 'gemma-3-27b-it':
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
                const model = genAI.getGenerativeModel({ 
                    model: modelId,
                    generationConfig: {
                        temperature: 0.85,
                        topP: 0.95,
                        topK: 40,
                        maxOutputTokens: 8000,
                    }
                });

                const chat = model.startChat({
                    history: messages.slice(0, -1).map((m) => ({
                        role: m.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: m.content }],
                    })),
                });

                const lastMessage = messages[messages.length - 1];
                const fullMessage = `${systemPrompt}\n\n---\n\n${lastMessage.content}`;
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
