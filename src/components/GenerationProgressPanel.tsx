// ============================================================================
// GENERATION PROGRESS PANEL - Typewriter Animation & Progress Tracking
// Adapted from Pustakam Book Generator for Article Writer
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { Loader2, TrendingUp, XCircle, Zap, Eye, EyeOff, FileText, Gauge } from 'lucide-react';

interface GenerationProgressPanelProps {
    isGenerating: boolean;
    streamedContent: string;
    startTime: Date | null;
    onCancel?: () => void;
}

// Stat Card Component
const StatCard = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) => (
    <div className="bg-black/30 rounded-lg p-3 border border-white/5 flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-md">
            <Icon className="w-4 h-4 text-gray-400" />
        </div>
        <div>
            <div className="text-xs text-gray-400">{label}</div>
            <div className="text-base font-semibold text-white font-mono">{value}</div>
        </div>
    </div>
);

export function GenerationProgressPanel({
    isGenerating,
    streamedContent,
    startTime,
    onCancel,
}: GenerationProgressPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [typedText, setTypedText] = useState('');
    const [showLiveFeed, setShowLiveFeed] = useState(true);
    const liveFeedRef = useRef<HTMLDivElement>(null);

    // Calculate stats
    const wordCount = streamedContent.split(/\s+/).filter(Boolean).length;
    const elapsedSeconds = startTime ? (Date.now() - startTime.getTime()) / 1000 : 0;
    const wordsPerMinute = elapsedSeconds > 0 ? Math.round((wordCount / elapsedSeconds) * 60) : 0;

    // Typewriter effect
    useEffect(() => {
        if (!isGenerating || !streamedContent) return;

        const fullText = streamedContent;
        if (fullText === typedText) return;

        let i = typedText.length;
        if (i > fullText.length) {
            i = 0;
            setTypedText('');
        }

        const timer = setInterval(() => {
            if (i < fullText.length) {
                setTypedText((prev) => prev + fullText[i]);
                i++;

                // Auto-scroll live feed
                if (liveFeedRef.current && showLiveFeed) {
                    liveFeedRef.current.scrollTop = liveFeedRef.current.scrollHeight;
                }
            } else {
                clearInterval(timer);
            }
        }, 8); // Fast typewriter speed

        return () => clearInterval(timer);
    }, [streamedContent, isGenerating, showLiveFeed]);

    // Reset typed text when generation starts
    useEffect(() => {
        if (isGenerating && !streamedContent) {
            setTypedText('');
        }
    }, [isGenerating, streamedContent]);

    // Don't render if not generating
    if (!isGenerating) return null;

    // Get the last 500 characters for display (most recent content)
    const displayText = typedText.slice(-800);

    return (
        <div className="fixed bottom-6 right-6 w-[420px] max-w-[calc(100vw-3rem)] rounded-2xl border-2 border-blue-500/50 shadow-2xl backdrop-blur-xl bg-black/60 transition-all duration-300 overflow-hidden z-50">
            <div className="relative z-10">
                {/* Header */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                            <div>
                                <h3 className="font-semibold text-white text-sm">Generating Article</h3>
                                <p className="text-xs text-gray-400">AI is writing...</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title={isExpanded ? 'Minimize' : 'Expand'}
                            >
                                <TrendingUp className={`w-4 h-4 transition-transform ${isExpanded ? '' : 'rotate-180'}`} />
                            </button>
                            {onCancel && (
                                <button
                                    onClick={onCancel}
                                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                    title="Cancel generation"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                        <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden border border-white/5">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
                        {/* Live Feed */}
                        <div className="bg-black/30 p-3 rounded-lg border border-white/5 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                                    <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                                        Live AI Stream
                                    </span>
                                </div>
                                <button
                                    onClick={() => setShowLiveFeed(!showLiveFeed)}
                                    className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
                                    title={showLiveFeed ? 'Hide live feed' : 'Show live feed'}
                                >
                                    {showLiveFeed ? (
                                        <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                                    ) : (
                                        <Eye className="w-3.5 h-3.5 text-gray-400" />
                                    )}
                                </button>
                            </div>

                            {showLiveFeed && displayText && (
                                <div
                                    ref={liveFeedRef}
                                    className="bg-black/40 rounded-lg p-3 max-h-[150px] overflow-y-auto border border-white/5 text-xs text-gray-300 leading-relaxed font-mono streaming-text-box"
                                >
                                    <div className="whitespace-pre-wrap">
                                        {displayText}
                                        <span className="inline-block w-1.5 h-3 bg-blue-400 animate-pulse ml-0.5" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Statistics Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            <StatCard icon={FileText} label="Words" value={wordCount.toLocaleString()} />
                            <StatCard icon={Gauge} label="WPM" value={wordsPerMinute} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
