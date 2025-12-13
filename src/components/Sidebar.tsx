// ============================================================================
// SIDEBAR - With Article Scores
// ============================================================================

import { useState, useMemo } from 'react';
import {
    PenLine,
    FileText,
    Brain,
    BookOpen,
    Settings,
    Plus,
    Trash2,
    X,
    ChevronLeft,
    ChevronRight,
    Search,
    Star,
} from 'lucide-react';
import { Article, AppView } from '../types';
import { formatDate, countWords } from '../utils/helpers';

interface SidebarProps {
    articles: Article[];
    currentArticle: Article | null;
    currentView: AppView;
    isOpen: boolean;
    isFolded: boolean;
    onSelectArticle: (article: Article) => void;
    onNewArticle: () => void;
    onDeleteArticle: (id: string) => void;
    onChangeView: (view: AppView) => void;
    onOpenSettings: () => void;
    onClose: () => void;
    onToggleFold: () => void;
}

// Calculate article score based on content quality indicators
function calculateScore(article: Article): number {
    if (!article.content) return 0;

    const words = countWords(article.content);
    const hasHeadings = (article.content.match(/^#{1,3}\s/gm) || []).length;
    const hasParagraphs = (article.content.match(/\n\n/g) || []).length;
    const hasTitle = article.title.length > 10;
    const hasSubtitle = article.subtitle.length > 0;

    let score = 1; // Base score
    if (words > 200) score += 1;
    if (words > 500) score += 1;
    if (words > 1000) score += 1;
    if (hasHeadings > 2) score += 0.5;
    if (hasParagraphs > 3) score += 0.5;
    if (hasTitle) score += 0.5;
    if (hasSubtitle) score += 0.5;

    return Math.min(5, Math.round(score * 10) / 10);
}

// Generate title if empty
function getDisplayTitle(article: Article): string {
    if (article.title) return article.title;
    if (article.content) {
        // Get first line or first 50 chars
        const firstLine = article.content.split('\n')[0].replace(/^#+ /, '').trim();
        if (firstLine.length > 50) return firstLine.slice(0, 47) + '...';
        if (firstLine) return firstLine;
    }
    return 'Untitled';
}

export function Sidebar({
    articles,
    currentArticle,
    currentView,
    isOpen,
    isFolded,
    onSelectArticle,
    onNewArticle,
    onDeleteArticle,
    onChangeView,
    onOpenSettings,
    onClose,
    onToggleFold,
}: SidebarProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const filteredArticles = useMemo(() =>
        articles.filter(a =>
            a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.content.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        [articles, searchQuery]
    );

    const sidebarClasses = `glass-panel flex flex-col h-full border-r border-[var(--color-border)] transition-all duration-300 fixed lg:static z-50 ${isOpen ? 'left-0' : '-left-full lg:left-0'
        } ${isFolded ? 'w-16' : 'w-64'}`;

    return (
        <aside className={sidebarClasses}>
            {/* Header */}
            <div className="p-2 border-b border-[var(--color-border)] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    {!isFolded && (
                        <a href="/" className="flex items-center gap-2.5 group px-2">
                            <img src="/palm-color.png" alt="Article Gen Logo" className="w-6 h-6" />
                            <h1 className="text-lg font-semibold text-[var(--color-text-primary)] group-hover:opacity-80 transition-opacity">Article Gen</h1>
                        </a>
                    )}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onOpenSettings}
                            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)] rounded-lg transition-colors"
                            title="Settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onToggleFold}
                            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)] rounded-lg hidden lg:block transition-colors"
                            title={isFolded ? 'Expand' : 'Collapse'}
                        >
                            {isFolded ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)] rounded-lg lg:hidden transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* New Article Button */}
                <button
                    onClick={onNewArticle}
                    className={`w-full flex items-center ${isFolded ? 'justify-center' : 'justify-start'} gap-2 px-3 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] rounded-lg text-[var(--color-accent-text)] font-semibold transition-all`}
                >
                    <Plus className="w-4 h-4" />
                    {!isFolded && <span>New Article</span>}
                </button>
            </div>

            {/* Search */}
            {!isFolded && (
                <div className="p-3 border-b border-[var(--color-border)]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search articles..."
                            className="w-full bg-[var(--color-card)] border border-transparent focus:border-[var(--color-border)] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none transition-colors"
                        />
                    </div>
                </div>
            )}

            {/* Articles List */}
            <div className="flex-1 overflow-y-auto p-2">
                {filteredArticles.length === 0 ? (
                    <div className="text-center py-8 text-[var(--color-text-muted)]">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        {!isFolded && <p className="text-sm">No articles yet</p>}
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredArticles.map((article) => {
                            const score = calculateScore(article);
                            const displayTitle = getDisplayTitle(article);

                            return (
                                <div
                                    key={article.id}
                                    onClick={() => onSelectArticle(article)}
                                    onMouseEnter={() => setHoveredId(article.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    className={`group relative flex items-center gap-2 ${isFolded ? 'justify-center p-2.5' : 'p-2.5'} rounded-lg cursor-pointer transition-colors ${currentArticle?.id === article.id
                                            ? 'bg-white/10 text-[var(--color-text-primary)]'
                                            : 'hover:bg-white/5 text-[var(--color-text-primary)]'
                                        }`}
                                    title={displayTitle}
                                >
                                    {isFolded ? (
                                        <FileText className="w-5 h-5" />
                                    ) : (
                                        <>
                                            <FileText className="w-4 h-4 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-medium truncate flex-1">
                                                        {displayTitle}
                                                    </p>
                                                    {/* Score Badge */}
                                                    {score > 0 && (
                                                        <span className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded ${score >= 4 ? 'bg-green-500/20 text-green-400' :
                                                                score >= 2.5 ? 'bg-yellow-500/20 text-yellow-400' :
                                                                    'bg-gray-500/20 text-gray-400'
                                                            }`}>
                                                            <Star className="w-3 h-3" />
                                                            {score}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[var(--color-text-muted)] truncate">
                                                    {formatDate(article.updatedAt)}
                                                </p>
                                            </div>
                                            {hoveredId === article.id && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteArticle(article.id);
                                                    }}
                                                    className="p-1 rounded hover:bg-red-500/20 text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <div className="p-2 border-t border-[var(--color-border)]">
                <div className={`${isFolded ? 'space-y-1' : 'grid grid-cols-3 gap-1'}`}>
                    <button
                        onClick={() => onChangeView('generator')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg w-full transition-colors ${currentView === 'generator'
                                ? 'text-[var(--color-text-primary)] bg-[var(--color-card)]'
                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)]'
                            }`}
                        title="Generator"
                    >
                        <PenLine className="w-5 h-5" />
                        {!isFolded && <span className="text-xs font-semibold">Generate</span>}
                    </button>
                    <button
                        onClick={() => onChangeView('memories')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg w-full transition-colors ${currentView === 'memories'
                                ? 'text-[var(--color-text-primary)] bg-[var(--color-card)]'
                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)]'
                            }`}
                        title="Memory"
                    >
                        <Brain className="w-5 h-5" />
                        {!isFolded && <span className="text-xs font-semibold">Memory</span>}
                    </button>
                    <button
                        onClick={() => onChangeView('examples')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg w-full transition-colors ${currentView === 'examples'
                                ? 'text-[var(--color-text-primary)] bg-[var(--color-card)]'
                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)]'
                            }`}
                        title="Examples"
                    >
                        <BookOpen className="w-5 h-5" />
                        {!isFolded && <span className="text-xs font-semibold">Examples</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}
