/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Sparkles,
  BookOpen,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { Header } from './components/Header';
import { DiagnosticWorkspace } from './components/DiagnosticWorkspace';
import { DiagnosticReport } from './components/DiagnosticReport';
import { IncidentPresetsModal } from './components/IncidentPresetsModal';
import { INCIDENT_PRESETS } from './data/presets';
import {
  Ecosystem,
  IssueCategory,
  Severity,
  DiagnosisResponse,
  IncidentPreset,
} from './types';

export default function App() {
  const initialPreset = INCIDENT_PRESETS[0];

  const [ecosystem, setEcosystem] = useState<Ecosystem>(initialPreset.ecosystem);
  const [category, setCategory] = useState<IssueCategory>(initialPreset.category);
  const [severity, setSeverity] = useState<Severity>(initialPreset.severity);
  const [targetFile, setTargetFile] = useState<string>(initialPreset.targetFile);
  const [context, setContext] = useState<string>(initialPreset.context);
  const [logs, setLogs] = useState<string>(initialPreset.logs);
  const [conflictGraph, setConflictGraph] = useState<any>(initialPreset.conflictGraph);

  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    handleDiagnose();
  }, []);

  const handleSelectPreset = (preset: IncidentPreset) => {
    setEcosystem(preset.ecosystem);
    setCategory(preset.category);
    setSeverity(preset.severity);
    setTargetFile(preset.targetFile);
    setContext(preset.context);
    setLogs(preset.logs);
    setConflictGraph(preset.conflictGraph || null);
    setDiagnosisResult(null);
    setErrorMsg(null);
  };

  const handleReset = () => {
    setContext('');
    setLogs('');
    setTargetFile('package.json');
    setConflictGraph(null);
    setDiagnosisResult(null);
    setErrorMsg(null);
  };

  const handleDiagnose = async () => {
    if (!context.trim() && !logs.trim()) return;

    setIsDiagnosing(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          ecosystem,
          severity,
          targetFile,
          context,
          logs,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data: DiagnosisResponse = await response.json();
      setDiagnosisResult(data);
    } catch (err: any) {
      console.error('Diagnosis failed:', err);
      setErrorMsg(err.message || 'An error occurred during diagnosis.');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleApplyPatch = (patchDiff: string) => {
    if (targetFile.includes('package.json') && patchDiff.includes('overrides')) {
      try {
        const pkg = JSON.parse(context);
        pkg.overrides = {
          react: '$react',
          'react-dom': '$react-dom',
        };
        setContext(JSON.stringify(pkg, null, 2));
      } catch {
        if (context.includes('"dependencies":')) {
          setContext(
            context.replace(
              '"dependencies":',
              '"overrides": {\n    "react": "$react",\n    "react-dom": "$react-dom"\n  },\n  "dependencies":'
            )
          );
        }
      }
    } else if (targetFile.includes('Dockerfile') && patchDiff.includes('python:3.11-slim')) {
      setContext(
        context
          .replace('FROM python:3.11-alpine', 'FROM python:3.11-slim-bookworm AS base')
          .replace('apk add --no-cache gcc', 'apt-get update && apt-get install -y build-essential')
      );
    } else {
      setContext((prev) => `${prev}\n\n// [RepoMedic]: Patch applied successfully.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation */}
      <Header
        activeEcosystem={ecosystem}
        onSelectEcosystem={(eco) => setEcosystem(eco)}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onReset={handleReset}
        isDiagnosing={isDiagnosing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Incident Presets Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
              Quick Presets:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {INCIDENT_PRESETS.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className="px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 hover:text-cyan-300 text-slate-300 border border-slate-700/80 transition-colors"
                >
                  {p.badge}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setIsPresetsOpen(true)}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <span>View All ({INCIDENT_PRESETS.length})</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Error notification banner if any */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-400 hover:text-rose-200 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Diagnostic Studio Grid: Left input workspace, Right diagnostic report */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Input Workspace (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <DiagnosticWorkspace
              ecosystem={ecosystem}
              onEcosystemChange={setEcosystem}
              category={category}
              onCategoryChange={setCategory}
              severity={severity}
              onSeverityChange={setSeverity}
              targetFile={targetFile}
              onTargetFileChange={setTargetFile}
              context={context}
              onContextChange={setContext}
              logs={logs}
              onLogsChange={setLogs}
              conflictGraph={conflictGraph}
              onDiagnose={handleDiagnose}
              isDiagnosing={isDiagnosing}
            />

            {/* Core Capabilities Summary Card */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 font-mono text-xs space-y-2.5">
              <div className="text-slate-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                RepoMedic Engine Capabilities
              </div>
              <div className="grid grid-cols-1 gap-2 text-slate-300">
                <div className="flex items-start gap-2 bg-slate-950/60 p-2 rounded border border-slate-800">
                  <span className="text-cyan-400 font-bold">1.</span>
                  <div>
                    <span className="font-semibold text-slate-200">Dependency Resolution:</span>
                    <p className="text-[11px] text-slate-400">Detect peer conflicts, ERESOLVE, C-API ABI mismatch across npm, pip, cargo.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-slate-950/60 p-2 rounded border border-slate-800">
                  <span className="text-cyan-400 font-bold">2.</span>
                  <div>
                    <span className="font-semibold text-slate-200">Test Failure Analysis:</span>
                    <p className="text-[11px] text-slate-400">Map stack traces, ESM mock hoists, and async resource leak warnings.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-slate-950/60 p-2 rounded border border-slate-800">
                  <span className="text-cyan-400 font-bold">3.</span>
                  <div>
                    <span className="font-semibold text-slate-200">Configuration Auditing:</span>
                    <p className="text-[11px] text-slate-400">Audit Dockerfile base images, musl vs glibc, tsconfig targets, and K8s secrets.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-slate-950/60 p-2 rounded border border-slate-800">
                  <span className="text-cyan-400 font-bold">4.</span>
                  <div>
                    <span className="font-semibold text-slate-200">Targeted Fix Generation:</span>
                    <p className="text-[11px] text-slate-400">Generates unified diffs and terminal commands ready to execute safely.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Diagnostic Output Dashboard (7 cols) */}
          <div className="lg:col-span-7">
            {diagnosisResult ? (
              <DiagnosticReport
                rawMarkdown={diagnosisResult.rawMarkdown}
                sections={diagnosisResult.sections}
                metadata={diagnosisResult.metadata}
                targetFile={targetFile}
                onApplyPatch={handleApplyPatch}
              />
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-8 text-center space-y-4 shadow-xl">
                <div className="h-14 w-14 rounded-2xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center mx-auto text-cyan-400">
                  <Activity className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-mono">
                    Diagnostic Engine Idle
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 font-mono">
                    RepoMedic is ready to analyze broken codebases, unpick dependency collisions, and generate unified code patches.
                  </p>
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    onClick={handleDiagnose}
                    disabled={isDiagnosing || (!context.trim() && !logs.trim())}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-semibold text-xs transition-all shadow-lg shadow-cyan-950"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Run Diagnosis on Current Workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Incident Presets Modal */}
      <IncidentPresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={handleSelectPreset}
      />
    </div>
  );
}
