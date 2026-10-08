import React, { useState } from 'react';
import { Share2, Copy, Check, Send } from 'lucide-react';
import { ItineraryPlan } from './types';

interface ShareButtonsProps {
  plan: ItineraryPlan;
  cities: string[];
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({ plan, cities }) => {
  const [copied, setCopied] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://komorebi-japan.app';

  // Build condensed summary text strictly under 1,500 characters
  const summaryDays = plan.days
    .map((d, i) => `Day ${i + 1} (${d.city}): ${d.theme} — ${d.items.slice(0, 3).map(it => it.name).join(', ')}`)
    .join('\n');

  const shareTextRaw = `🇯🇵 Japan Curated Itinerary: ${cities.join(' & ')}
${plan.days.length}-day custom local journey (off-the-beaten-path picks & verified dining).

${summaryDays}

Explore full itinerary & transit directions at: ${appUrl}`;

  const shareText = shareTextRaw.slice(0, 1480);

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Japan Journey: ${cities.join(', ')}`,
          text: shareText,
          url: appUrl
        });
        return;
      } catch {
        // Fallback to copy if cancelled or rejected
      }
    }
    handleCopyText();
  };

  const handleCopyText = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  const waLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const tgLink = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleNativeShare}
        className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span>Share Trip</span>
      </button>

      <button
        onClick={handleCopyText}
        className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700/60 text-xs font-medium flex items-center gap-1.5 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        <span>{copied ? 'Copied to Clipboard!' : 'Copy Itinerary Text'}</span>
      </button>

      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-emerald-950/40 text-stone-300 hover:text-emerald-300 border border-stone-700/60 hover:border-emerald-700/40 text-xs flex items-center gap-1.5 transition-colors"
        title="Share on WhatsApp"
      >
        <span>WhatsApp</span>
      </a>

      <a
        href={tgLink}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-sky-950/40 text-stone-300 hover:text-sky-300 border border-stone-700/60 hover:border-sky-700/40 text-xs flex items-center gap-1.5 transition-colors"
        title="Share on Telegram"
      >
        <Send className="w-3 h-3" />
        <span>Telegram</span>
      </a>

      {/* WeChat notice: No web link available, copy button offered */}
      <span className="text-[11px] text-stone-400 hidden sm:inline ml-1">
        (For WeChat, use Copy Itinerary Text)
      </span>
    </div>
  );
};
