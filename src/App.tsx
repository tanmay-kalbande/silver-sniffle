// ============================================================================
// MAIN APP - With Keyboard Shortcuts & Toast Notifications
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { Article, Memory, WritingExample, APISettings, AppView } from './types';
import { generateId } from './utils/helpers';
import { storageUtils } from './utils/storage';
import { aiService } from './services/aiService';

// Components
import { Sidebar } from './components/Sidebar';
import { ArticleGenerator } from './components/ArticleGenerator';
import { MemoryPanel } from './components/MemoryPanel';
import { ExamplesPanel } from './components/ExamplesPanel';
import { SettingsModal } from './components/SettingsModal';

// Toast Notification Component
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-4 py-3 shadow-lg z-50 animate-fade-in-up">
      <p className="text-sm text-[var(--color-text-primary)]">{message}</p>
    </div>
  );
}

function App() {
  // State
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [examples, setExamples] = useState<WritingExample[]>([]);
  const [settings, setSettings] = useState<APISettings>(() => storageUtils.getSettings());
  const [currentView, setCurrentView] = useState<AppView>('generator');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarFolded, setSidebarFolded] = useState(() => {
    const stored = localStorage.getItem('article-gen-sidebar-folded');
    return stored ? JSON.parse(stored) : false;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Check if API key is configured
  const hasApiKey = !!(settings.googleApiKey || settings.mistralApiKey || settings.cerebrasApiKey || settings.zhipuApiKey);

  // Load data on mount
  useEffect(() => {
    const loadedArticles = storageUtils.getArticles();
    const loadedMemories = storageUtils.getMemories();
    const loadedExamples = storageUtils.getExamples();
    const loadedSettings = storageUtils.getSettings();

    setArticles(loadedArticles);
    setMemories(loadedMemories);
    setExamples(loadedExamples);
    setSettings(loadedSettings);

    // Update AI service
    aiService.updateSettings(loadedSettings);
    aiService.updateMemories(loadedMemories);
    aiService.updateExamples(loadedExamples);
  }, []);

  // Responsive sidebar handling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save sidebar folded state
  useEffect(() => {
    localStorage.setItem('article-gen-sidebar-folded', JSON.stringify(sidebarFolded));
  }, [sidebarFolded]);

  // Save articles on change
  useEffect(() => {
    const timeout = setTimeout(() => {
      storageUtils.saveArticles(articles);
    }, 500);
    return () => clearTimeout(timeout);
  }, [articles]);

  // Save memories on change
  useEffect(() => {
    storageUtils.saveMemories(memories);
    aiService.updateMemories(memories);
  }, [memories]);

  // Save examples on change
  useEffect(() => {
    storageUtils.saveExamples(examples);
    aiService.updateExamples(examples);
  }, [examples]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Cmd/Ctrl + K: New article
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleNewArticle();
        setToast('New article created');
      }

      // Cmd/Ctrl + S: Manual save (already auto-saves)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        storageUtils.saveArticles(articles);
        setToast('All changes saved');
      }

      // Cmd/Ctrl + ,: Open settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setSettingsOpen(true);
      }

      // Cmd/Ctrl + B: Toggle sidebar (desktop only)
      if ((e.metaKey || e.ctrlKey) && e.key === 'b' && window.innerWidth >= 1024) {
        e.preventDefault();
        setSidebarFolded(!sidebarFolded);
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [articles, sidebarFolded]);

  // Handlers
  const handleNewArticle = useCallback(() => {
    const newArticle: Article = {
      id: generateId(),
      title: '',
      subtitle: '',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setArticles((prev) => [newArticle, ...prev]);
    setCurrentArticle(newArticle);
    setCurrentView('generator');
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, []);

  const handleSelectArticle = useCallback((article: Article) => {
    setCurrentArticle(article);
    setCurrentView('generator');
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, []);

  const handleDeleteArticle = useCallback((id: string) => {
    setArticles((prev) => {
      const remaining = prev.filter((a) => a.id !== id);
      if (currentArticle?.id === id) {
        setCurrentArticle(remaining.length > 0 ? remaining[0] : null);
      }
      return remaining;
    });
    setToast('Article deleted');
  }, [currentArticle]);

  const handleUpdateArticle = useCallback((updates: Partial<Article>) => {
    if (!currentArticle) {
      const newArticle: Article = {
        id: generateId(),
        title: '',
        subtitle: '',
        content: '',
        ...updates,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setArticles((prev) => [newArticle, ...prev]);
      setCurrentArticle(newArticle);
      return;
    }

    const updatedArticle = {
      ...currentArticle,
      ...updates,
      updatedAt: new Date(),
    };

    setCurrentArticle(updatedArticle);
    setArticles((prev) =>
      prev.map((a) => (a.id === updatedArticle.id ? updatedArticle : a))
    );
  }, [currentArticle]);

  const handleSaveSettings = useCallback((newSettings: APISettings) => {
    setSettings(newSettings);
    storageUtils.saveSettings(newSettings);
    aiService.updateSettings(newSettings);
    setToast('Settings saved');
  }, []);

  const handleChangeView = useCallback((view: AppView) => {
    setCurrentView(view);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, []);

  // Render view content
  const renderViewContent = () => {
    switch (currentView) {
      case 'memories':
        return <MemoryPanel memories={memories} onSave={setMemories} />;
      case 'examples':
        return <ExamplesPanel examples={examples} onSave={setExamples} />;
      default:
        return (
          <ArticleGenerator
            article={currentArticle}
            memories={memories}
            examples={examples}
            onUpdateArticle={handleUpdateArticle}
            onNewArticle={handleNewArticle}
            hasApiKey={hasApiKey}
          />
        );
    }
  };

  return (
    <div className="app-layout">
      {/* Mobile Backdrop */}
      {sidebarOpen && window.innerWidth < 1024 && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        articles={articles}
        currentArticle={currentArticle}
        currentView={currentView}
        isOpen={sidebarOpen}
        isFolded={sidebarFolded}
        onSelectArticle={handleSelectArticle}
        onNewArticle={handleNewArticle}
        onDeleteArticle={handleDeleteArticle}
        onChangeView={handleChangeView}
        onOpenSettings={() => setSettingsOpen(true)}
        onClose={() => setSidebarOpen(false)}
        onToggleFold={() => setSidebarFolded(!sidebarFolded)}
      />

      {/* Main Content */}
      <main className="main-content">
        {/* Mobile Header */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-3 left-3 z-40 p-2.5 glass-panel rounded-xl shadow-lg hover:bg-white/10 transition-all lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* View Content */}
        <div className="editor-area">
          <div className="editor-panel">
            {renderViewContent()}
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        settings={settings}
        onSave={handleSaveSettings}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Toast Notification */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Keyboard Shortcuts Help (visible on hover in bottom-left) */}
      <div className="fixed bottom-4 left-4 group z-30 hidden lg:block">
        <div className="text-xs text-[var(--color-text-muted)] bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-help">
          ⌨️ Shortcuts
        </div>
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          <h4 className="text-xs font-semibold mb-2">Keyboard Shortcuts</h4>
          <div className="space-y-1 text-xs text-[var(--color-text-secondary)]">
            <div className="flex justify-between">
              <span>New Article</span>
              <kbd className="px-1.5 py-0.5 bg-[var(--color-bg-secondary)] rounded">⌘K</kbd>
            </div>
            <div className="flex justify-between">
              <span>Save</span>
              <kbd className="px-1.5 py-0.5 bg-[var(--color-bg-secondary)] rounded">⌘S</kbd>
            </div>
            <div className="flex justify-between">
              <span>Settings</span>
              <kbd className="px-1.5 py-0.5 bg-[var(--color-bg-secondary)] rounded">⌘,</kbd>
            </div>
            <div className="flex justify-between">
              <span>Toggle Sidebar</span>
              <kbd className="px-1.5 py-0.5 bg-[var(--color-bg-secondary)] rounded">⌘B</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
