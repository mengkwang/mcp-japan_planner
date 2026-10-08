import React, { useState, useEffect } from 'react';
import { Volume2, Copy, Check, BookOpen } from 'lucide-react';

interface Phrase {
  id: string;
  category: 'Food' | 'Transport' | 'Help' | 'Shopping';
  kanji: string;
  kana: string;
  romaji: string;
  english: string;
}

const PHRASES: Phrase[] = [
  // Food
  { id: 'f1', category: 'Food', kanji: 'いただきます', kana: 'いただきます', romaji: 'Itadakimasu', english: 'Thank you for the meal (before eating)' },
  { id: 'f2', category: 'Food', kanji: 'ごちそうさまでした', kana: 'ごちそうさまでした', romaji: 'Gochisousama deshita', english: 'Thank you for the meal (after eating)' },
  { id: 'f3', category: 'Food', kanji: 'おすすめは何ですか？', kana: 'おすすめはなんですか？', romaji: 'Osusume wa nan desu ka?', english: 'What do you recommend?' },
  { id: 'f4', category: 'Food', kanji: 'お会計をお願いします', kana: 'おかいけいをおねがいします', romaji: 'O-kaikei o onegaishimasu', english: 'The bill, please' },
  { id: 'f5', category: 'Food', kanji: 'これをお願いします', kana: 'これをおねがいします', romaji: 'Kore o onegaishimasu', english: 'This one, please' },

  // Transport
  { id: 't1', category: 'Transport', kanji: '〜駅はどこですか？', kana: '〜えきはどこですか？', romaji: '...eki wa doko desu ka?', english: 'Where is ... station?' },
  { id: 't2', category: 'Transport', kanji: 'この電車は〜に行きますか？', kana: 'このでんしゃは〜にいきますか？', romaji: 'Kono densha wa ... ni ikimasu ka?', english: 'Does this train go to ...?' },
  { id: 't3', category: 'Transport', kanji: '次の停車駅はどこですか？', kana: 'つぎのていしゃえきはどこですか？', romaji: 'Tsugi no teisha-eki wa doko desu ka?', english: 'What is the next stop?' },
  { id: 't4', category: 'Transport', kanji: '切符売り場はどこですか？', kana: 'きっぷうりばはどこですか？', romaji: 'Kippu uriba wa doko desu ka?', english: 'Where is the ticket counter?' },
  { id: 't5', category: 'Transport', kanji: 'タクシー乗り場はどこですか？', kana: 'タクシーのりばはどこですか？', romaji: 'Takushī noriba wa doko desu ka?', english: 'Where is the taxi stand?' },

  // Help
  { id: 'h1', category: 'Help', kanji: 'すみません', kana: 'すみません', romaji: 'Sumimasen', english: 'Excuse me / Sorry' },
  { id: 'h2', category: 'Help', kanji: '英語が話せますか？', kana: 'えいごがはなせますか？', romaji: 'Eigo ga hanasemasu ka?', english: 'Can you speak English?' },
  { id: 'h3', category: 'Help', kanji: '助けてください', kana: 'たすけてください', romaji: 'Tasukete kudasai', english: 'Please help me' },
  { id: 'h4', category: 'Help', kanji: 'トイレはどこですか？', kana: 'トイレはどこですか？', romaji: 'Toire wa doko desu ka?', english: 'Where is the restroom?' },
  { id: 'h5', category: 'Help', kanji: '写真を撮っていただけますか？', kana: 'しゃしんをとっていただけますか？', romaji: 'Shashin o totte itadakemasu ka?', english: 'Could you take a photo for me?' },

  // Shopping
  { id: 's1', category: 'Shopping', kanji: 'いくらですか？', kana: 'いくらですか？', romaji: 'Ikura desu ka?', english: 'How much is this?' },
  { id: 's2', category: 'Shopping', kanji: 'カードは使えますか？', kana: 'カードはつかえますか？', romaji: 'Kādo wa tsukaemasu ka?', english: 'Can I pay by card?' },
  { id: 's3', category: 'Shopping', kanji: '免税できますか？', kana: 'めんぜいできますか？', romaji: 'Menzei dekimasu ka?', english: 'Is tax-free available?' },
  { id: 's4', category: 'Shopping', kanji: '袋はいりません', kana: 'ふくろはいりません', romaji: 'Fukuro wa irimasen', english: 'No bag needed, thank you' },
  { id: 's5', category: 'Shopping', kanji: 'これを見せてもらえますか？', kana: 'これをみせてもらえますか？', romaji: 'Kore o misete moraemasu ka?', english: 'May I see this one?' }
];

export const PhrasebookPanel: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Phrase['category'] | 'All'>('All');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const checkVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const hasJaVoice = voices.some(v => v.lang.startsWith('ja'));
        setSpeechSupported(hasJaVoice || voices.length === 0); // fallback to true until voices load
      };

      checkVoice();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = checkVoice;
      }
    }
  }, []);

  const handleSpeak = (text: string) => {
    if (!speechSupported || typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (phrase: Phrase) => {
    const textToCopy = `${phrase.kanji} (${phrase.romaji}) - ${phrase.english}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedId(phrase.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const categories = ['All', 'Food', 'Transport', 'Help', 'Shopping'] as const;
  const filteredPhrases = selectedCategory === 'All'
    ? PHRASES
    : PHRASES.filter(p => p.category === selectedCategory);

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-stone-100 shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/50 flex items-center justify-center text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg text-amber-100 font-medium">Curated Travel Phrasebook</h3>
            <p className="text-xs text-stone-400">Essential Japanese with authentic audio pronunciation</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-stone-800/80 text-stone-400 border border-stone-700/50 hover:text-stone-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
        {filteredPhrases.map(phrase => (
          <div
            key={phrase.id}
            className="p-3.5 rounded-xl bg-stone-800/60 border border-stone-700/40 hover:border-amber-500/30 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-base font-semibold text-stone-100 tracking-wide font-sans">{phrase.kanji}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {speechSupported && (
                    <button
                      onClick={() => handleSpeak(phrase.kanji)}
                      title="Listen pronunciation"
                      className="p-1.5 rounded-md bg-stone-700/60 hover:bg-amber-500/20 text-stone-300 hover:text-amber-300 transition-colors"
                      aria-label={`Pronounce ${phrase.romaji}`}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleCopy(phrase)}
                    title="Copy phrase"
                    className="p-1.5 rounded-md bg-stone-700/60 hover:bg-stone-600 text-stone-300 hover:text-stone-100 transition-colors"
                    aria-label="Copy phrase text"
                  >
                    {copiedId === phrase.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="text-xs text-amber-400/90 font-mono mb-1">{phrase.romaji}</div>
              <div className="text-xs text-stone-400">{phrase.kana}</div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-stone-700/40 text-xs text-stone-300 font-medium">
              {phrase.english}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
