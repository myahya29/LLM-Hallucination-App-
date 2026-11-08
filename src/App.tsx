/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AskMode } from './components/AskMode';
import { CodeTestMode } from './components/CodeTestMode';
import { HallucinationMode } from './components/HallucinationMode';
import { Header, ActiveTab } from './components/Header';
import { IntroCards } from './components/IntroCards';
import { KeyBar } from './components/KeyBar';
import { ModelSelector } from './components/ModelSelector';
import { Scoreboard } from './components/Scoreboard';
import {
  AskResult,
  ModelDefinition,
  ModelExecutionState,
  QuestionModelResult,
  SimpleCodeResult,
} from './types/benchmark';
import { ApiKeys } from './utils/api';
import { INITIAL_MODELS } from './utils/constants';
import { generateSampleResults } from './utils/sampleData';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ask');

  // Theme state: defaults to system preference
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
    return 'dark';
  });

  // Sync theme to root element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Keys stored in session React memory only
  const [keys, setKeys] = useState<ApiKeys>({
    openRouterKey: '',
    geminiKey: '',
  });

  // Models state
  const [models, setModels] = useState<ModelDefinition[]>(INITIAL_MODELS);
  const [executionStates, setExecutionStates] = useState<Record<string, ModelExecutionState>>({});
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Results state
  const [askResults, setAskResults] = useState<Record<string, AskResult>>({});
  const [questionResults, setQuestionResults] = useState<Record<string, QuestionModelResult>>({});
  const [codeResults, setCodeResults] = useState<Record<string, SimpleCodeResult>>({});

  // Toggle model on / off
  const handleToggleModel = (id: string) => {
    setModels((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const handleSelectAllModels = (select: boolean) => {
    setModels((prev) => prev.map((m) => ({ ...m, enabled: select })));
  };

  // Load sample demonstration data
  const handleLoadDemoData = () => {
    const { askResults: sampleAsk, questionResults: sampleQuestions, codeResults: sampleCode } =
      generateSampleResults();
    setAskResults(sampleAsk);
    setQuestionResults(sampleQuestions);
    setCodeResults(sampleCode);
  };

  // Clear all data
  const handleClearAllData = () => {
    if (confirm('Clear all stored answers, code tests, and scores?')) {
      setAskResults({});
      setQuestionResults({});
      setCodeResults({});
      setExecutionStates({});
    }
  };

  // Individual mode result updates
  const handleUpdateAskResult = (modelId: string, result: AskResult) => {
    setAskResults((prev) => ({ ...prev, [modelId]: result }));
  };

  const handleUpdateQuestionResult = (key: string, result: QuestionModelResult) => {
    setQuestionResults((prev) => ({ ...prev, [key]: result }));
  };

  const handleUpdateCodeResult = (modelId: string, result: SimpleCodeResult) => {
    setCodeResults((prev) => ({ ...prev, [modelId]: result }));
  };

  const handleSetCodeVerdict = (modelId: string, verdict: 'works' | 'broken') => {
    setCodeResults((prev) => {
      const existing = prev[modelId];
      if (!existing) {
        return {
          ...prev,
          [modelId]: {
            modelId,
            taskPrompt: '',
            response: '',
            verdict,
            status: 'success',
            timestamp: Date.now(),
          },
        };
      }
      return {
        ...prev,
        [modelId]: {
          ...existing,
          verdict,
        },
      };
    });
  };

  const hasBenchmarkData =
    Object.keys(askResults).length > 0 ||
    Object.keys(questionResults).length > 0 ||
    Object.keys(codeResults).length > 0;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)',
      }}
      className="min-h-screen flex flex-col transition-colors"
    >
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Intro definition cards */}
        <IntroCards />

        {/* API Keys bar (in-memory password inputs) */}
        <KeyBar
          keys={keys}
          onKeysChange={setKeys}
          onLoadDemoData={handleLoadDemoData}
          hasBenchmarkData={hasBenchmarkData}
          onClearData={handleClearAllData}
        />

        {/* Model Selector Bar */}
        <ModelSelector
          models={models}
          onToggleModel={handleToggleModel}
          onSelectAll={handleSelectAllModels}
          executionStates={executionStates}
          isExecuting={isExecuting}
        />

        {/* Tab Content */}
        {activeTab === 'ask' && (
          <AskMode
            models={models}
            keys={keys}
            askResults={askResults}
            onUpdateResult={handleUpdateAskResult}
            onClearResults={() => setAskResults({})}
            executionStates={executionStates}
            setExecutionStates={setExecutionStates}
            isExecuting={isExecuting}
            setIsExecuting={setIsExecuting}
          />
        )}

        {activeTab === 'facts' && (
          <HallucinationMode
            models={models}
            keys={keys}
            questionResults={questionResults}
            onUpdateResult={handleUpdateQuestionResult}
            onClearResults={() => setQuestionResults({})}
            executionStates={executionStates}
            setExecutionStates={setExecutionStates}
            isExecuting={isExecuting}
            setIsExecuting={setIsExecuting}
          />
        )}

        {activeTab === 'code' && (
          <CodeTestMode
            models={models}
            keys={keys}
            codeResults={codeResults}
            onUpdateCodeResult={handleUpdateCodeResult}
            onSetVerdict={handleSetCodeVerdict}
            onClearCodeResults={() => setCodeResults({})}
            executionStates={executionStates}
            setExecutionStates={setExecutionStates}
            isExecuting={isExecuting}
            setIsExecuting={setIsExecuting}
          />
        )}

        {activeTab === 'scoreboard' && (
          <Scoreboard
            models={models}
            questionResults={questionResults}
            codeResults={codeResults}
            onClearAllData={handleClearAllData}
          />
        )}
      </main>

      {/* Simple Centered Footer */}
      <footer
        style={{
          borderTopColor: 'var(--border-subtle)',
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-secondary)',
        }}
        className="mt-12 border-t py-6 text-xs text-center transition-colors"
      >
        <p className="font-medium">Made by Muhammad Yahya and Muhammad Ayan</p>
      </footer>
    </div>
  );
}
