import React, { useState } from 'react';
import { Calendar, Users, MapPin, Sparkles, Sliders, ShieldCheck } from 'lucide-react';
import { TripPreferences } from './types';

interface PlanFormProps {
  onSubmit: (prefs: TripPreferences) => void;
  isLoading: boolean;
  initialPrefs?: Partial<TripPreferences>;
}

const COMMON_CITIES = ['Tokyo', 'Kyoto', 'Osaka', 'Kanazawa', 'Hakone', 'Nara', 'Sapporo', 'Fukuoka'];

const INTEREST_TAGS = [
  'Quiet Zen Gardens',
  'Artisan Craft Studios',
  'Tea Ceremony Culture',
  'Sake Breweries',
  'Off-Beaten-Path Shrines',
  'Authentic Izakaya & Soba',
  'Historic Samurai Quarters',
  'Forest Bathing & Onsen',
  'Architecture & Modern Art',
  'Vintage Alleys & Kissaten',
  'Local Morning Markets',
  'Scenic Railway Journeys'
];

export const PlanForm: React.FC<PlanFormProps> = ({ onSubmit, isLoading, initialPrefs }) => {
  // Compute default dates (e.g. starting in 5 days, duration 4 days)
  const today = new Date();
  const defaultStart = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const defaultEnd = new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [selectedCities, setSelectedCities] = useState<string[]>(initialPrefs?.cities || ['Tokyo', 'Kyoto']);
  const [customCity, setCustomCity] = useState('');
  const [startDate, setStartDate] = useState(initialPrefs?.startDate || defaultStart);
  const [endDate, setEndDate] = useState(initialPrefs?.endDate || defaultEnd);
  const [travellerType, setTravellerType] = useState<'individual' | 'family'>(initialPrefs?.travellerType || 'individual');
  const [familyAges, setFamilyAges] = useState(initialPrefs?.familyAges || '');
  const [budgetBand, setBudgetBand] = useState<'low' | 'mid' | 'high'>(initialPrefs?.budgetBand || 'mid');
  const [interests, setInterests] = useState<string[]>(initialPrefs?.interests || ['Quiet Zen Gardens', 'Authentic Izakaya & Soba']);
  const [avoidCrowds, setAvoidCrowds] = useState(initialPrefs?.avoidCrowds ?? true);
  const [pace, setPace] = useState<'relaxed' | 'packed'>(initialPrefs?.pace || 'relaxed');
  const [customInterest, setCustomInterest] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);

  const handleAddCustomCity = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const clean = customCity.trim();
    if (clean && !selectedCities.includes(clean)) {
      setSelectedCities([...selectedCities, clean]);
      setCustomCity('');
    }
  };

  const handleToggleCity = (c: string) => {
    if (selectedCities.includes(c)) {
      if (selectedCities.length > 1) {
        setSelectedCities(selectedCities.filter(item => item !== c));
      }
    } else {
      setSelectedCities([...selectedCities, c]);
    }
  };

  const handleToggleInterest = (tag: string) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter(i => i !== tag));
    } else {
      if (interests.length < 12) {
        setInterests([...interests, tag]);
      }
    }
  };

  const handleAddCustomInterest = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const clean = customInterest.trim();
    if (clean && !interests.includes(clean) && interests.length < 12) {
      setInterests([...interests, clean]);
      setCustomInterest('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDateError(null);

    // Validate dates
    const s = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T00:00:00Z');
    const now = new Date();
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    if (s < todayUtc) {
      setDateError('Start date cannot be in the past.');
      return;
    }
    if (end < s) {
      setDateError('End date must be on or after start date.');
      return;
    }
    const days = Math.round((end.getTime() - s.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    if (days > 14) {
      setDateError('Maximum trip length is 14 days.');
      return;
    }

    onSubmit({
      cities: selectedCities,
      startDate,
      endDate,
      travellerType,
      familyAges,
      budgetBand,
      interests,
      avoidCrowds,
      pace
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-medium text-amber-100 flex items-center gap-2.5">
            <span>Craft Your Japan Journey</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Sourced travel plan for adventurous, discerning travellers & families seeking local serenity.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/40 border border-amber-800/40 text-[11px] text-amber-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Japan Exclusive</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Destination Cities */}
        <div>
          <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Destinations in Japan</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {COMMON_CITIES.map(c => {
              const active = selectedCities.includes(c);
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => handleToggleCity(c)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? 'bg-amber-500 text-stone-950 font-semibold shadow-md shadow-amber-500/10'
                      : 'bg-stone-800/90 text-stone-300 border border-stone-700/60 hover:border-stone-500'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={customCity}
              onChange={e => setCustomCity(e.target.value)}
              onKeyDown={handleAddCustomCity}
              placeholder="Add another city (e.g. Kamakura, Takayama, Hiroshima)..."
              maxLength={50}
              className="flex-1 bg-stone-800/80 border border-stone-700/60 rounded-xl px-3.5 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={handleAddCustomCity}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700/60 rounded-xl text-xs font-medium"
            >
              Add
            </button>
          </div>
          {selectedCities.length > 0 && (
            <div className="mt-2 text-[11px] text-stone-400">
              Selected route: <span className="text-amber-300 font-medium">{selectedCities.join(' → ')}</span>
            </div>
          )}
        </div>

        {/* Dates & Pacing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Travel Dates (Up to 14 days)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-stone-400 block mb-1">Start Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                  className="w-full bg-stone-800/80 border border-stone-700/60 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block mb-1">End Date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                  className="w-full bg-stone-800/80 border border-stone-700/60 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
            {dateError && (
              <p className="text-rose-400 text-xs mt-1.5">{dateError}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Journey Pace</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPace('relaxed')}
                className={`py-2 px-3 rounded-xl text-xs font-medium text-center border transition-all ${
                  pace === 'relaxed'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-stone-800/60 text-stone-400 border-stone-700/50'
                }`}
              >
                <div className="font-semibold">Relaxed</div>
                <div className="text-[10px] text-stone-400">Time to wander & linger</div>
              </button>
              <button
                type="button"
                onClick={() => setPace('packed')}
                className={`py-2 px-3 rounded-xl text-xs font-medium text-center border transition-all ${
                  pace === 'packed'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-stone-800/60 text-stone-400 border-stone-700/50'
                }`}
              >
                <div className="font-semibold">Full Explorer</div>
                <div className="text-[10px] text-stone-400">Maximize daily stops</div>
              </button>
            </div>
          </div>
        </div>

        {/* Traveller Type & Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Traveller Group</span>
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setTravellerType('individual')}
                className={`py-2 px-3 rounded-xl text-xs font-medium text-center border transition-all ${
                  travellerType === 'individual'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-stone-800/60 text-stone-400 border-stone-700/50'
                }`}
              >
                Individual / Couple
              </button>
              <button
                type="button"
                onClick={() => setTravellerType('family')}
                className={`py-2 px-3 rounded-xl text-xs font-medium text-center border transition-all ${
                  travellerType === 'family'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-stone-800/60 text-stone-400 border-stone-700/50'
                }`}
              >
                Family with Kids
              </button>
            </div>
            {travellerType === 'family' && (
              <input
                type="text"
                value={familyAges}
                onChange={e => setFamilyAges(e.target.value)}
                placeholder="Children ages (e.g. 6 and 11 years old)..."
                maxLength={60}
                className="w-full bg-stone-800/80 border border-stone-700/60 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
              Daily Budget Band (in JPY)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'low', label: 'Modest', jpy: '¥10,000–¥20,000' },
                { key: 'mid', label: 'Curated', jpy: '¥25,000–¥50,000' },
                { key: 'high', label: 'Premium', jpy: '¥60,000+' }
              ].map(b => (
                <button
                  type="button"
                  key={b.key}
                  onClick={() => setBudgetBand(b.key as any)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium text-center border transition-all ${
                    budgetBand === b.key
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-stone-800/60 text-stone-400 border-stone-700/50'
                  }`}
                >
                  <div className="font-semibold text-xs">{b.label}</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">{b.jpy}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Interests & Experiences (Select up to 12)</span>
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {INTEREST_TAGS.map(tag => {
              const active = interests.includes(tag);
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => handleToggleInterest(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                      : 'bg-stone-800/60 text-stone-400 border border-stone-700/40 hover:text-stone-200'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={customInterest}
              onChange={e => setCustomInterest(e.target.value)}
              onKeyDown={handleAddCustomInterest}
              placeholder="Add another custom interest..."
              maxLength={50}
              className="flex-1 bg-stone-800/80 border border-stone-700/60 rounded-xl px-3.5 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={handleAddCustomInterest}
              className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700/60 rounded-xl text-xs font-medium"
            >
              Add
            </button>
          </div>
        </div>

        {/* Crowd avoidance toggle */}
        <div className="p-4 rounded-2xl bg-stone-800/50 border border-stone-700/40 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-stone-200 flex items-center gap-2">
              <span>Avoid Tourist Crowds</span>
              <span className="text-[10px] bg-amber-950/60 text-amber-300 border border-amber-800/40 px-2 py-0.5 rounded-full font-mono">
                Signature Feature
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Schedules famous landmarks during serene early-morning or evening hours; prioritizes genuine 穴場 (hidden spots).
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={avoidCrowds}
            onClick={() => setAvoidCrowds(!avoidCrowds)}
            className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none ${
              avoidCrowds ? 'bg-amber-600' : 'bg-stone-700'
            }`}
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                avoidCrowds ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-semibold text-base transition-all shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span>Orchestrating Live Data & Assembling Plan...</span>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Generate Curated Japan Itinerary</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
