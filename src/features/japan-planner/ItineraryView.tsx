import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Bed,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Compass,
  Utensils,
  Coffee,
  Plane,
  EyeOff
} from 'lucide-react';
import { ItineraryPlan } from './types';
import { buildFlightSearchUrl } from '../../lib/links';

interface ItineraryViewProps {
  plan: ItineraryPlan;
  checkedDateStr: string;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({ plan, checkedDateStr }) => {
  const getBadgeType = (type: string) => {
    switch (type) {
      case 'famous-sight':
        return { label: 'Famous Sight', color: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50', icon: Compass };
      case 'off-beaten-path':
        return { label: 'Local Pick / 穴場', color: 'bg-amber-950/60 text-amber-300 border-amber-800/50', icon: EyeOff };
      case 'food':
        return { label: 'Local Dining', color: 'bg-rose-950/60 text-rose-300 border-rose-800/50', icon: Utensils };
      case 'after-hours':
        return { label: 'After-Hours Low Crowd', color: 'bg-purple-950/60 text-purple-300 border-purple-800/50', icon: Clock };
      case 'rest':
        return { label: 'Rest & Recharge', color: 'bg-stone-800/80 text-stone-300 border-stone-700/60', icon: Coffee };
      default:
        return { label: 'Sightseeing', color: 'bg-stone-800 text-stone-300 border-stone-700', icon: MapPin };
    }
  };

  return (
    <div className="space-y-8">
      {/* Warnings & Advisories */}
      {plan.warnings && plan.warnings.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs mb-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Trip Advisories & Verification Reminders</span>
          </div>
          <ul className="space-y-1.5 text-xs text-stone-300">
            {plan.warnings.map((w, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Assumptions */}
      {plan.assumptions && plan.assumptions.length > 0 && (
        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4 text-xs text-stone-400">
          <span className="font-semibold text-stone-300 block mb-1">Planning Assumptions:</span>
          <p>{plan.assumptions.join(' • ')}</p>
        </div>
      )}

      {/* Day by Day Cards */}
      <div className="space-y-6">
        {plan.days.map((day, dayIdx) => (
          <div
            key={day.date + '-' + dayIdx}
            className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Day Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-stone-800">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-semibold">
                    Day {dayIdx + 1}
                  </span>
                  <span className="text-xs text-stone-400 flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    {day.date}
                  </span>
                  <span className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {day.city}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-serif font-medium text-stone-100">
                  {day.theme}
                </h3>
              </div>

              {/* Holiday Badge */}
              {day.holiday && (
                <div className="px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-1.5 self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                  <span>Public Holiday: {day.holiday.nameJa} (Expect Crowds)</span>
                </div>
              )}
            </div>

            {/* Weather & Safety Note */}
            {day.weatherNote && (
              <div className="mb-6 p-3 rounded-xl bg-stone-800/50 border border-stone-700/40 text-xs text-stone-300 flex items-center gap-2">
                <span className="font-semibold text-stone-400">Weather Note:</span>
                <span>{day.weatherNote}</span>
              </div>
            )}

            {/* Day Items Timeline */}
            <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-stone-800 before:hidden sm:before:block">
              {day.items.map((item, itemIdx) => {
                const badge = getBadgeType(item.type);
                const BadgeIcon = badge.icon;

                return (
                  <div key={itemIdx} className="relative sm:pl-10 space-y-3">
                    {/* Circle Node */}
                    <div className="hidden sm:flex absolute left-1 top-2 w-5 h-5 rounded-full bg-stone-900 border-2 border-amber-500 items-center justify-center text-[10px] text-amber-400 font-mono">
                      {itemIdx + 1}
                    </div>

                    <div className="bg-stone-800/70 border border-stone-700/50 rounded-2xl p-5 hover:border-amber-500/30 transition-all">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-stone-900 font-mono text-xs text-amber-300 border border-stone-700/50">
                            {item.time}
                          </span>
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1 ${badge.color}`}>
                            <BadgeIcon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        </div>

                        {/* Verified vs Suggestion Badge */}
                        {item.verified ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-[10px] font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Verified Venue</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-800/50 text-amber-300 text-[10px] font-medium flex items-center gap-1">
                            <HelpCircle className="w-3 h-3" />
                            <span>Suggestion, please verify</span>
                          </span>
                        )}
                      </div>

                      {/* Venue Name */}
                      <div className="mb-2">
                        <h4 className="text-base font-semibold text-stone-100 flex items-center gap-2">
                          <span>{item.name}</span>
                          {item.nameJa && (
                            <span className="text-xs text-stone-400 font-normal">
                              ({item.nameJa})
                            </span>
                          )}
                        </h4>
                      </div>

                      {/* Why */}
                      <p className="text-xs text-stone-300 leading-relaxed mb-3">
                        {item.why}
                      </p>

                      {/* Crowd Tip */}
                      {item.crowdTip && (
                        <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/40 text-xs text-amber-200/90 mb-3 flex items-start gap-2">
                          <span className="font-semibold text-amber-400 shrink-0">Crowd Tip:</span>
                          <span>{item.crowdTip}</span>
                        </div>
                      )}

                      {/* Bottom Info: Source link and timestamp */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-700/40 text-[11px] text-stone-400">
                        <div>
                          {item.sourceUrl ? (
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
                            >
                              <span>Official / Source link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="italic text-stone-400">Public registry candidate</span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          Data checked on {checkedDateStr} JST
                        </div>
                      </div>
                    </div>

                    {/* Transit To Next */}
                    {item.transportToNext && (
                      <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
                        <div className="flex items-center gap-2">
                          <span className="capitalize text-stone-300 font-medium">
                            To next stop ({item.transportToNext.mode})
                          </span>
                          {item.transportToNext.minutes && (
                            <span className="text-stone-400 font-mono">
                              (~{item.transportToNext.minutes} mins)
                            </span>
                          )}
                        </div>
                        <a
                          href={item.transportToNext.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
                        >
                          <span>Open route in Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Stay Area Suggestion */}
            {day.stayArea && (
              <div className="mt-8 pt-6 border-t border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-950/40 p-4 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-400 shrink-0">
                    <Bed className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-stone-200">
                      Recommended Stay Base: {day.stayArea.area}
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {day.stayArea.why}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={day.stayArea.searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <span>Search Stays</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href={buildFlightSearchUrl(day.city)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 text-xs font-medium border border-stone-700 flex items-center gap-1.5 transition-colors shrink-0"
                    title={`Search flights to ${day.city}`}
                  >
                    <Plane className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Flights</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
