'use client';

import { useReportWebVitals } from 'next/web-vitals';

/**
 * Reports Core Web Vitals (LCP, INP, CLS, FCP, TTFB) to GA4 as events so page
 * performance is visible per-page in Analytics. Requires the gtag snippet in
 * the root layout (Measurement ID G-TP8KDLQR1Z).
 */
export default function WebVitals() {
  useReportWebVitals((metric) => {
    if (typeof window === 'undefined') return;
    const g = (window as unknown as { gtag?: (...args: unknown[]) => void })
      .gtag;
    if (typeof g !== 'function') return;
    g('event', metric.name, {
      // CLS is a small decimal — scale it so GA4 can aggregate a useful integer.
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_rating: metric.rating,
      event_category: 'Web Vitals',
      non_interaction: true,
    });
  });
  return null;
}
