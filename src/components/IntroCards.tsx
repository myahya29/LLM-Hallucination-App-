import React from 'react';
import { AlertTriangle, BookOpen, Brain, Cpu, MessageSquare } from 'lucide-react';

export const IntroCards: React.FC = () => {
  const cards = [
    {
      title: 'AI',
      subtitle: 'Artificial Intelligence',
      desc: 'Computational systems designed to perform tasks traditionally requiring human cognition.',
      accent: 'text-[#19B6A6]',
      icon: Cpu,
    },
    {
      title: 'NLP',
      subtitle: 'Natural Language Processing',
      desc: 'Enabling algorithms to understand, parse, and generate human language.',
      accent: 'text-[#19B6A6]',
      icon: MessageSquare,
    },
    {
      title: 'LLM',
      subtitle: 'Large Language Model',
      desc: 'Neural networks trained on large text corpora to predict subsequent tokens.',
      accent: 'text-indigo-400 dark:text-indigo-300',
      icon: Brain,
    },
    {
      title: 'Hallucination',
      subtitle: 'Factual Fabrication',
      desc: 'Plausible-sounding but factually false assertions generated with high confidence.',
      accent: 'text-[#F5A524]',
      icon: BookOpen,
    },
  ];

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-3.5 transition-colors shadow-sm"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-baseline gap-2">
                  <span className={`text-base font-bold ${c.accent}`}>{c.title}</span>
                  <span className="text-xs text-[var(--text-secondary)] font-medium truncate max-w-[130px]">
                    {c.subtitle}
                  </span>
                </div>
                <Icon className={`w-4 h-4 ${c.accent} opacity-80 shrink-0`} />
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{c.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2.5 bg-[var(--bg-card)] border border-[#F5A524]/40 px-3.5 py-2 rounded-lg text-xs text-[var(--text-secondary)] shadow-sm">
        <AlertTriangle className="w-4 h-4 text-[#F5A524] shrink-0" />
        <p className="leading-snug">
          <strong className="text-[#F5A524] font-semibold">Note: </strong>
          Free models may log your prompts. Do not enter personal data.
        </p>
      </div>
    </section>
  );
};
