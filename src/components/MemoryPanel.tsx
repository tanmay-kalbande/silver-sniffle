// ============================================================================
// MEMORY PANEL - Manage AI Context
// ============================================================================

import { useState } from 'react';
import { Brain, Plus, Trash2, Edit2, Check, X, User, Palette, Award, Sliders } from 'lucide-react';
import { Memory, MemoryCategory } from '../types';
import { generateId, formatDate } from '../utils/helpers';

interface MemoryPanelProps {
    memories: Memory[];
    onSave: (memories: Memory[]) => void;
}

const categoryConfig: Record<MemoryCategory, { label: string; icon: typeof User; color: string; desc: string }> = {
    personal: { label: 'Personal', icon: User, color: 'text-blue-400', desc: 'Your background & experiences' },
    'writing-style': { label: 'Writing Style', icon: Palette, color: 'text-purple-400', desc: 'Tone, phrases, preferences' },
    expertise: { label: 'Expertise', icon: Award, color: 'text-green-400', desc: 'Areas of knowledge' },
    preferences: { label: 'Preferences', icon: Sliders, color: 'text-orange-400', desc: 'Article formatting' },
};

export function MemoryPanel({ memories, onSave }: MemoryPanelProps) {
    const [activeCategory, setActiveCategory] = useState<MemoryCategory>('personal');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    const filteredMemories = memories.filter((m) => m.category === activeCategory);

    const handleAdd = () => {
        if (!newTitle.trim() || !newContent.trim()) return;
        const newMemory: Memory = {
            id: generateId(),
            category: activeCategory,
            title: newTitle.trim(),
            content: newContent.trim(),
            createdAt: new Date(),
        };
        onSave([...memories, newMemory]);
        setNewTitle('');
        setNewContent('');
        setIsAdding(false);
    };

    const handleEdit = (memory: Memory) => {
        setEditingId(memory.id);
        setEditTitle(memory.title);
        setEditContent(memory.content);
    };

    const handleSaveEdit = (id: string) => {
        onSave(
            memories.map((m) =>
                m.id === id ? { ...m, title: editTitle.trim(), content: editContent.trim() } : m
            )
        );
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        onSave(memories.filter((m) => m.id !== id));
    };

    const config = categoryConfig[activeCategory];

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                        <Brain className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Memory</h1>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            Add context to personalize AI writing
                        </p>
                    </div>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="px-6 py-3 border-b border-[var(--color-border)]">
                <div className="flex flex-wrap gap-2">
                    {(Object.keys(categoryConfig) as MemoryCategory[]).map((category) => {
                        const cat = categoryConfig[category];
                        const count = memories.filter((m) => m.category === category).length;
                        return (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeCategory === category
                                        ? 'bg-white text-black'
                                        : 'bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-card-hover)]'
                                    }`}
                            >
                                <cat.icon className="w-4 h-4" />
                                {cat.label}
                                {count > 0 && (
                                    <span className={`px-1.5 text-xs rounded ${activeCategory === category ? 'bg-black/20' : 'bg-white/10'
                                        }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto">
                    {/* Category Info */}
                    <div className="glass-panel p-4 mb-6">
                        <div className="flex items-center gap-2 mb-1">
                            <config.icon className={`w-4 h-4 ${config.color}`} />
                            <span className="font-medium text-sm">{config.label}</span>
                        </div>
                        <p className="text-sm text-[var(--color-text-muted)]">{config.desc}</p>
                    </div>

                    {/* Add Button */}
                    {!isAdding && (
                        <button onClick={() => setIsAdding(true)} className="btn-secondary w-full mb-4">
                            <Plus className="w-4 h-4" />
                            Add Memory
                        </button>
                    )}

                    {/* Add Form */}
                    {isAdding && (
                        <div className="glass-panel p-4 mb-4 space-y-3">
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="Title"
                                className="input-field"
                                autoFocus
                            />
                            <textarea
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                placeholder="Content..."
                                className="textarea-field"
                                rows={3}
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

                    {/* Memories List */}
                    <div className="space-y-3">
                        {filteredMemories.length === 0 ? (
                            <div className="text-center py-12 text-[var(--color-text-muted)]">
                                <Brain className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No {config.label.toLowerCase()} memories</p>
                            </div>
                        ) : (
                            filteredMemories.map((memory) => (
                                <div key={memory.id} className="card-item">
                                    {editingId === memory.id ? (
                                        <div className="space-y-2">
                                            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="input-field" />
                                            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="textarea-field" rows={2} />
                                            <div className="flex gap-2">
                                                <button onClick={() => handleSaveEdit(memory.id)} className="btn-primary text-xs"><Check className="w-3 h-3" /> Save</button>
                                                <button onClick={() => setEditingId(null)} className="btn-secondary text-xs"><X className="w-3 h-3" /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-start justify-between mb-1">
                                                <h3 className="font-medium text-sm">{memory.title}</h3>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleEdit(memory)} className="btn-icon p-1"><Edit2 className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => handleDelete(memory.id)} className="btn-icon p-1 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{memory.content}</p>
                                            <p className="text-xs text-[var(--color-text-muted)] mt-2">{formatDate(memory.createdAt)}</p>
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
