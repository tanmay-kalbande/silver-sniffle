// ============================================================================
// TYPES - Article Generator with Templates
// ============================================================================

// AI Models (including Gemma 3 27B)
export type AIModel =
    | 'gemini-2.5-flash'
    | 'gemini-2.5-pro'
    | 'gemma-3-27b-it'
    | 'gpt-oss-120b'
    | 'mistral-large-latest'
    | 'mistral-medium-latest'
    | 'glm-4.5-flash'
    | 'qwen-3-235b-a22b-instruct-2507'
    | 'zai-glm-4.6';

// Article structure
export interface Article {
    id: string;
    title: string;
    subtitle: string;
    content: string;
    topic?: string;
    tone?: string;
    length?: string;
    template?: string; // New: track which template was used
    createdAt: Date;
    updatedAt: Date;
}

// Article Template for structured generation
export interface ArticleTemplate {
    id: string;
    name: string;
    description: string;
    structure: string;
    promptSuffix: string;
}

// Memory for AI context
export type MemoryCategory = 'personal' | 'writing-style' | 'expertise' | 'preferences';

export interface Memory {
    id: string;
    category: MemoryCategory;
    title: string;
    content: string;
    createdAt: Date;
}

// Writing example for tone matching
export interface WritingExample {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
}

// Chat message
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

// API Settings
export interface APISettings {
    googleApiKey: string;
    mistralApiKey: string;
    cerebrasApiKey: string;
    zhipuApiKey: string;
    selectedModel: AIModel;
}

// App views
export type AppView = 'generator' | 'articles' | 'memories' | 'examples';
