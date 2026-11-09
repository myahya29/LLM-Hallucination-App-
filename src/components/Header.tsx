import React from 'react';
import { Moon, Sparkles, Sun } from 'lucide-react';

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
    <header className="border-b border-[var(--border-card)] bg-[var(--bg-card)] sticky top-0 z-30 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
          {/* Top row on mobile, left side on desktop: Logo, Title, and Mobile Theme Toggle */}
          <div className="flex items-center justify-between gap-3 w-full sm:w-auto">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onTabChange('ask');
              }}
              className="flex items-center gap-2.5 group transition-opacity"
              aria-label="LLM Hallucination Test Home"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#19B6A6] to-[#F5A524] p-[1.5px] shrink-0 shadow-xs">
                <div className="w-full h-full rounded-[6.5px] bg-[var(--bg-card)] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#19B6A6] group-hover:scale-110 transition-transform duration-180" />
                </div>
              </div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)] group-hover:text-[#19B6A6] transition-colors duration-180 truncate">
                LLM Hallucination Test
              </span>
            </a>

            {/* Theme Toggle Button (Mobile: top right) */}
            <div className="sm:hidden shrink-0">
              <button
                type="button"
                onClick={onToggleTheme}
                className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#19B6A6] transition-all duration-180 flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
                title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                aria-label="Toggle light/dark theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-[#F5A524]" />
                ) : (
                  <Moon className="w-4 h-4 text-[#19B6A6]" />
                )}
              </button>
            </div>
          </div>

          {/* Navigation Tabs - Horizontally scrollable on small screens with min 44px tap targets */}
          <nav
            aria-label="Main Navigation"
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-full"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-180 flex items-center justify-center cursor-pointer select-none ${
                    isActive
                      ? 'bg-[#19B6A6] text-slate-950 shadow-sm font-bold scale-[1.02]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Theme Toggle Button (Desktop: visible on sm+) */}
          <div className="hidden sm:flex items-center shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#19B6A6] transition-all duration-180 flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle light/dark theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#F5A524]" />
              ) : (
                <Moon className="w-4 h-4 text-[#19B6A6]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
