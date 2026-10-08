/**
 * Outbound link generators.
 * Neutral links with no affiliate tags or scraping.
 */

export function buildGoogleMapsTransitUrl(origin: string, destination: string): string {
  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
    travelmode: 'transit'
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function buildStaySearchUrl(city: string, area?: string): string {
  const query = area ? `${area}, ${city}, Japan` : `${city}, Japan`;
  return `https://www.google.com/travel/hotels/${encodeURIComponent(query)}`;
}

export function buildFlightSearchUrl(destinationCity: string): string {
  return `https://www.google.com/travel/flights?q=flights+to+${encodeURIComponent(destinationCity + ', Japan')}`;
}

export function buildGovernmentAdvisoryUrl(): string {
  return 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/japan-travel-advisory.html';
}

export function buildJapanCabinetOfficeUrl(): string {
  return 'https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html';
}
