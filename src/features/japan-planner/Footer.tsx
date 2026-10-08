import React from 'react';
import { ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 pt-10 pb-16 border-t border-stone-800 text-stone-400 text-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Data Sources */}
        <div>
          <span className="font-semibold text-stone-300 block mb-2.5">
            Data Sources & Intelligence Services:
          </span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-stone-400 text-xs">
            <a
              href="https://seasons.kooexperience.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-300 flex items-center gap-1 transition-colors underline"
            >
              <span>Japan in Seasons (Cherry Blossoms, Foliage & Festivals)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <a
              href="https://criora.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-300 flex items-center gap-1 transition-colors underline"
            >
              <span>Criora (Weather Risk & Hazard Assessment)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <a
              href="https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-300 flex items-center gap-1 transition-colors underline"
            >
              <span>Cabinet Office, Government of Japan (Public Holidays)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <a
              href="https://brave.com/search/api/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-300 flex items-center gap-1 transition-colors underline"
            >
              <span>Brave Search (Hidden Gem Web Discovery)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <a
              href="https://webservice.recruit.co.jp/hotpepper/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-300 flex items-center gap-1 transition-colors underline"
            >
              <span>Recruit Hot Pepper Gourmet (Authentic Dining API)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Mandatory Attribution and Disclaimer Statements */}
        <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 leading-relaxed text-[11px] space-y-2">
          <p>
            Itineraries are AI-generated from public web sources and third-party data. Opening hours, prices, forecasts and availability can change, so please verify before you go. Check official government travel advisories before travelling. This is a course project and is not affiliated with or endorsed by any provider named here.
          </p>
          <p className="text-stone-400">
            Powered by Recruit Hot Pepper Gourmet Web Service. Weather and environmental disaster monitoring provided via Criora and Japan in Seasons. All currency references in Japanese Yen (JPY). Times displayed in Japan Standard Time (JST).
          </p>
        </div>

        <div className="text-center text-stone-400 text-[11px]">
          © {new Date().getFullYear()} Komorebi Japan Itinerary Planner. Safe, curated local journeys beyond the crowds.
        </div>
      </div>
    </footer>
  );
};
