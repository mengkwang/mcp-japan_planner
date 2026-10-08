import React from 'react';
import { ShieldAlert, CloudRain, Wind, Thermometer, ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SafetyData } from './types';
import { buildGovernmentAdvisoryUrl } from '../../lib/links';

interface SafetyPanelProps {
  safety: SafetyData | null;
  isLoading: boolean;
  error?: string | null;
  city: string;
}

export const SafetyPanel: React.FC<SafetyPanelProps> = ({ safety, isLoading, error, city }) => {
  const advisoryUrl = buildGovernmentAdvisoryUrl();

  if (isLoading) {
    return (
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 animate-pulse">
        <div className="h-4 bg-stone-800 rounded w-48 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="h-24 bg-stone-800 rounded-xl"></div>
          <div className="h-24 bg-stone-800 rounded-xl"></div>
          <div className="h-24 bg-stone-800 rounded-xl"></div>
          <div className="h-24 bg-stone-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 text-xs text-stone-400 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-stone-300 font-medium">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span>Safety and weather monitoring is currently unavailable for {city}.</span>
        </div>
        <a
          href={advisoryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-400 hover:underline flex items-center gap-1.5 w-fit"
        >
          Check official government travel advisories before you go <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  const forecast = safety?.forecastByDay || [];
  const hazards = safety?.hazards || [];
  const advisories = safety?.advisories || [];

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-950/60 border border-teal-800/40 flex items-center justify-center text-teal-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-medium text-stone-200">
              Regional Safety & Weather Risk: {city}
            </h3>
            <span className="text-[11px] text-stone-400">Live environmental intelligence via Criora</span>
          </div>
        </div>

        <a
          href={advisoryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-amber-300 hover:text-amber-200 bg-amber-950/40 border border-amber-800/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors w-fit"
        >
          <span>Check official government travel advisories before you go</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Advisories if present */}
      {advisories.length > 0 && (
        <div className="mb-4 space-y-1">
          {advisories.map((adv, idx) => (
            <div key={idx} className="text-xs text-stone-400 bg-stone-800/50 px-3 py-2 rounded-lg border border-stone-700/40 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
              <span>{adv}</span>
            </div>
          ))}
        </div>
      )}

      {/* 7-Day Forecast */}
      {forecast.length > 0 ? (
        <div className="mb-5">
          <h4 className="text-xs font-medium text-stone-400 mb-2">7-Day Risk & Weather Outlook</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {forecast.map((day) => (
              <div
                key={day.date}
                className="bg-stone-800/70 border border-stone-700/50 rounded-xl p-2.5 flex flex-col justify-between text-center"
              >
                <div className="text-[11px] font-mono font-medium text-stone-300 mb-1">
                  {day.date.slice(5)}
                </div>
                <div className="space-y-1 my-1">
                  {day.tempMin !== undefined && day.tempMax !== undefined && (
                    <div className="text-[11px] text-stone-200 flex items-center justify-center gap-1">
                      <Thermometer className="w-3 h-3 text-rose-400/80" />
                      <span>{day.tempMin}°~{day.tempMax}°C</span>
                    </div>
                  )}
                  {day.precipMm !== undefined && (
                    <div className="text-[10px] text-sky-400/90 flex items-center justify-center gap-1">
                      <CloudRain className="w-2.5 h-2.5" />
                      <span>{day.precipMm}mm</span>
                    </div>
                  )}
                  {day.windSpeed !== undefined && (
                    <div className="text-[10px] text-stone-400 flex items-center justify-center gap-1">
                      <Wind className="w-2.5 h-2.5" />
                      <span>{day.windSpeed}m/s</span>
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded mt-1 ${
                  day.riskLevel === 'Low' || day.riskLevel === 'Very low'
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                    : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                }`}>
                  {day.riskLevel || 'Normal'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-xs text-stone-400 bg-stone-800/40 p-3 rounded-xl border border-stone-700/30 mb-4">
          Forecast not available yet for these dates (forecast window covers up to 7 days ahead).
        </div>
      )}

      {/* Hazards */}
      <div>
        <h4 className="text-xs font-medium text-stone-400 mb-2">Live Regional Hazards & Seismic Activity</h4>
        {hazards.length > 0 ? (
          <div className="space-y-2">
            {hazards.map((haz) => (
              <div
                key={haz.id}
                className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-3 flex items-start gap-3 text-xs"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-amber-200">{haz.label}</span>
                    <span className="text-[10px] text-stone-400 font-mono">{haz.timeAgo || haz.eventDate}</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Monitoring record from {haz.source}. Never presents hazard certainty.
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-stone-800/40 border border-stone-700/40 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-stone-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>No hazards reported near this place at this time (does not guarantee safety; verify before travel).</span>
          </div>
        )}
      </div>
    </div>
  );
};
