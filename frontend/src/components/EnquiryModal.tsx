'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';

export type EnquiryIntent = 'enquiry' | 'buy';

interface EnquiryModalProps {
  open: boolean;
  onClose: () => void;
  artistUsername: string;
  artistName?: string;
  artworkId?: string;
  artworkTitle?: string;
  intent: EnquiryIntent;
}

/**
 * Buyer → artist lead-capture modal. Posts to POST /api/enquiries (public, no
 * auth). Accessible: focus trap, ESC / backdrop close, labelled inputs, body
 * scroll lock. Includes a hidden honeypot field (`company`) for anti-spam.
 */
export default function EnquiryModal({
  open,
  onClose,
  artistUsername,
  artistName,
  artworkId,
  artworkTitle,
  intent,
}: EnquiryModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    message: '',
    company: '', // honeypot
  });
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>(
    'idle',
  );
  const [error, setError] = useState('');

  const isBuy = intent === 'buy';
  const heading = isBuy ? 'Buy / Make an offer' : 'Enquire about this work';

  // Reset the form each time the modal opens.
  useEffect(() => {
    if (open) {
      setForm({
        buyerName: '',
        buyerEmail: '',
        buyerPhone: '',
        message: artworkTitle
          ? `Hi${artistName ? ` ${artistName}` : ''}, I'm interested in "${artworkTitle}".`
          : '',
        company: '',
      });
      setState('idle');
      setError('');
      // Focus the first field after paint.
      const t = setTimeout(() => firstFieldRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open, artworkTitle, artistName]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC to close + basic focus trap on Tab.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input:not([type="hidden"]), select',
        );
        if (focusables.length === 0) return;
        const list = Array.from(focusables).filter(
          (el) => el.offsetParent !== null,
        );
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.buyerName.trim()) return setError('Please enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.buyerEmail.trim()))
      return setError('Please enter a valid email address.');
    if (!form.message.trim()) return setError('Please write a short message.');

    setState('sending');
    try {
      await api.post('/api/enquiries', {
        artistUsername,
        artworkId,
        artworkTitle,
        intent,
        buyerName: form.buyerName.trim(),
        buyerEmail: form.buyerEmail.trim(),
        buyerPhone: form.buyerPhone.trim() || undefined,
        message: form.message.trim(),
        company: form.company, // honeypot (should be empty)
      });
      setState('success');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message || 'Something went wrong. Please try again.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
      setState('error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-navy/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-modal-title"
        className="w-full max-w-lg overflow-hidden rounded-t-2xl bg-cream shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between border-b border-navy/10 px-6 py-4">
          <div>
            <h2
              id="enquiry-modal-title"
              className="font-serif text-xl text-navy"
            >
              {heading}
            </h2>
            {artworkTitle ? (
              <p className="mt-0.5 text-sm text-muted">
                {artworkTitle}
                {artistName ? ` · ${artistName}` : ''}
              </p>
            ) : artistName ? (
              <p className="mt-0.5 text-sm text-muted">{artistName}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 rounded-full p-2 text-navy/60 transition hover:bg-navy/5 hover:text-navy"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {state === 'success' ? (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal/15 text-teal-deep">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="font-serif text-lg text-navy">Message sent</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              We&apos;ve passed your message to the artist and emailed you a
              confirmation. They&apos;ll usually reply by email.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-deep"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="px-6 py-5">
            {/* Honeypot: hidden from users, catches bots. */}
            <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0" style={{ left: '-9999px' }}>
              <label htmlFor="enquiry-company">Company</label>
              <input
                id="enquiry-company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.company}
                onChange={set('company')}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="enquiry-name" className="mb-1 block text-sm font-medium text-navy">
                  Your name <span className="text-magenta">*</span>
                </label>
                <input
                  id="enquiry-name"
                  ref={firstFieldRef}
                  type="text"
                  required
                  value={form.buyerName}
                  onChange={set('buyerName')}
                  className="w-full rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20"
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label htmlFor="enquiry-email" className="mb-1 block text-sm font-medium text-navy">
                  Email <span className="text-magenta">*</span>
                </label>
                <input
                  id="enquiry-email"
                  type="email"
                  required
                  value={form.buyerEmail}
                  onChange={set('buyerEmail')}
                  className="w-full rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="enquiry-phone" className="mb-1 block text-sm font-medium text-navy">
                  Phone <span className="text-muted">(optional)</span>
                </label>
                <input
                  id="enquiry-phone"
                  type="tel"
                  value={form.buyerPhone}
                  onChange={set('buyerPhone')}
                  className="w-full rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label htmlFor="enquiry-message" className="mb-1 block text-sm font-medium text-navy">
                  Message <span className="text-magenta">*</span>
                </label>
                <textarea
                  id="enquiry-message"
                  required
                  rows={4}
                  maxLength={2000}
                  value={form.message}
                  onChange={set('message')}
                  className="w-full resize-none rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20"
                  placeholder={isBuy ? 'Let the artist know your offer or questions…' : 'Ask the artist anything about this work…'}
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="mt-3 rounded-lg bg-magenta/10 px-3 py-2 text-sm text-magenta-deep">
                {error}
              </p>
            )}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-navy/70 transition hover:bg-navy/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={state === 'sending'}
                className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-deep disabled:cursor-not-allowed disabled:opacity-60"
              >
                {state === 'sending' ? 'Sending…' : isBuy ? 'Send offer' : 'Send enquiry'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
