import React, { useState } from 'react';
import { Send, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';

export const FeedbackPanel: React.FC = () => {
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (message.trim().length < 5) {
      setError('Please provide at least 5 characters in your feedback.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          contact: contact.trim(),
          honeypot: honeypot.trim()
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to deliver feedback.');
      }

      setSubmitted(true);
      setMessage('');
      setContact('');
    } catch (err: any) {
      setError(err.message || 'Error transmitting feedback. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif text-lg text-amber-100 font-medium">Feedback & Local Insights</h3>
          <p className="text-xs text-stone-400">Directly forwarded to our curation team via private channel</p>
        </div>
      </div>

      {submitted ? (
        <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          <h4 className="text-sm font-semibold text-emerald-200">Thanks, we read every message</h4>
          <p className="text-xs text-stone-400">Your notes help refine genuine hidden gems across Japan.</p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-2 text-xs text-amber-400 hover:underline"
          >
            Send another note
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Honeypot field for bot deterrence */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website_url">Leave empty</label>
            <input
              type="text"
              id="website_url"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Your Message or Experience Feedback
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about a hidden spot you loved, a closed venue, or suggested pacing improvements..."
              rows={3}
              maxLength={1000}
              className="w-full bg-stone-800/90 border border-stone-700/60 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500/60 transition-colors resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Contact / Handle (Optional)
            </label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Email or Telegram handle"
              maxLength={100}
              className="w-full bg-stone-800/90 border border-stone-700/60 rounded-xl px-3.5 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500/60 transition-colors"
            />
          </div>

          <p className="text-[11px] text-stone-400">
            Privacy notice: Please do not include sensitive personal or financial information. Feedback text and contact details are not saved in browser storage.
          </p>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-900/50 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-medium text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Sending note...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit Feedback</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
