// ============================================================================
// STORAGE UTILITIES - LocalStorage Persistence  
// ============================================================================

import { Article, Memory, WritingExample, APISettings } from '../types';

const STORAGE_KEYS = {
    ARTICLES: 'article-gen-articles',
    MEMORIES: 'article-gen-memories',
    EXAMPLES: 'article-gen-examples',
    SETTINGS: 'article-gen-settings',
};

const defaultSettings: APISettings = {
    googleApiKey: '',
    mistralApiKey: '',
    cerebrasApiKey: '',
    zhipuApiKey: '',
    selectedModel: 'gemini-2.5-flash',
};

// Parse dates from JSON
function parseDate(dateStr: string | Date): Date {
    if (dateStr instanceof Date) return dateStr;
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// Articles
export function getArticles(): Article[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.ARTICLES);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return parsed.map((a: Article) => ({
            ...a,
            createdAt: parseDate(a.createdAt),
            updatedAt: parseDate(a.updatedAt),
        }));
    } catch {
        return [];
    }
}

export function saveArticles(articles: Article[]): void {
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
}

// Memories
export function getMemories(): Memory[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.MEMORIES);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return parsed.map((m: Memory) => ({
            ...m,
            createdAt: parseDate(m.createdAt),
        }));
    } catch {
        return [];
    }
}

export function saveMemories(memories: Memory[]): void {
    localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
}

// Writing Examples
export function getExamples(): WritingExample[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.EXAMPLES);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return parsed.map((e: WritingExample) => ({
            ...e,
            createdAt: parseDate(e.createdAt),
        }));
    } catch {
        return [];
    }
}

export function saveExamples(examples: WritingExample[]): void {
    localStorage.setItem(STORAGE_KEYS.EXAMPLES, JSON.stringify(examples));
}

// Settings
export function getSettings(): APISettings {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (!stored) return defaultSettings;
        return { ...defaultSettings, ...JSON.parse(stored) };
    } catch {
        return defaultSettings;
    }
}

export function saveSettings(settings: APISettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// Export as object for convenience
export const storageUtils = {
    getArticles,
    saveArticles,
    getMemories,
    saveMemories,
    getExamples,
    saveExamples,
    getSettings,
    saveSettings,
};
