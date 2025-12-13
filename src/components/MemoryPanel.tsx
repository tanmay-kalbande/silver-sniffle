// ============================================================================
// MEMORY PANEL - Simple Single Input Box
// ============================================================================

import { useState } from 'react';
import { Brain, Plus, Trash2, Check } from 'lucide-react';
import { Memory } from '../types';
import { generateId } from '../utils/helpers';

interface MemoryPanelProps {
    memories: Memory[];
    onSave: (memories: Memory[]) => void;
}

export function MemoryPanel({ memories, onSave }: MemoryPanelProps) {
    const [newContent, setNewContent] = useState('');

    const handleAdd = () => {
        if (!newContent.trim()) return;

        const newMemory: Memory = {
            id: generateId(),
            category: 'personal',
            title: newContent.slice(0, 50),
            content: newContent.trim(),
            createdAt: new Date(),
        };

        onSave([...memories, newMemory]);
        setNewContent('');
    };

    const handleDelete = (id: string) => {
        onSave(memories.filter((m) => m.id !== id));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleAdd();
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center">
                        <Brain className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Memory</h1>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            Add context to personalize your articles
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Add New Memory Box */}
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4">
                        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                            Add information about yourself
                        </label>
                        <textarea
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g., I'm a software engineer with 5 years experience in React and TypeScript. I love writing about productivity and tech topics..."
                            className="textarea-field mb-3"
                            rows={4}
                        />
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--color-text-muted)]">
                                Press Ctrl+Enter to save
                            </span>
                            <button
                                onClick={handleAdd}
                                disabled={!newContent.trim()}
                                className="btn-primary text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Add Memory
                            </button>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                        <p className="text-sm text-blue-300">
                            💡 <strong>Tip:</strong> Add information about your background, expertise, writing preferences, and personal experiences. This helps the AI generate more personalized content.
                        </p>
                    </div>

                    {/* Existing Memories */}
                    {memories.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                                Your Memories ({memories.length})
                            </h3>
                            <div className="space-y-2">
                                {memories.map((memory) => (
                                    <div
                                        key={memory.id}
                                        className="group flex items-start gap-3 p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg hover:border-white/20 transition-colors"
                                    >
                                        <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                        <p className="flex-1 text-sm text-[var(--color-text-secondary)] line-clamp-2">
                                            {memory.content}
                                        </p>
                                        <button
                                            onClick={() => handleDelete(memory.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-[var(--color-text-muted)] hover:text-red-400 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {memories.length === 0 && (
                        <div className="text-center py-8 text-[var(--color-text-muted)]">
                            <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No memories yet</p>
                            <p className="text-xs mt-1">Add information above to get started</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
