// ============================================================================
// ARTICLE GENERATOR - Main Generation UI with Wizard
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { Sparkles, FileText, Wand2, Clock, Type, RefreshCw, Copy, Check, ChevronDown } from 'lucide-react';
import { Article, Memory, WritingExample } from '../types';
import { generateId, calculateReadingTime, countWords } from '../utils/helpers';
import { aiService } from '../services/aiService';

interface ArticleGeneratorProps {
    article: Article | null;
    memories: Memory[];
    examples: WritingExample[];
    onUpdateArticle: (updates: Partial<Article>) => void;
    onNewArticle: () => void;
}

const toneOptions = [
    { id: 'conversational', label: 'Conversational', desc: 'Friendly & relatable' },
    { id: 'professional', label: 'Professional', desc: 'Clear & authoritative' },
    { id: 'storytelling', label: 'Storytelling', desc: 'Engaging narratives' },
    { id: 'technical', label: 'Technical', desc: 'Detailed & precise' },
];

const lengthOptions = [
    { id: 'short', label: 'Short', desc: '~500 words' },
    { id: 'medium', label: 'Medium', desc: '~1000 words' },
    { id: 'long', label: 'Long', desc: '~2000 words' },
    { id: 'comprehensive', label: 'Comprehensive', desc: '~3000+ words' },
];

