import React from 'react';
import { AlertTriangle, BookOpen, Brain, Cpu, MessageSquare } from 'lucide-react';

export const IntroCards: React.FC = () => {
  const cards = [
    {
      title: 'AI',
      subtitle: 'Artificial Intelligence',
      desc: 'Computational systems designed to perform tasks traditionally requiring human cognition.',
      accent: 'text-[#19B6A6]',
      bgAccent: 'bg-[#19B6A6]/10 border-[#19B6A6]/20',
      icon: Cpu,
    },
    {
      title: 'NLP',
      subtitle: 'Natural Language Processing',
      desc: 'Enabling algorithms to understand, parse, and generate human language.',
      accent: 'text-[#19B6A6]',
      bgAccent: 'bg-[#19B6A6]/10 border-[#19B6A6]/20',
      icon: MessageSquare,
    },
    {
      title: 'LLM',
      subtitle: 'Large Language Model',
      desc: 'Neural networks trained on large text corpora to predict subsequent tokens.',
      accent: 'text-indigo-400 dark:text-indigo-300',
      bgAccent: 'bg-indigo-500/10 border-indigo-500/20',
      icon: Brain,
    },
    {
      title: 'Hallucination',
      subtitle: 'Factual Fabrication',
      desc: 'Plausible-sounding but factually false assertions generated with high confidence.',
      accent: 'text-[#F5A524]',
      bgAccent: 'bg-[#F5A524]/10 border-[#F5A524]/20',
      icon: BookOpen,
    },
  ];

  return (
    <section className="space-y-3.5 max-w-full">
      {/* 1 col on phone, 2 on tablet (sm/md), 4 on laptop (lg/xl) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl sm:rounded-2xl p-4 transition-all duration-180 hover:shadow-sm flex flex-col justify-between min-w-0"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className={`text-base font-bold ${c.accent}`}>{c.title}</span>
                    <span className="text-xs text-[var(--text-secondary)] font-medium truncate">
                      {c.subtitle}
                    </span>
                  </div>
                  <div className={`p-1.5 rounded-lg border ${c.bgAccent} shrink-0 ml-2`}>
                    <Icon className={`w-3.5 h-3.5 ${c.accent}`} />
                  </div>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {c.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start sm:items-center gap-2.5 bg-[var(--bg-card)] border border-[#F5A524]/40 px-4 py-3 rounded-xl sm:rounded-2xl text-xs text-[var(--text-secondary)] shadow-xs">
        <AlertTriangle className="w-4 h-4 text-[#F5A524] shrink-0 mt-0.5 sm:mt-0" />
        <p className="leading-relaxed">
          <strong className="text-[#F5A524] font-semibold">Note: </strong>
          Free models may log your prompts. Do not enter personal or confidential data.
        </p>
      </div>
    </section>
  );
};
