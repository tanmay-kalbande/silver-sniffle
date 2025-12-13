// ============================================================================
// ARTICLE GENERATOR - Main Generation UI with Welcome Screen
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { Wand2, Clock, Type, RefreshCw, Copy, Check, Plus, Edit3, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Article, Memory, WritingExample } from '../types';
import { calculateReadingTime, countWords } from '../utils/helpers';
import { aiService } from '../services/aiService';

interface ArticleGeneratorProps {
    article: Article | null;
    memories: Memory[];
    examples: WritingExample[];
    onUpdateArticle: (updates: Partial<Article>) => void;
    onNewArticle: () => void;
    hasApiKey: boolean;
}

const lengthOptions = [
    { id: 'short', label: 'Short', words: '~500' },
    { id: 'medium', label: 'Medium', words: '~1000' },
    { id: 'long', label: 'Long', words: '~2000' },
    { id: 'comprehensive', label: 'Full', words: '~3000+' },
];

export function ArticleGenerator({
    article,
    memories,
    examples,
    onUpdateArticle,
    onNewArticle,
    hasApiKey,
}: ArticleGeneratorProps) {
    const [topic, setTopic] = useState('');
    const [selectedLength, setSelectedLength] = useState('medium');
    const [isGenerating, setIsGenerating] = useState(false);
    const [streamedContent, setStreamedContent] = useState('');
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Auto-scroll during generation
    useEffect(() => {
        if (isGenerating && contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [streamedContent, isGenerating]);

    // Get greeting message based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const handleGenerate = async () => {
        if (!topic.trim()) return;

        setIsGenerating(true);
        setStreamedContent('');

        let memoryContext = '';
        if (memories.length > 0) {
            memoryContext = '\n\n--- AUTHOR CONTEXT ---\n';
            memories.forEach((m) => {
                memoryContext += `${m.content}\n`;
            });
        }

        let exampleContext = '';
        if (examples.length > 0) {
            exampleContext = '\n\n--- WRITING STYLE EXAMPLES ---\nMatch this writing style:\n\n';
            examples.forEach((e, i) => {
                exampleContext += `Example ${i + 1}: "${e.content.slice(0, 500)}..."\n\n`;
            });
        }

        const lengthGuide = {
            short: '500-700 words',
            medium: '1000-1200 words',
            long: '1800-2200 words',
            comprehensive: '3000+ words with multiple sections',
        };

        const imageCount = selectedLength === 'short' ? 1 : selectedLength === 'medium' ? 2 : selectedLength === 'long' ? 3 : 4;

        const prompt = `Write a complete Medium article about: "${topic}"

REQUIREMENTS:
- Length: ${lengthGuide[selectedLength as keyof typeof lengthGuide]}
- CRITICAL: Write like a HUMAN, not AI. Avoid AI patterns.
- Use contractions naturally
- Be direct and confident
- Include examples or stories

FORMAT:
- Start with a compelling hook
- Use markdown formatting with ## and ### headers
- End with a strong conclusion

IMAGE PROMPTS (VERY IMPORTANT):
- Include ${imageCount} image prompt(s) at appropriate places in the article
- Format each image prompt in a special block like this:

> 🖼️ **IMAGE PROMPT:** [Detailed, vivid description for an AI image generator. Include style, mood, colors, composition. Make it specific enough for DALL-E or Midjourney to generate a compelling image that matches the article content. 2-3 sentences.]

- Place image prompts after key sections where a visual would enhance understanding
- Image prompts should be relevant to the section content
- Make prompts specific and visually descriptive


VIRAL TOOLKIT (AT THE END):
- Add a separator line (---)
- Add a "Viral Toolkit" section with:
  1. 3 Alternative Viral Titles (Click-baity but honest)
  2. 5 SEO Tags (High volume keywords)
  3. Meta Description (150 chars, SEO optimized)

${memoryContext}${exampleContext}

Write the complete article now with image prompts and viral toolkit included.`;

        try {
            let fullContent = '';
            const stream = aiService.generateStreamingResponse([
                { role: 'user', content: prompt }
            ]);

            for await (const chunk of stream) {
                fullContent += chunk;
                setStreamedContent(fullContent);
            }

            const lines = fullContent.split('\n');
            let extractedTitle = topic;
            let extractedSubtitle = '';
            let articleContent = fullContent;
            let startIndex = 0;

            // Extract title from # or ## header
            for (let i = 0; i < Math.min(5, lines.length); i++) {
                const line = lines[i].trim();
                if (line.startsWith('# ')) {
                    extractedTitle = line.replace(/^#+\s*/, '').trim();
                    startIndex = i + 1;
                    break;
                } else if (line.startsWith('## ')) {
                    extractedTitle = line.replace(/^#+\s*/, '').trim();
                    startIndex = i + 1;
                    break;
                }
            }

            // Extract subtitle (italic text on next non-empty line)
            for (let i = startIndex; i < Math.min(startIndex + 3, lines.length); i++) {
                const line = lines[i].trim();
                if (line && (line.startsWith('*') || line.startsWith('_'))) {
                    extractedSubtitle = line.replace(/[*_]/g, '').trim();
                    startIndex = i + 1;
                    break;
                } else if (line && !line.startsWith('#')) {
                    break;
                }
            }

            articleContent = lines.slice(startIndex).join('\n').trim();

            onUpdateArticle({
                title: extractedTitle,
                subtitle: extractedSubtitle,
                content: articleContent,
                topic,
                length: selectedLength,
            });

        } catch (error) {
            console.error('Generation failed:', error);
            setStreamedContent(`Error: ${error instanceof Error ? error.message : 'Failed to generate. Check your API keys in Settings.'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        const content = article?.content || streamedContent;
        if (content) {
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Welcome Screen (no article selected or empty)
    if (!article || (!article.content && !streamedContent)) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
                <div className="w-full max-w-2xl mx-auto space-y-8">
                    {/* Logo */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="w-16 h-16 bg-[var(--color-card)] rounded-2xl flex items-center justify-center p-3 border border-[var(--color-border)] shadow-lg">
                                <img
                                    src="/palm-color.png"
                                    alt="Article Gen"
                                    className="w-full h-full object-contain"
                                    style={{ animationDuration: '2s' }}
                                />
                            </div>
                            <div className="absolute inset-0 bg-white/10 rounded-2xl blur-xl -z-10"></div>
                        </div>
                    </div>

                    {/* Greeting */}
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-2">
                            {getGreeting()}
                        </h1>
                        <p className="text-lg text-[var(--color-text-secondary)]">
                            What would you like to write about?
                        </p>
                    </div>

                    {/* Generation Form */}
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 space-y-5">
                        {/* Topic Input */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                Article Topic
                            </label>
                            <textarea
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., How I increased my productivity by 10x using simple habits..."
                                className="textarea-field"
                                rows={2}
                                autoFocus
                            />
                        </div>

                        {/* Length Selection */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                Length
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {lengthOptions.map((len) => (
                                    <button
                                        key={len.id}
                                        onClick={() => setSelectedLength(len.id)}
                                        className={`p-2 rounded-lg text-center transition-all ${selectedLength === len.id
                                            ? 'bg-[var(--color-accent)] text-[var(--color-accent-text)]'
                                            : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-white/20 text-[var(--color-text-secondary)]'
                                            }`}
                                    >
                                        <div className="text-xs font-semibold">{len.label}</div>
                                        <div className="text-xs opacity-70">{len.words}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Context Info */}
                        {(memories.length > 0 || examples.length > 0) && (
                            <div className="flex flex-wrap gap-2 text-xs">
                                {memories.length > 0 && (
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                                        ✓ {memories.length} memories
                                    </span>
                                )}
                                {examples.length > 0 && (
                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                                        ✓ {examples.length} style examples
                                    </span>
                                )}
                            </div>
                        )}

                        {/* API Key Warning */}
                        {!hasApiKey && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <p className="text-sm text-red-400">
                                    ⚠️ Configure your API key in settings to get started
                                </p>
                            </div>
                        )}

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={!topic.trim() || isGenerating || !hasApiKey}
                            className="btn-primary w-full py-3 text-base"
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-5 h-5" />
                                    Generate Article
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Article View
    const content = article.content || streamedContent;
    const wordCount = countWords(content);
    const readingTime = calculateReadingTime(content);

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1.5">
                        <Type className="w-4 h-4" />
                        {wordCount} words
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {readingTime} min read
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleCopy} className="btn-secondary text-sm">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={onNewArticle} className="btn-primary text-sm">
                        <Plus className="w-4 h-4" />
                        New
                    </button>
                    <div className="w-px h-6 bg-[var(--color-border)] mx-1" />
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`btn-secondary text-sm ${isEditing ? 'bg-[var(--color-accent)] text-white border-transparent' : ''}`}
                    >
                        {isEditing ? (
                            <>
                                <Eye className="w-4 h-4" />
                                Preview
                            </>
                        ) : (
                            <>
                                <Edit3 className="w-4 h-4" />
                                Edit
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div ref={contentRef} className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-6 py-8">
                    <input
                        type="text"
                        value={article.title}
                        onChange={(e) => onUpdateArticle({ title: e.target.value })}
                        placeholder="Article Title"
                        className="w-full bg-transparent border-none text-3xl font-bold text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none mb-3"
                    />

                    <input
                        type="text"
                        value={article.subtitle}
                        onChange={(e) => onUpdateArticle({ subtitle: e.target.value })}
                        placeholder="Add a subtitle..."
                        className="w-full bg-transparent border-none text-lg text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] focus:outline-none mb-6"
                    />

                    <div className="h-px bg-[var(--color-border)] mb-6" />

                    {/* Article Content - Rendered Markdown or Editor */}
                    <div className="min-h-[60vh]">
                        {isEditing ? (
                            <textarea
                                value={content}
                                onChange={(e) => onUpdateArticle({ content: e.target.value })}
                                className="w-full h-[70vh] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] p-6 rounded-xl border border-[var(--color-border)] font-mono text-sm leading-relaxed focus:outline-none focus:border-[var(--color-accent)] resize-none"
                                placeholder="Start writing..."
                            />
                        ) : (
                            <div className="prose prose-invert max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h1: ({ children }) => <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4 mt-6">{children}</h1>,
                                        h2: ({ children }) => <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-3 mt-5">{children}</h2>,
                                        h3: ({ children }) => <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2 mt-4">{children}</h3>,
                                        p: ({ children }) => <p className="text-[var(--color-text-primary)] mb-4 leading-relaxed">{children}</p>,
                                        strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                                        em: ({ children }) => <em className="italic text-[var(--color-text-secondary)]">{children}</em>,
                                        ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1 text-[var(--color-text-primary)]">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1 text-[var(--color-text-primary)]">{children}</ol>,
                                        li: ({ children }) => <li className="text-[var(--color-text-primary)]">{children}</li>,
                                        blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-[var(--color-text-secondary)] my-4">{children}</blockquote>,
                                        code: ({ children }) => <code className="bg-[var(--color-card)] px-1.5 py-0.5 rounded text-sm font-mono text-blue-400">{children}</code>,
                                        pre: ({ children }) => <pre className="bg-[var(--color-card)] p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>,
                                    }}
                                >
                                    {content || 'Your article content will appear here...'}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>

                    {isGenerating && (
                        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mt-4">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Generating article...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
