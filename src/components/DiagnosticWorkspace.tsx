import React, { useState } from 'react';
import {
  FileText,
  Terminal,
  Layers,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { Ecosystem, IssueCategory, Severity } from '../types';
import { DependencyGraph } from './DependencyGraph';

interface DiagnosticWorkspaceProps {
  ecosystem: Ecosystem;
  onEcosystemChange: (eco: Ecosystem) => void;
  category: IssueCategory;
  onCategoryChange: (cat: IssueCategory) => void;
  severity: Severity;
  onSeverityChange: (sev: Severity) => void;
  targetFile: string;
  onTargetFileChange: (file: string) => void;
  context: string;
  onContextChange: (ctx: string) => void;
  logs: string;
  onLogsChange: (logs: string) => void;
  conflictGraph?: any;
  onDiagnose: () => void;
  isDiagnosing: boolean;
}

export const DiagnosticWorkspace: React.FC<DiagnosticWorkspaceProps> = ({
  ecosystem,
  onEcosystemChange,
  category,
  onCategoryChange,
  severity,
  onSeverityChange,
  targetFile,
  onTargetFileChange,
  context,
  onContextChange,
  logs,
  onLogsChange,
  conflictGraph,
  onDiagnose,
  isDiagnosing,
}) => {
  const [activeTab, setActiveTab] = useState<'context' | 'logs' | 'graph'>('context');
  const [beautified, setBeautified] = useState(false);

  const categories: { id: IssueCategory; label: string }[] = [
    { id: 'dependency', label: '1. Dependency Resolution' },
    { id: 'test_failure', label: '2. Test Failure Analysis' },
    { id: 'config', label: '3. Configuration Audit' },
    { id: 'code_change', label: '4. Targeted Fix / Code Change' },
    { id: 'general', label: 'General Incident' },
  ];

  const handleBeautifyJSON = () => {
    try {
      const parsed = JSON.parse(context);
      onContextChange(JSON.stringify(parsed, null, 2));
      setBeautified(true);
      setTimeout(() => setBeautified(false), 2000);
    } catch {
      // not JSON
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onDiagnose();
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl flex flex-col space-y-4"
    >
      {/* Top Options Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        {/* Category Pill Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-mono text-slate-500 mr-1 hidden sm:inline">Module:</span>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => onCategoryChange(c.id)}
              className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all ${
                category === c.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-semibold shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Severity Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">Severity:</span>
          <select
            value={severity}
            onChange={(e) => onSeverityChange(e.target.value as Severity)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="critical">🔴 Critical Blocker</option>
            <option value="high">🟠 High Severity</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>
      </div>

      {/* Target File & Quick Metadata */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Target Manifest / File to Patch
          </label>
          <div className="relative">
            <FileCode className="absolute left-3 top-2.5 h-4 w-4 text-cyan-500" />
            <input
              type="text"
              value={targetFile}
              onChange={(e) => onTargetFileChange(e.target.value)}
              placeholder="e.g. package.json, Dockerfile, tsconfig.json, src/auth.ts"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Ecosystem
          </label>
          <select
            value={ecosystem}
            onChange={(e) => onEcosystemChange(e.target.value as Ecosystem)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="node">Node.js / TypeScript</option>
            <option value="python">Python (pip / poetry)</option>
            <option value="docker">Docker / Containers</option>
            <option value="rust">Rust / Cargo</option>
            <option value="k8s">Kubernetes / Helm</option>
          </select>
        </div>
      </div>

      {/* Editor Workspace Tabs */}
      <div className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden">
        {/* Tab Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('context')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                activeTab === 'context'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Code / Config Context</span>
              {context && (
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 inline-block"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                activeTab === 'logs'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Terminal Logs &amp; Stack Trace</span>
              {logs && (
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 inline-block"></span>
              )}
            </button>

            {conflictGraph && (
              <button
                onClick={() => setActiveTab('graph')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                  activeTab === 'graph'
                    ? 'bg-slate-800 text-indigo-300 border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Conflict Graph</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'context' && context.startsWith('{') && (
              <button
                onClick={handleBeautifyJSON}
                className="text-[11px] font-mono text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                title="Format JSON"
              >
                {beautified ? 'Formatted!' : 'Format JSON'}
              </button>
            )}
            <span className="text-[11px] font-mono text-slate-500">
              {activeTab === 'context'
                ? `${context.split('\n').length} lines`
                : `${logs.split('\n').length} lines`}
            </span>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-3">
          {activeTab === 'context' && (
            <textarea
              value={context}
              onChange={(e) => onContextChange(e.target.value)}
              placeholder="Paste package.json, Dockerfile, tsconfig.json, Cargo.toml, or code snippet with the bug..."
              rows={11}
              className="w-full bg-slate-950 text-slate-200 p-3 rounded-lg border border-slate-800/80 font-mono text-xs leading-relaxed focus:outline-none focus:border-cyan-500 resize-y"
              spellCheck={false}
            />
          )}

          {activeTab === 'logs' && (
            <textarea
              value={logs}
              onChange={(e) => onLogsChange(e.target.value)}
              placeholder="Paste stack traces, npm ERESOLVE errors, Vitest/Jest test failure logs, CI build logs, or docker build crashes..."
              rows={11}
              className="w-full bg-slate-950 text-rose-300 p-3 rounded-lg border border-slate-800/80 font-mono text-xs leading-relaxed focus:outline-none focus:border-rose-500 resize-y"
              spellCheck={false}
            />
          )}

          {activeTab === 'graph' && conflictGraph && (
            <div className="py-2">
              <DependencyGraph
                rootName={conflictGraph.root}
                conflicts={conflictGraph.conflicts}
              />
            </div>
          )}
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-slate-500 font-mono hidden sm:flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
            Ctrl
          </kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
            Enter
          </kbd>
          <span>to run diagnosis</span>
        </div>

        <button
          onClick={onDiagnose}
          disabled={isDiagnosing || (!context.trim() && !logs.trim())}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-mono font-bold text-sm tracking-wide transition-all shadow-lg shadow-cyan-900/30 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-cyan-800/50"
        >
          {isDiagnosing ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Failure Root Cause...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Diagnose &amp; Generate Remediation Patch</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
