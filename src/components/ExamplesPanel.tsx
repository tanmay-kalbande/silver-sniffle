// ============================================================================
// EXAMPLES PANEL - Writing Style Samples
// ============================================================================

import { useState } from 'react';
import { BookOpen, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { WritingExample } from '../types';
import { generateId, formatDate, truncateText } from '../utils/helpers';

interface ExamplesPanelProps {
    examples: WritingExample[];
    onSave: (examples: WritingExample[]) => void;
}

export function ExamplesPanel({ examples, onSave }: ExamplesPanelProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    const handleAdd = () => {
        if (!newTitle.trim() || !newContent.trim()) return;
        const newExample: WritingExample = {
            id: generateId(),
            title: newTitle.trim(),
            content: newContent.trim(),
            createdAt: new Date(),
        };
        onSave([...examples, newExample]);
        setNewTitle('');
        setNewContent('');
        setIsAdding(false);
    };

    const handleEdit = (example: WritingExample) => {
        setEditingId(example.id);
        setEditTitle(example.title);
        setEditContent(example.content);
    };

    const handleSaveEdit = (id: string) => {
        onSave(examples.map((e) => e.id === id ? { ...e, title: editTitle.trim(), content: editContent.trim() } : e));
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        onSave(examples.filter((e) => e.id !== id));
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Writing Examples</h1>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            AI will match your writing style
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto">
                    {/* Info */}
                    <div className="glass-panel p-4 mb-6">
                        <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            How it works
                        </h3>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            Paste examples of your writing. AI will analyze your tone, vocabulary, and style to generate content that sounds like you.
                        </p>
                    </div>

                    {/* Add Button */}
                    {!isAdding && (
                        <button onClick={() => setIsAdding(true)} className="btn-secondary w-full mb-4">
                            <Plus className="w-4 h-4" />
                            Add Example
                        </button>
                    )}

                    {/* Add Form */}
                    {isAdding && (
                        <div className="glass-panel p-4 mb-4 space-y-3">
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="Example title"
                                className="input-field"
                                autoFocus
                            />
                            <textarea
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                placeholder="Paste your writing here..."
                                className="textarea-field"
                                rows={6}
                            />
                            <div className="flex gap-2">
                                <button onClick={handleAdd} className="btn-primary flex-1">
                                    <Check className="w-4 h-4" /> Save
                                </button>
                                <button onClick={() => { setIsAdding(false); setNewTitle(''); setNewContent(''); }} className="btn-secondary">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Examples List */}
                    <div className="space-y-3">
                        {examples.length === 0 ? (
                            <div className="text-center py-12 text-[var(--color-text-muted)]">
                                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No examples yet</p>
                            </div>
                        ) : (
                            examples.map((example) => (
                                <div key={example.id} className="card-item">
                                    {editingId === example.id ? (
                                        <div className="space-y-2">
                                            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="input-field" />
                                            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="textarea-field" rows={4} />
                                            <div className="flex gap-2">
                                                <button onClick={() => handleSaveEdit(example.id)} className="btn-primary text-xs"><Check className="w-3 h-3" /> Save</button>
                                                <button onClick={() => setEditingId(null)} className="btn-secondary text-xs"><X className="w-3 h-3" /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-start justify-between mb-1">
                                                <h3 className="font-medium text-sm">{example.title}</h3>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleEdit(example)} className="btn-icon p-1"><Edit2 className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => handleDelete(example.id)} className="btn-icon p-1 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap line-clamp-3">{truncateText(example.content, 200)}</p>
                                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--color-border)]">
                                                <span className="text-xs text-[var(--color-text-muted)]">{formatDate(example.createdAt)}</span>
                                                <span className="badge">{example.content.split(/\s+/).length} words</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
