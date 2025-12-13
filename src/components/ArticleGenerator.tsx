// ============================================================================
// ARTICLE GENERATOR - Enhanced UI with Better Human Tone (COMPLETE)
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { Wand2, Clock, Type, RefreshCw, Copy, Check, Plus, Edit3, Eye, Download, AlertCircle, X, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Article, Memory, WritingExample, ArticleTemplate } from '../types';
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
    { id: 'short', label: 'Short', words: '~500', desc: 'Quick read' },
    { id: 'medium', label: 'Medium', words: '~1000', desc: 'Standard' },
    { id: 'long', label: 'Long', words: '~2000', desc: 'In-depth' },
    { id: 'comprehensive', label: 'Full', words: '~3000+', desc: 'Complete guide' },
];

const templates: ArticleTemplate[] = [
    {
        id: 'none',
        name: 'Free-form',
        description: 'No structure',
        structure: '',
        promptSuffix: ''
    },
    {
        id: 'how-to',
        name: 'How-To',
        description: 'Step-by-step guide',
        structure: 'Problem → Solution → Steps → Results',
        promptSuffix: '\n\nSTRUCTURE: Start with the problem, explain your solution, provide clear steps, show results with examples.'
    },
    {
        id: 'listicle',
        name: 'Listicle',
        description: '7-10 powerful points',
        structure: 'Numbered list with examples',
        promptSuffix: '\n\nFORMAT: Create 7-10 items. Each with a clear heading and 2-3 sentences with specific examples.'
    },
    {
        id: 'opinion',
        name: 'Opinion',
        description: 'Strong perspective',
        structure: 'Hook → Argument → Evidence → Conclusion',
        promptSuffix: '\n\nTONE: Strong personal voice. Include your unique perspective with real examples and experiences.'
    },
    {
        id: 'case-study',
        name: 'Case Study',
        description: 'Real-world analysis',
        structure: 'Background → Challenge → Solution → Results',
        promptSuffix: '\n\nINCLUDE: Specific data, real quotes, before/after comparisons, and actionable takeaways.'
    },
    {
        id: 'deep-dive',
        name: 'Deep Dive',
        description: 'Comprehensive analysis',
        structure: 'Overview → Details → Implications',
        promptSuffix: '\n\nDEPTH: Thorough analysis with multiple perspectives, data-backed insights, expert viewpoints.'
    },
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
    const [selectedTemplate, setSelectedTemplate] = useState('none');
    const [isGenerating, setIsGenerating] = useState(false);
    const [streamedContent, setStreamedContent] = useState('');
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [wordGoal, setWordGoal] = useState<number | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    // Auto-scroll during generation
    useEffect(() => {
        if (isGenerating && contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [streamedContent, isGenerating]);

    // Close export menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setShowExportMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    useEffect(() => {
        const goals = {
            short: 600,
            medium: 1100,
            long: 2000,
            comprehensive: 3000,
        };
        setWordGoal(goals[selectedLength as keyof typeof goals] || null);
    }, [selectedLength]);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic for your article');
            return;
        }

        setIsGenerating(true);
        setStreamedContent('');
        setError(null);

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

        const template = templates.find(t => t.id === selectedTemplate);
        const templateInfo = template && template.id !== 'none' 
            ? `\n\nTEMPLATE: ${template.name}\n${template.structure}\n${template.promptSuffix}` 
            : '';

        const prompt = `Write a complete Medium article about: "${topic}"

REQUIREMENTS:
- Length: ${lengthGuide[selectedLength as keyof typeof lengthGuide]}
- CRITICAL: Write like a REAL HUMAN, not AI
- Use natural language, contractions (I'm, you'll, don't)
- Be conversational and direct
- Share personal insights and examples
- Avoid AI clichés: "In today's world", "Let's dive in", "It's important to note"

FORMAT:
- Start with a compelling hook (question, story, or bold statement)
- Use markdown: ## for main sections, ### for subsections
- Write in short, punchy paragraphs
- End with impact, not generic CTAs

IMAGE PROMPTS (IMPORTANT):
- Include ${imageCount} image prompt(s) strategically placed
- Format: > 🖼️ **IMAGE PROMPT:** [Detailed description for AI image generation. Include style, mood, colors, composition. Make it specific for DALL-E/Midjourney. 2-3 sentences.]

VIRAL TOOLKIT (END OF ARTICLE):
After content, add:
---
## Viral Toolkit
**3 Alternative Headlines:**
1. [Click-worthy but honest title]
2. [Curiosity-driven title]
3. [Benefit-focused title]

**5 SEO Tags:** tag1, tag2, tag3, tag4, tag5

**Meta Description (150 chars):** [SEO-optimized summary]

${memoryContext}${exampleContext}${templateInfo}

Write the complete article now.`;

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

            // Extract title
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

            // Extract subtitle
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
                template: selectedTemplate !== 'none' ? selectedTemplate : undefined,
            });

        } catch (error) {
            console.error('Generation failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            
            if (errorMessage.includes('API key')) {
                setError('Invalid API key. Check settings and try again.');
            } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
                setError('API quota exceeded. Check your plan or try different model.');
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                setError('Network error. Check internet and try again.');
            } else {
                setError(`Generation failed: ${errorMessage}`);
            }
            
            setStreamedContent('');
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

    const exportArticle = (format: 'markdown' | 'html' | 'txt') => {
        if (!article) return;

        let content = '';
        let filename = '';
        let mimeType = '';

        const sanitizedTitle = article.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();

        switch (format) {
            case 'markdown':
                content = `# ${article.title}\n\n${article.subtitle ? `*${article.subtitle}*\n\n` : ''}${article.content}`;
                filename = `${sanitizedTitle}.md`;
                mimeType = 'text/markdown';
                break;
            case 'html':
                content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.title}</title>
    <style>
        body {
            max-width: 700px;
            margin: 0 auto;
            padding: 40px 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        h1 { font-size: 2.5em; margin-bottom: 0.2em; line-height: 1.2; }
        .subtitle { color: #666; font-size: 1.2em; font-style: italic; margin-bottom: 2em; }
        .content { font-size: 1.1em; }
        h2 { font-size: 1.8em; margin-top: 1.5em; }
        h3 { font-size: 1.4em; margin-top: 1.2em; }
        blockquote { border-left: 4px solid #3b82f6; padding-left: 1em; color: #666; font-style: italic; }
    </style>
</head>
<body>
    <h1>${article.title}</h1>
    ${article.subtitle ? `<p class="subtitle">${article.subtitle}</p>` : ''}
    <div class="content">${article.content.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('\n')}</div>
</body>
</html>`;
                filename = `${sanitizedTitle}.html`;
                mimeType = 'text/html';
                break;
            case 'txt':
                content = `${article.title}\n${article.subtitle ? article.subtitle + '\n' : ''}\n${article.content}`;
                filename = `${sanitizedTitle}.txt`;
                mimeType = 'text/plain';
                break;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowExportMenu(false);
    };

    // Welcome Screen
    if (!article || (!article.content && !streamedContent)) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
                <div className="w-full max-w-2xl mx-auto space-y-6">
                    {/* Logo & Greeting */}
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                                <div className="absolute inset-0 bg-blue-500/30 rounded-3xl blur-2xl -z-10"></div>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
                                {getGreeting()}
                            </h1>
                            <p className="text-xl text-gray-400">
                                What story will you tell today?
                            </p>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-red-300 font-medium">{error}</p>
                            </div>
                            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Generation Form */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
                        {/* Topic Input */}
                        <div>
                            <label className="block text-sm font-bold text-white mb-3 uppercase tracking-wider">
                                Your Topic
                            </label>
                            <textarea
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., How I 10x'd my productivity with simple daily habits..."
                                className="w-full bg-white/5 border-2 border-white/10 focus:border-blue-500/50 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none transition-all resize-none"
                                rows={3}
                                autoFocus
                            />
                        </div>

                        {/* Template & Length - Side by Side */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Template */}
                            <div>
                                <label className="block text-sm font-bold text-white mb-3 uppercase tracking-wider">
                                    Template
                                </label>
                                <select
                                    value={selectedTemplate}
                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                    className="w-full bg-white/5 border-2 border-white/10 focus:border-blue-500/50 rounded-xl px-4 py-3 text-white focus:outline-none transition-all cursor-pointer"
                                >
                                    {templates.map((template) => (
                                        <option key={template.id} value={template.id} className="bg-gray-900">
                                            {template.name}
                                        </option>
                                    ))}
                                </select>
                                {selectedTemplate !== 'none' && (
                                    <p className="text-xs text-gray-400 mt-2">
                                        {templates.find(t => t.id === selectedTemplate)?.description}
                                    </p>
                                )}
                            </div>

                            {/* Length */}
                            <div>
                                <label className="block text-sm font-bold text-white mb-3 uppercase tracking-wider">
                                    Length
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {lengthOptions.map((len) => (
                                        <button
                                            key={len.id}
                                            onClick={() => setSelectedLength(len.id)}
                                            className={`p-3 rounded-xl text-center transition-all font-medium ${
                                                selectedLength === len.id
                                                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                                                    : 'bg-white/5 border border-white/10 hover:border-white/30 text-gray-300'
                                            }`}
                                        >
                                            <div className="text-sm font-bold">{len.label}</div>
                                            <div className="text-xs opacity-70">{len.words}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Context Info */}
                        {(memories.length > 0 || examples.length > 0) && (
                            <div className="flex flex-wrap gap-2">
                                {memories.length > 0 && (
                                    <span className="px-3 py-1.5 bg-green-500/20 text-green-300 rounded-full text-sm font-medium">
                                        ✓ {memories.length} {memories.length === 1 ? 'memory' : 'memories'}
                                    </span>
                                )}
                                {examples.length > 0 && (
                                    <span className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium">
                                        ✓ {examples.length} style {examples.length === 1 ? 'example' : 'examples'}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* API Key Warning */}
                        {!hasApiKey && (
                            <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-xl">
                                <p className="text-sm text-red-300 font-medium">
                                    ⚠️ Configure your API key in settings to get started
                                </p>
                            </div>
                        )}

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={!topic.trim() || isGenerating || !hasApiKey}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                    Generating Magic...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-6 h-6" />
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
    const progress = wordGoal ? Math.min((wordCount / wordGoal) * 100, 100) : 0;

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/20 backdrop-blur-xl">
                <div className="flex items-center gap-5 text-sm">
                    <span className="flex items-center gap-2 text-gray-300 font-medium">
                        <Type className="w-4 h-4 text-blue-400" />
                        {wordCount} words
                    </span>
                    <span className="flex items-center gap-2 text-gray-300 font-medium">
                        <Clock className="w-4 h-4 text-purple-400" />
                        {readingTime} min
                    </span>
                    {wordGoal && (
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-xs text-gray-400 font-bold">{Math.round(progress)}%</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleCopy} className="btn-secondary text-sm">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                    
                    <div className="relative" ref={exportMenuRef}>
                        <button 
                            onClick={() => setShowExportMenu(!showExportMenu)} 
                            className="btn-secondary text-sm"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-2 z-10">
                                <button
                                    onClick={() => exportArticle('markdown')}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 rounded-lg transition-colors text-white"
                                >
                                    📄 Markdown (.md)
                                </button>
                                <button
                                    onClick={() => exportArticle('html')}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 rounded-lg transition-colors text-white"
                                >
                                    🌐 HTML
                                </button>
                                <button
                                    onClick={() => exportArticle('txt')}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 rounded-lg transition-colors text-white"
                                >
                                    📝 Plain Text
                                </button>
                            </div>
                        )}
                    </div>

                    <button onClick={onNewArticle} className="btn-primary text-sm">
                        <Plus className="w-4 h-4" />
                        New
                    </button>
                    <div className="w-px h-6 bg-white/20 mx-1" />
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                            isEditing 
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                                : 'bg-white/5 border border-white/10 text-gray-300 hover:border-white/30'
                        }`}
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

            {/* Error Display */}
            {error && (
                <div className="mx-6 mt-4 bg-red-500/10 border-2 border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm text-red-300">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Content */}
            <div ref={contentRef} className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-8 py-12">
                    <input
                        type="text"
                        value={article.title}
                        onChange={(e) => onUpdateArticle({ title: e.target.value })}
                        placeholder="Your Compelling Title..."
                        className="w-full bg-transparent border-none text-5xl font-black text-white placeholder:text-gray-700 focus:outline-none mb-4 leading-tight"
                    />

                    <input
                        type="text"
                        value={article.subtitle}
                        onChange={(e) => onUpdateArticle({ subtitle: e.target.value })}
                        placeholder="Add a captivating subtitle..."
                        className="w-full bg-transparent border-none text-xl text-gray-400 placeholder:text-gray-700 focus:outline-none mb-8 leading-relaxed"
                    />

                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-10" />

                    {/* Article Content */}
                    <div className="min-h-[60vh]">
                        {isEditing ? (
                            <textarea
                                value={content}
                                onChange={(e) => onUpdateArticle({ content: e.target.value })}
                                className="w-full h-[70vh] bg-white/5 text-white p-6 rounded-2xl border-2 border-white/10 font-mono text-sm leading-loose focus:outline-none focus:border-blue-500/50 resize-none"
                                placeholder="Start writing your story..."
                            />
                        ) : (
                            <div className="prose prose-invert prose-lg max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h1: ({ children }) => <h1 className="text-4xl font-black text-white mb-6 mt-8 leading-tight">{children}</h1>,
                                        h2: ({ children }) => <h2 className="text-3xl font-bold text-white mb-5 mt-10 leading-snug">{children}</h2>,
                                        h3: ({ children }) => <h3 className="text-2xl font-bold text-gray-200 mb-4 mt-8">{children}</h3>,
                                        p: ({ children }) => <p className="text-lg text-gray-300 mb-6 leading-relaxed">{children}</p>,
                                        strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                                        em: ({ children }) => <em className="italic text-gray-400">{children}</em>,
                                        ul: ({ children }) => <ul className="list-disc list-inside mb-6 space-y-2 text-gray-300 pl-4">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal list-inside mb-6 space-y-2 text-gray-300 pl-4">{children}</ol>,
                                        li: ({ children }) => <li className="text-gray-300 leading-relaxed pl-1">{children}</li>,
                                        blockquote: ({ children }) => (
                                            <blockquote className="border-l-4 border-blue-500 pl-6 italic text-gray-400 my-8 py-2 bg-blue-500/5 rounded-r-lg">
                                                {children}
                                            </blockquote>
                                        ),
                                        code: ({ children }) => <code className="bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-blue-400">{children}</code>,
                                        pre: ({ children }) => <pre className="bg-black/30 p-4 rounded-xl overflow-x-auto mb-6 border border-white/10">{children}</pre>,
                                        img: ({ src, alt }) => <img src={src} alt={alt} className="rounded-xl shadow-lg my-6 w-full border border-white/10" />,
                                    }}
                                >
                                    {content || 'Your article content will appear here...'}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                    
                    {/* Generation Spinner */}
                    {isGenerating && (
                        <div className="flex items-center gap-3 text-sm text-gray-400 mt-8 animate-pulse justify-center">
                            <div className="w-5 h-5 border-2 border-blue-500/50 border-t-blue-500 rounded-full animate-spin" />
                            <span>Crafting your masterpiece...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
