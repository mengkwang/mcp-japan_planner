import React, { useState, useEffect } from 'react';
import { Sparkles, Compass, ShieldAlert, BookOpen, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { TripPreferences, CandidateBag, ItineraryPlan, SeasonItem, SafetyData } from './types';
import { PlanForm } from './PlanForm';
import { SeasonStrip } from './SeasonStrip';
import { SafetyPanel } from './SafetyPanel';
import { ItineraryView } from './ItineraryView';
import { PhrasebookPanel } from './PhrasebookPanel';
import { FeedbackPanel } from './FeedbackPanel';
import { ShareButtons } from './ShareButtons';
import { Footer } from './Footer';

const STORAGE_KEY = 'komorebi_last_itinerary_plan';

export const JapanPlanner: React.FC = () => {
  const [preferences, setPreferences] = useState<TripPreferences | null>(null);
  const [candidates, setCandidates] = useState<CandidateBag>({
    places: [],
    dining: [],
    season: [],
    safety: { forecastByDay: [], hazards: [], advisories: [] },
    holidays: []
  });

  const [seasonItems, setSeasonItems] = useState<SeasonItem[]>([]);
  const [safetyData, setSafetyData] = useState<SafetyData | null>(null);
  const [itineraryPlan, setItineraryPlan] = useState<ItineraryPlan | null>(null);

  const [isLoadingSeason, setIsLoadingSeason] = useState(false);
  const [isLoadingSafety, setIsLoadingSafety] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'safety' | 'phrasebook' | 'feedback'>('itinerary');

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkedDateStr, setCheckedDateStr] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Load last plan from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.plan && parsed.plan.days) {
          setItineraryPlan(parsed.plan);
          if (parsed.preferences) setPreferences(parsed.preferences);
          if (parsed.seasonItems) setSeasonItems(parsed.seasonItems);
          if (parsed.safetyData) setSafetyData(parsed.safetyData);
        }
      }
    } catch {
      // ignore corrupted localStorage
    }
  }, []);

  const handleGeneratePlan = async (prefs: TripPreferences) => {
    setPreferences(prefs);
    setErrorMessage(null);
    setStatusMessage('Querying live seasons, safety, holidays, hidden places & dining across Japan...');
    setIsGeneratingPlan(true);
    setIsLoadingSeason(true);
    setIsLoadingSafety(true);

    const primaryCity = prefs.cities[0] || 'Tokyo';
    const todayJst = new Date().toISOString().slice(0, 10);
    setCheckedDateStr(todayJst);

    const candidateBag: CandidateBag = {
      places: [],
      dining: [],
      season: [],
      safety: { forecastByDay: [], hazards: [], advisories: [] },
      holidays: []
    };

    // Parallel execution of candidate sources
    try {
      const seasonPromise = fetch(`/api/season?city=${encodeURIComponent(primaryCity)}&date=${prefs.startDate}`)
        .then(async (res) => {
          if (!res.ok) return [];
          return res.json();
        })
        .then((data: SeasonItem[]) => {
          if (Array.isArray(data)) {
            candidateBag.season = data;
            setSeasonItems(data);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingSeason(false));

      const safetyPromise = fetch(
        `/api/safety?city=${encodeURIComponent(primaryCity)}&startDate=${prefs.startDate}&endDate=${prefs.endDate}`
      )
        .then(async (res) => {
          if (!res.ok) return null;
          return res.json();
        })
        .then((data: SafetyData) => {
          if (data) {
            candidateBag.safety = data;
            setSafetyData(data);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingSafety(false));

      const holidaysPromise = fetch(`/api/holidays?startDate=${prefs.startDate}&endDate=${prefs.endDate}`)
        .then(async (res) => {
          if (!res.ok) return [];
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) candidateBag.holidays = data;
        })
        .catch(() => {});

      const placesPromise = fetch(
        `/api/places?city=${encodeURIComponent(primaryCity)}&interest=${encodeURIComponent(
          prefs.interests.join(' ') || 'culture'
        )}&avoidCrowds=${prefs.avoidCrowds}`
      )
        .then(async (res) => {
          if (!res.ok) return [];
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) candidateBag.places = data;
        })
        .catch(() => {});

      const diningPromise = fetch(`/api/dining?city=${encodeURIComponent(primaryCity)}`)
        .then(async (res) => {
          if (!res.ok) return [];
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) candidateBag.dining = data;
        })
        .catch(() => {});

      // Wait for candidate sources to complete
      await Promise.allSettled([seasonPromise, safetyPromise, holidaysPromise, placesPromise, diningPromise]);
      setCandidates(candidateBag);

      setStatusMessage('Assembling and ordering curated itinerary using Gemini...');

      // Call itinerary synthesis
      const itinRes = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cities: prefs.cities,
          startDate: prefs.startDate,
          endDate: prefs.endDate,
          travellerType: prefs.travellerType,
          familyAges: prefs.familyAges,
          budgetBand: prefs.budgetBand,
          interests: prefs.interests,
          avoidCrowds: prefs.avoidCrowds,
          pace: prefs.pace,
          candidates: candidateBag
        })
      });

      if (!itinRes.ok) {
        const errJson = await itinRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to assemble itinerary plan.');
      }

      const plan: ItineraryPlan = await itinRes.json();
      setItineraryPlan(plan);
      setStatusMessage(null);

      // Persist plan in localStorage
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            plan,
            preferences: prefs,
            seasonItems: candidateBag.season,
            safetyData: candidateBag.safety
          })
        );
      } catch {
        // Storage full or unavailable
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to build itinerary. Please verify input parameters and retry.');
      setStatusMessage(null);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Banner & Header */}
      <header className="border-b border-stone-800 bg-stone-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif text-lg font-bold shadow-inner">
              木
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg sm:text-xl font-medium tracking-tight text-amber-100">
                  Komorebi Japan
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700/60 hidden sm:inline">
                  木漏れ日
                </span>
              </div>
              <p className="text-[11px] text-stone-400 leading-tight">
                Authentic, off-the-beaten-path itineraries for discerning travellers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {itineraryPlan && (
              <ShareButtons plan={itineraryPlan} cities={preferences?.cities || ['Tokyo']} />
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Plan Configuration Form */}
        <section>
          <PlanForm
            onSubmit={handleGeneratePlan}
            isLoading={isGeneratingPlan}
            initialPrefs={preferences || undefined}
          />
        </section>

        {/* Status / Loading Banner */}
        {isGeneratingPlan && (
          <div className="bg-stone-900 border border-amber-500/30 rounded-2xl p-5 shadow-2xl flex items-center gap-3.5 text-xs text-amber-200">
            <RefreshCw className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
            <div>
              <div className="font-semibold text-stone-100 mb-0.5">{statusMessage || 'Processing...'}</div>
              <p className="text-stone-400">
                Fetching verified weather from Criora, festivals from Japan in Seasons, holidays from Cabinet Office, and local dining from Hot Pepper.
              </p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="bg-rose-950/40 border border-rose-900/60 rounded-2xl p-4 flex items-center gap-3 text-xs text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-semibold block mb-0.5">Could not complete request</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Season Strip (always displayed when data is available or loading) */}
        {(seasonItems.length > 0 || isLoadingSeason) && (
          <section>
            <SeasonStrip
              items={seasonItems}
              isLoading={isLoadingSeason}
              city={preferences?.cities[0] || 'Tokyo'}
            />
          </section>
        )}

        {/* Navigation Tabs (Itinerary, Safety & Weather, Phrasebook, Feedback) */}
        <div className="flex border-b border-stone-800 gap-1 sm:gap-4 overflow-x-auto scrollbar-none pb-px">
          <button
            onClick={() => setActiveTab('itinerary')}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'itinerary'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Itinerary Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('safety')}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'safety'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Safety & Weather Risk</span>
          </button>

          <button
            onClick={() => setActiveTab('phrasebook')}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'phrasebook'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Travel Phrasebook</span>
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'feedback'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Feedback</span>
          </button>
        </div>

        {/* Tab Panels */}
        {activeTab === 'itinerary' && (
          <section>
            {itineraryPlan ? (
              <ItineraryView
                plan={itineraryPlan}
                checkedDateStr={checkedDateStr}
              />
            ) : (
              <div className="bg-stone-900 border border-stone-800 rounded-3xl p-12 text-center text-stone-400 space-y-3">
                <Compass className="w-10 h-10 text-stone-600 mx-auto" />
                <h3 className="text-base font-serif text-stone-300 font-medium">Ready to Plan Your Journey</h3>
                <p className="text-xs max-w-md mx-auto leading-relaxed">
                  Select your cities and travel dates above, then click Generate to create a custom, sourced day-by-day itinerary with crowd-avoidance timing.
                </p>
              </div>
            )}
          </section>
        )}

        {activeTab === 'safety' && (
          <section>
            <SafetyPanel
              safety={safetyData}
              isLoading={isLoadingSafety}
              city={preferences?.cities[0] || 'Tokyo'}
            />
          </section>
        )}

        {activeTab === 'phrasebook' && (
          <section>
            <PhrasebookPanel />
          </section>
        )}

        {activeTab === 'feedback' && (
          <section>
            <FeedbackPanel />
          </section>
        )}
      </main>

      {/* Footer with Mandatory Attribution and Disclaimers */}
      <Footer />
    </div>
  );
};
