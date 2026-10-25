import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, CheckCircle2, AlertTriangle, RefreshCw, Trash2, ArrowRight } from 'lucide-react';
import { TerminalEntry } from '../types';

interface RemediationTerminalProps {
  suggestedCommands: string[];
  ecosystem?: string;
  onCommandRun?: (cmd: string) => void;
}

export const RemediationTerminal: React.FC<RemediationTerminalProps> = ({
  suggestedCommands,
  ecosystem = 'node',
  onCommandRun,
}) => {
  const [history, setHistory] = useState<TerminalEntry[]>([
    {
      id: 'init-1',
      type: 'info',
      text: `[RepoMedic Shell] Session initialized for ${ecosystem.toUpperCase()} runtime environment.`,
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: 'init-2',
      type: 'info',
      text: `Ready to execute remediation commands. Select a suggested fix or enter a command below.`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputCmd, setInputCmd] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const addLog = (type: TerminalEntry['type'], text: string) => {
    setHistory((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        type,
        text,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const executeCommand = async (command: string) => {
    if (!command.trim() || isRunning) return;

    setIsRunning(true);
    addLog('cmd', `$ ${command}`);
    if (onCommandRun) onCommandRun(command);

    await new Promise((r) => setTimeout(r, 400));

    const lower = command.toLowerCase();

    if (lower.startsWith('npm') || lower.startsWith('npx')) {
      addLog('stdout', 'npm notice [resolving dependencies and lockfile integrity]...');
      await new Promise((r) => setTimeout(r, 600));
      if (lower.includes('overrides') || lower.includes('--save-exact')) {
        addLog('stdout', 'npm notice applying override rules to transitive dependency graph');
        addLog('stdout', 'added 24 packages, changed 3 packages, audited 412 packages in 1.4s');
        addLog('success', '✔ 0 vulnerabilities found. Lockfile updated successfully (exit code 0)');
      } else if (lower.includes('install') || lower.includes('i')) {
        addLog('stdout', 'fetching metadata from registry.npmjs.org...');
        addLog('stdout', 'resolved 128 packages in 980ms');
        addLog('success', '✔ All dependencies resolved cleanly (exit code 0)');
      } else {
        addLog('stdout', 'executing npm lifecycle script...');
        addLog('success', '✔ Process finished with exit code 0');
      }
    } else if (lower.startsWith('pip') || lower.startsWith('poetry')) {
      addLog('stdout', 'Resolving dependencies from wheel cache...');
      await new Promise((r) => setTimeout(r, 500));
      addLog('stdout', 'Installing collected packages: validated C-extension ABI compatibility');
      addLog('success', 'Successfully installed packages (exit code 0)');
    } else if (lower.startsWith('docker') || lower.startsWith('docker-compose')) {
      addLog('stdout', 'Sending build context to Docker daemon 4.2MB');
      addLog('stdout', 'Step 1/6 : FROM debian-slim [cached]');
      addLog('stdout', 'Step 2/6 : RUN apt-get update && apt-get install -y build-essential');
      await new Promise((r) => setTimeout(r, 600));
      addLog('success', 'Successfully tagged image repo-medic/app:remediated (exit code 0)');
    } else if (lower.startsWith('cargo')) {
      addLog('stdout', '   Compiling worker v0.1.0 (/workspace)');
      await new Promise((r) => setTimeout(r, 600));
      addLog('stdout', '    Finished dev [unoptimized + debuginfo] target(s) in 1.28s');
      addLog('success', '✔ Cargo build verified without lifetime or thread-safety errors.');
    } else if (lower.startsWith('kubectl')) {
      addLog('stdout', 'deployment.apps/payment-gateway configured');
      addLog('stdout', 'Waiting for deployment "payment-gateway" rollout to finish: 1 of 3 updated replicas are available...');
      await new Promise((r) => setTimeout(r, 700));
      addLog('success', '✔ deployment "payment-gateway" successfully rolled out');
    } else if (lower === 'clear') {
      setHistory([]);
      setIsRunning(false);
      return;
    } else if (lower === 'help') {
      addLog('info', 'Available commands: run any bash/npm/docker command, or "clear" to reset terminal.');
    } else {
      addLog('stdout', `Running: ${command}`);
      await new Promise((r) => setTimeout(r, 400));
      addLog('success', `✔ Executed: ${command} [exit code 0]`);
    }

    setIsRunning(false);
  };

  const handleRunAll = async () => {
    if (suggestedCommands.length === 0 || isRunning) return;
    for (const cmd of suggestedCommands) {
      await executeCommand(cmd);
      await new Promise((r) => setTimeout(r, 300));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(inputCmd);
      setInputCmd('');
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl flex flex-col font-mono text-xs">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className="ml-2 text-slate-400 font-semibold flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-cyan-400" />
            Remediation Runner
          </span>
        </div>

        <div className="flex items-center gap-2">
          {suggestedCommands.length > 0 && (
            <button
              onClick={handleRunAll}
              disabled={isRunning}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium transition-all shadow-sm disabled:opacity-50"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Run All Fixes</span>
            </button>
          )}

          <button
            onClick={() => setHistory([])}
            className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition-colors"
            title="Clear terminal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Suggested Command Chips */}
      {suggestedCommands.length > 0 && (
        <div className="px-3 py-2 bg-slate-900/40 border-b border-slate-800/80 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Suggested:</span>
          {suggestedCommands.map((cmd, i) => (
            <button
              key={i}
              onClick={() => executeCommand(cmd)}
              disabled={isRunning}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/90 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-700 text-slate-300 border border-slate-700/60 text-[11px] transition-all disabled:opacity-50 group"
            >
              <Play className="h-2.5 w-2.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="truncate max-w-[260px]">{cmd}</span>
            </button>
          ))}
        </div>
      )}

      {/* Console Output Screen */}
      <div className="p-4 bg-slate-950/90 overflow-y-auto max-h-[300px] min-h-[160px] space-y-1.5">
        {history.map((entry) => {
          if (entry.type === 'cmd') {
            return (
              <div key={entry.id} className="text-cyan-300 font-bold flex items-start gap-1">
                <span>{entry.text}</span>
              </div>
            );
          }
          if (entry.type === 'success') {
            return (
              <div key={entry.id} className="text-emerald-400 font-medium flex items-center gap-1.5 pl-3">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>{entry.text}</span>
              </div>
            );
          }
          if (entry.type === 'stderr') {
            return (
              <div key={entry.id} className="text-rose-400 pl-3 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>{entry.text}</span>
              </div>
            );
          }
          if (entry.type === 'info') {
            return (
              <div key={entry.id} className="text-slate-500 pl-2">
                {entry.text}
              </div>
            );
          }
          return (
            <div key={entry.id} className="text-slate-300 pl-3 leading-relaxed">
              {entry.text}
            </div>
          );
        })}

        {isRunning && (
          <div className="flex items-center gap-2 text-cyan-400 pl-3 py-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Processing remediation command...</span>
          </div>
        )}

        <div ref={terminalEndRef} />
      </div>

      {/* Interactive Input Line */}
      <div className="flex items-center px-4 py-2 bg-slate-900 border-t border-slate-800">
        <span className="text-emerald-400 font-bold mr-2 select-none">$</span>
        <input
          type="text"
          value={inputCmd}
          onChange={(e) => setInputCmd(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRunning}
          placeholder="Type bash or package manager command (e.g. npm test, cargo check)..."
          className="flex-1 bg-transparent text-slate-200 placeholder:text-slate-600 outline-none font-mono text-xs"
        />
        <button
          onClick={() => {
            executeCommand(inputCmd);
            setInputCmd('');
          }}
          disabled={isRunning || !inputCmd.trim()}
          className="p-1 text-slate-400 hover:text-cyan-400 disabled:opacity-40 transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
