import React from 'react';
import { Moon, Sun } from 'lucide-react';

export type ActiveTab = 'ask' | 'facts' | 'code' | 'scoreboard';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  theme,
  onToggleTheme,
}) => {
  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'ask', label: 'Ask' },
    { id: 'facts', label: 'Facts' },
    { id: 'code', label: 'Code' },
    { id: 'scoreboard', label: 'Scoreboard' },
  ];

  return (
    <header className="border-b border-[var(--border-card)] bg-[var(--bg-card)] sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* App Title */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onTabChange('ask');
            }}
            className="text-lg font-bold tracking-tight text-[var(--text-primary)] hover:text-[#19B6A6] transition-colors"
          >
            LLM Hallucination Test
          </a>
        </div>

        {/* 4 Simple Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#19B6A6] text-slate-950 shadow-sm font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Sun / Moon Theme Toggle */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-lg border border-[var(--border-card)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#19B6A6] transition-colors"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#F5A524]" />
            ) : (
              <Moon className="w-4 h-4 text-[#19B6A6]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