export function ArticleGenerator({
    article,
    memories,
    examples,
    onUpdateArticle,
    onNewArticle,
}: ArticleGeneratorProps) {
    const [topic, setTopic] = useState('');
    const [selectedTone, setSelectedTone] = useState('conversational');
    const [selectedLength, setSelectedLength] = useState('medium');
    const [isGenerating, setIsGenerating] = useState(false);
    const [streamedContent, setStreamedContent] = useState('');
    const [copied, setCopied] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Auto-scroll during generation
    useEffect(() => {
        if (isGenerating && contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [streamedContent, isGenerating]);

    const handleGenerate = async () => {
        if (!topic.trim()) return;

        setIsGenerating(true);
        setStreamedContent('');

        // Build context from memories and examples
        let memoryContext = '';
        if (memories.length > 0) {
            memoryContext = '\n\n--- AUTHOR CONTEXT ---\n';
            memories.forEach((m) => {
                memoryContext += `[${m.category.toUpperCase()}] ${m.title}: ${m.content}\n`;
            });
        }

        let exampleContext = '';
        if (examples.length > 0) {
            exampleContext = '\n\n--- WRITING STYLE EXAMPLES ---\n';
            exampleContext += 'Match this writing style, tone, and vocabulary:\n\n';
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

        const prompt = `Write a complete Medium article about: "${topic}"

REQUIREMENTS:
- Tone: ${selectedTone} - write in a ${selectedTone} style
- Length: ${lengthGuide[selectedLength as keyof typeof lengthGuide]}
- CRITICAL: Write like a HUMAN, not AI. Avoid these AI patterns:
  * NO starting with "In today's..." or "In the world of..."
  * NO "Let's dive in" or "Let's explore"
  * NO "Whether you're a..." or "It's important to note"
  * NO excessive hedging or filler phrases
  * Use contractions naturally (I'm, you'll, don't)
  * Include personal anecdotes or opinions where appropriate
  * Use varied sentence lengths and structures
  * Be direct and confident in your statements

FORMAT:
- Start with a compelling hook (personal story, surprising fact, or bold statement)
- Use markdown formatting with ## and ### headers
- Include practical examples, stories, or data
- End with a strong conclusion that leaves an impact
${memoryContext}${exampleContext}

Write the complete article now. Be authentic and engaging.`;

        try {
            let fullContent = '';
            const stream = aiService.generateStreamingResponse([
                { role: 'user', content: prompt }
            ]);

            for await (const chunk of stream) {
                fullContent += chunk;
                setStreamedContent(fullContent);
            }

            // Extract title from content or generate one
            const lines = fullContent.split('\n');
            let extractedTitle = topic;
            let extractedSubtitle = '';
            let articleContent = fullContent;

            // Check if first line is a title (# heading)
            if (lines[0].startsWith('# ')) {
                extractedTitle = lines[0].replace('# ', '').trim();
                articleContent = lines.slice(1).join('\n').trim();
            }

            // Check for subtitle (often italicized or second line)
            if (lines[1] && (lines[1].startsWith('*') || lines[1].startsWith('_'))) {
                extractedSubtitle = lines[1].replace(/[*_]/g, '').trim();
                articleContent = lines.slice(2).join('\n').trim();
            }

            onUpdateArticle({
                title: extractedTitle,
                subtitle: extractedSubtitle,
                content: articleContent,
                topic,
                tone: selectedTone,
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

    // Show wizard for new/empty article
    if (!article || (!article.content && !streamedContent)) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="max-w-xl w-full">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Generate Article</h1>
                        <p className="text-[var(--color-text-secondary)]">
                            Tell us what you want to write about
                        </p>
                    </div>

                    {/* Topic Input */}
                    <div className="glass-panel p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">What's your article about?</label>
                            <textarea
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., How I increased my productivity by 10x using the Pomodoro technique..."
                                className="textarea-field"
                                rows={3}
                                autoFocus
                            />
                        </div>

                        {/* Tone Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Writing Tone</label>
                            <div className="grid grid-cols-2 gap-2">
                                {toneOptions.map((tone) => (
                                    <button
                                        key={tone.id}
                                        onClick={() => setSelectedTone(tone.id)}
                                        className={`p-3 rounded-lg text-left transition-all ${selectedTone === tone.id
                                                ? 'bg-white text-black'
                                                : 'bg-[var(--color-card)] border border-[var(--color-border)] hover:border-white/20'
                                            }`}
                                    >
                                        <p className="font-medium text-sm">{tone.label}</p>
                                        <p className={`text-xs ${selectedTone === tone.id ? 'text-black/60' : 'text-[var(--color-text-muted)]'}`}>
                                            {tone.desc}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Length Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Article Length</label>
                            <div className="grid grid-cols-4 gap-2">
                                {lengthOptions.map((len) => (
                                    <button
                                        key={len.id}
                                        onClick={() => setSelectedLength(len.id)}
                                        className={`p-2.5 rounded-lg text-center transition-all ${selectedLength === len.id
                                                ? 'bg-white text-black'
                                                : 'bg-[var(--color-card)] border border-[var(--color-border)] hover:border-white/20'
                                            }`}
                                    >
                                        <p className="font-medium text-sm">{len.label}</p>
                                        <p className={`text-xs ${selectedLength === len.id ? 'text-black/60' : 'text-[var(--color-text-muted)]'}`}>
                                            {len.desc}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Context Info */}
                        {(memories.length > 0 || examples.length > 0) && (
                            <div className="flex gap-3 text-xs text-[var(--color-text-muted)]">
                                {memories.length > 0 && (
                                    <span className="flex items-center gap-1">
                                        ✓ {memories.length} memories loaded
                                    </span>
                                )}
                                {examples.length > 0 && (
                                    <span className="flex items-center gap-1">
                                        ✓ {examples.length} style examples
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={!topic.trim() || isGenerating}
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

    // Show generated/editing article
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
                </div>
            </div>

            {/* Content */}
            <div ref={contentRef} className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-6 py-8">
                    {/* Title */}
                    <input
                        type="text"
                        value={article.title}
                        onChange={(e) => onUpdateArticle({ title: e.target.value })}
                        placeholder="Article Title"
                        className="w-full bg-transparent border-none text-3xl font-bold text-white placeholder:text-[var(--color-text-muted)] focus:outline-none mb-3"
                    />

                    {/* Subtitle */}
                    <input
                        type="text"
                        value={article.subtitle}
                        onChange={(e) => onUpdateArticle({ subtitle: e.target.value })}
                        placeholder="Add a subtitle..."
                        className="w-full bg-transparent border-none text-lg text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] focus:outline-none mb-6"
                    />

                    <div className="h-px bg-[var(--color-border)] mb-6" />

                    {/* Content */}
                    <textarea
                        value={content}
                        onChange={(e) => onUpdateArticle({ content: e.target.value })}
                        placeholder="Your article content..."
                        className="editor-textarea min-h-[60vh]"
                        disabled={isGenerating}
                    />

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

// Add missing Plus import
import { Plus } from 'lucide-react';
