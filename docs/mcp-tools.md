# MCP Tools Reference

Discovered via MCP `initialize` and `tools/list` protocol handshake.

## 1. Japan in Seasons (`haomingkoo/japan-seasons-mcp`)
- **Endpoint**: `https://seasons.kooexperience.com/mcp`
- **Transport**: Streamable HTTP (SSE `text/event-stream` / JSON)
- **Session ID**: Uses `Mcp-Session-Id` header across handshake and requests
- **Auth**: None (Keyless, free public service)
- **Tool count discovered**: 17 tools
- **Tools List**:
  1. `japan_seasonal_answer`: Answer broad seasonal travel questions across cherry blossoms, leaves, flowers, festivals, fruit picking.
     - Args: `{ question: string }`
  2. `sakura_now`: Sakura forecast right now from JMC data.
     - Args: `{}`
  3. `koyo_now`: Autumn leaves forecast right now from JMC data.
     - Args: `{}`
  4. `sakura_forecast`: Cherry blossom forecast for 48 observation cities.
     - Args: `{ city?: string }`
  5. `sakura_spots`: Exact viewing spots for a prefecture with bloom meter and GPS coords.
     - Args: `{ prefecture: string }`
  6. `sakura_best_dates`: Cities whose viewing window overlaps travel dates.
     - Args: `{ start_date: string, end_date: string }`
  7. `kawazu_forecast`: Early January-February Kawazu cherry blossom forecast.
     - Args: `{}`
  8. `koyo_forecast`: City-level maple and ginkgo forecast dates for Oct-Dec.
     - Args: `{}`
  9. `koyo_spots`: Exact autumn leaves viewing spots with GPS coords.
     - Args: `{ prefecture?: string }`
  10. `koyo_best_dates`: Cities where foliage peaks during trip dates.
      - Args: `{ start_date: string, end_date: string }`
  11. `weather_forecast`: Next 3 days of JMA weather forecast and rain probabilities.
      - Args: `{ city: string }`
  12. `flowers_spots`: Non-sakura flower spots (plum, wisteria, hydrangea, lavender, sunflower, cosmos) with peak windows and GPS.
      - Args: `{ type?: string }`
  13. `fruit_seasons`: Fruit picking season calendar for 14 fruits by month.
      - Args: `{ month?: number }`
  14. `festivals_list`: Curated seasonal festivals (matsuri, fireworks, winter events) with dates, locations, GPS.
      - Args: `{ query?: string }`
  15. `fruit_farms`: Fruit picking farm listings with booking links and coordinates.
      - Args: `{ month?: number }`
  16. `search`: Search seasonal dataset guides.
      - Args: `{ query: string }`
  17. `fetch`: Fetch seasonal dataset result by ID.
      - Args: `{ id: string }`

## 2. Criora Climate & Disaster Risk (`thothbot/criora`)
- **Endpoint**: `https://criora.com/mcp`
- **Transport**: HTTP POST JSON-RPC 2.0
- **Auth**: None (Keyless, free public service)
- **Tools List**:
  1. `find_place`: Resolves a place name or address to geographic coordinates using OpenStreetMap Nominatim.
     - Args: `{ query: string }`
  2. `get_forecast`: 7-day weather risk forecast by day for coordinates or place name.
     - Args: `{ latitude?: number, longitude?: number, place?: string, hourly?: boolean }`
  3. `get_hazards_near`: Disasters and hazards happening now or recently near coordinates (earthquake, flood, cyclone, volcano, wildfire).
     - Args: `{ latitude?: number, longitude?: number, place?: string, radius_km?: number, event_types?: string[], days?: number }`
  4. `assess_place`: Comprehensive place assessment combining forecast risk, nearby hazards, and climate profile.
     - Args: `{ latitude?: number, longitude?: number, place?: string }`
  5. `get_climate_profile`: Long-term climate hazard exposure layers.
     - Args: `{ latitude?: number, longitude?: number, place?: string, categories?: string[] }`
  6. `get_country_profile`: National disaster risk and climate atlas profile.
     - Args: `{ country: string, include_indicators?: boolean }`
  7. `compare_countries`: Side-by-side risk score comparison across 2-10 countries.
     - Args: `{ countries: string[] }`

## 3. Japan Holiday MCP (`kakar-satoshi/japan-holiday-mcp`)
- **Endpoint**: `https://server.smithery.ai/kakar-satoshi/japan-holiday-mcp/mcp`
- **Transport**: Streamable HTTP
- **Auth**: `Authorization: Bearer <SMITHERY_API_KEY>`
- **Tools**:
  - `get_holidays`: Retrieve Japanese national and substitute holidays from Cabinet Office data for a date range.
    - Args: `{ start_date?: string, end_date?: string, year?: number }`

## 4. Brave Search MCP (`brave`)
- **Endpoint**: `https://server.smithery.ai/brave/mcp`
- **Transport**: Streamable HTTP
- **Auth**: `Authorization: Bearer <SMITHERY_API_KEY>`, with Brave token forwarded via headers/config
- **Tool**:
  - `brave_web_search`: Perform web search for queries.
    - Args: `{ query: string, count?: number }`
