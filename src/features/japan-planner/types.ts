export interface SeasonItem {
  id: string;
  kind: 'festival' | 'flower' | 'fruit_picking' | string;
  name: string;
  status: string;
  window: string;
  lat?: number;
  lng?: number;
  sourceUrl?: string | null;
}

export interface HazardItem {
  id: string;
  type: string;
  label: string;
  severity: string;
  valueText?: string;
  eventDate?: string;
  timeAgo?: string;
  source?: string;
  note?: string;
}

export interface ForecastDay {
  date: string;
  tempMin?: number;
  tempMax?: number;
  precipMm?: number;
  windSpeed?: number;
  riskLevel?: string;
  hazard?: string | null;
}

export interface SafetyData {
  forecastByDay: ForecastDay[];
  hazards: HazardItem[];
  advisories: string[];
}

export interface HolidayItem {
  date: string;
  nameJa: string;
  nameEn?: string;
}

export interface PlaceItem {
  id: string;
  name: string;
  summary: string;
  sourceUrl: string | null;
  sourceTitle?: string;
}

export interface DiningItem {
  id: string;
  name: string;
  genre?: string;
  area?: string;
  budgetLabel?: string;
  access?: string;
  hours?: string;
  lat?: number;
  lng?: number;
  sourceUrl: string | null;
}

export interface ItineraryItem {
  time: string;
  type: 'famous-sight' | 'off-beaten-path' | 'after-hours' | 'food' | 'transit' | 'rest';
  name: string;
  nameJa?: string;
  why: string;
  crowdTip?: string;
  candidateId: string | null;
  verified: boolean;
  sourceUrl?: string | null;
  transportToNext?: {
    mode: 'walk' | 'train' | 'bus' | 'taxi';
    minutes?: number;
    mapsUrl: string;
  };
}

export interface ItineraryDay {
  date: string;
  city: string;
  theme: string;
  weatherNote: string;
  holiday?: {
    nameJa: string;
  };
  items: ItineraryItem[];
  stayArea: {
    area: string;
    why: string;
    searchUrl: string;
  };
}

export interface ItineraryPlan {
  generatedAt: string;
  currency: 'JPY';
  assumptions: string[];
  warnings: string[];
  days: ItineraryDay[];
}

export interface TripPreferences {
  cities: string[];
  startDate: string;
  endDate: string;
  travellerType: 'individual' | 'family';
  familyAges: string;
  budgetBand: 'low' | 'mid' | 'high';
  interests: string[];
  avoidCrowds: boolean;
  pace: 'relaxed' | 'packed';
}

export interface CandidateBag {
  places: PlaceItem[];
  dining: DiningItem[];
  season: SeasonItem[];
  safety: SafetyData;
  holidays: HolidayItem[];
}
