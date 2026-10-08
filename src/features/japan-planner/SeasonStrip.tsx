import React from 'react';
import { Calendar, Sparkles, ExternalLink, Cherry, Leaf, AlertCircle } from 'lucide-react';
import { SeasonItem } from './types';

interface SeasonStripProps {
  items: SeasonItem[];
  isLoading: boolean;
  error?: string | null;
  city: string;
}

export const SeasonStrip: React.FC<SeasonStripProps> = ({ items, isLoading, error, city }) => {
  if (isLoading) {
    return (
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 animate-pulse">
        <div className="h-4 bg-stone-800 rounded w-48 mb-3"></div>
        <div className="flex gap-3 overflow-hidden">
          <div className="h-20 bg-stone-800 rounded-xl w-64 shrink-0"></div>
          <div className="h-20 bg-stone-800 rounded-xl w-64 shrink-0"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-stone-900 border border-stone-800/80 rounded-2xl p-4 flex items-center gap-3 text-stone-400 text-xs">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
        <span>Seasonal data is currently unavailable for {city}.</span>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 text-stone-400 text-xs text-center">
        No specific seasonal highlights recorded for {city} during this window.
      </div>
    );
  }

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-400" />
          <h3 className="font-serif text-sm font-medium text-stone-200">
            Seasonal Highlights & Festivities in {city}
          </h3>
        </div>
        <span className="text-[11px] font-mono text-stone-400 bg-stone-800/70 px-2 py-0.5 rounded border border-stone-700/50">
          Source: Japan in Seasons
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {items.map((item) => {
          const isFar = item.status?.includes('typical timing');
          return (
            <div
              key={item.id}
              className="min-w-[240px] max-w-[280px] p-3.5 rounded-xl bg-stone-800/70 border border-stone-700/50 flex flex-col justify-between shrink-0 hover:border-rose-500/30 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <span className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                    {item.kind === 'flower' ? <Cherry className="w-3.5 h-3.5 text-rose-400 shrink-0" /> : <Leaf className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    {item.name}
                  </span>
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-400 hover:text-stone-200 shrink-0 p-1"
                      title="View source"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="text-[11px] text-stone-400 flex items-center gap-1.5 mb-2">
                  <Calendar className="w-3 h-3 text-stone-400 shrink-0" />
                  <span>{item.window}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-700/40 flex items-center justify-between text-[10px]">
                <span className={`px-2 py-0.5 rounded font-mono ${
                  isFar ? 'bg-amber-950/50 text-amber-300 border border-amber-800/40' : 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40'
                }`}>
                  {item.status}
                </span>
                {item.kind && (
                  <span className="capitalize text-stone-400">{item.kind.replace('_', ' ')}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
