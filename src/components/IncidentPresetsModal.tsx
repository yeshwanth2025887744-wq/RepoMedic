import React, { useState } from 'react';
import { X, Search, Sparkles, ArrowRight } from 'lucide-react';
import { INCIDENT_PRESETS } from '../data/presets';
import { IncidentPreset } from '../types';

interface IncidentPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: IncidentPreset) => void;
}

export const IncidentPresetsModal: React.FC<IncidentPresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  if (!isOpen) return null;

  const filteredPresets = INCIDENT_PRESETS.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.badge.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = selectedFilter === 'all' || p.ecosystem === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Incident Presets Library
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Select an authentic production failure scenario to simulate diagnosis and fix generation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3 bg-slate-900/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keywords, error codes (ERESOLVE, SIGSEGV)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1">
            {['all', 'node', 'python', 'docker', 'rust', 'k8s'].map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`px-2.5 py-1 text-[11px] font-mono rounded capitalize transition-colors ${
                  selectedFilter === f
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Presets List */}
        <div className="p-6 overflow-y-auto space-y-3 divide-y divide-slate-800/40">
          {filteredPresets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => {
                onSelectPreset(preset);
                onClose();
              }}
              className="pt-3 first:pt-0 cursor-pointer group"
            >
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-cyan-600/60 transition-all shadow-md group-hover:shadow-cyan-950/20">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {preset.badge}
                    </span>
                    <span className="text-xs font-mono uppercase text-slate-400">
                      [{preset.ecosystem}]
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                        preset.severity === 'critical'
                          ? 'bg-rose-950 text-rose-400 border-rose-800'
                          : 'bg-amber-950 text-amber-400 border-amber-800'
                      }`}
                    >
                      {preset.severity}
                    </span>
                  </div>

                  <span className="text-xs text-cyan-400 font-mono font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Load Case <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors mb-1">
                  {preset.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                  {preset.description}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                  <span>Target: {preset.targetFile}</span>
                  <span>•</span>
                  <span>Category: {preset.category}</span>
                </div>
              </div>
            </div>
          ))}

          {filteredPresets.length === 0 && (
            <div className="text-center py-10 font-mono text-xs text-slate-500">
              No incident presets match your search query.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
