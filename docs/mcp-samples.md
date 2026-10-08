# MCP and API Response Samples

Trimmed real response samples used for writing resilient parsers.

### 1. Criora `get_forecast` Sample
```json
{
  "location": { "lat": 35.6762, "lon": 139.6503, "timezone": "Asia/Tokyo" },
  "source": { "model": "GDPS", "institution": "Environment and Climate Change Canada" },
  "days": [
    {
      "date": "2026-10-08",
      "temperature_min": 14.5,
      "temperature_max": 25.1,
      "precipitation_rate_max": 0,
      "wind_speed_max": 3.07,
      "risk": { "class": 1, "level": "Low", "hazard": "Heat" }
    },
    {
      "date": "2026-10-09",
      "temperature_min": 15.2,
      "temperature_max": 23.4,
      "precipitation_rate_max": 2.1,
      "wind_speed_max": 4.12,
      "risk": { "class": 0, "level": "Very low", "hazard": null }
    }
  ]
}
```

### 2. Criora `get_hazards_near` Sample
```json
{
  "resolved_from": null,
  "data": [
    {
      "id": 189336,
      "type": "earthquake",
      "nature": "observed",
      "lat": 35.5597,
      "lon": 140.5835,
      "label": "Earthquake in Japan",
      "sublabel": "Chiba / Kanto",
      "severity": "medium",
      "value_text": "M 4.9",
      "event_date": "2026-10-07T19:13:47",
      "time_ago": "9h ago",
      "source": "gdacs",
      "country_name": "Japan"
    }
  ]
}
```

### 3. Japan Seasons `festivals_list` / `flowers_spots` Sample
```text
# Japan Festivals
Source: seasons.kooexperience.com | 46 events
## 🎆 Fireworks (12)
### Sumida River Fireworks (隅田川花火大会)
- **When:** Jul — Last Saturday of July
- **Location:** Tokyo (Kanto)
- **Attendance:** ~900,000 visitors
- **Lat/Lng:** 35.7126, 139.8055
- **Official:** https://www.sumidagawa-hanabi.com/

### Gion Matsuri (祇園祭)
- **When:** Jul — Entire month of July (peaks Jul 17 & 24)
- **Location:** Kyoto (Kansai)
```

### 4. Recruit Hot Pepper Gourmet REST API Sample
```json
{
  "results": {
    "api_version": "1.30",
    "results_available": 42,
    "shop": [
      {
        "id": "J001234567",
        "name": "炭火焼鳥 隠れ家 銀座",
        "name_kana": "すみびやきとり かくれが ぎんざ",
        "genre": { "name": "和食", "catch": "厳選地鶏と銘酒の隠れ家" },
        "budget": { "name": "4001～5000円", "average": "4500円" },
        "middle_area": { "name": "銀座・有楽町" },
        "access": "銀座駅 A3出口 徒歩3分",
        "open": "月～土: 17:30～23:00",
        "lat": 35.6708,
        "lng": 139.7645,
        "urls": { "pc": "https://www.hotpepper.jp/strJ001234567/" }
      }
    ]
  }
}
```

### 5. Brave Search MCP Sample
```json
{
  "query": { "original": "Tokyo hidden gem temple garden 穴場" },
  "mixed": {
    "main": [
      {
        "title": "Kyu-Asakura House: A Hidden Taisho Era Oasis in Daikanyama",
        "url": "https://tokyocheapo.com/entertainment/kyu-asakura-house/",
        "description": "Nestled in Daikanyama, this registered important cultural property features a traditional Japanese timber mansion with a tranquil stroll garden."
      }
    ]
  }
}
```
