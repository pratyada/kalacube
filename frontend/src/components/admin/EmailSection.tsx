'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Campaign, RecipientPreview } from './types';
import { Panel, ui, cx } from './console';

const SEGMENTS: { value: string; label: string }[] = [
  { value: 'all', label: 'All artists' },
  { value: 'active', label: 'Active artists' },
  { value: 'has-artwork', label: 'Artists with artwork' },
  { value: 'dimension:handicraft', label: 'Dimension: Handicraft' },
  { value: 'dimension:visual_art', label: 'Dimension: Visual Art' },
  { value: 'dimension:performing_arts', label: 'Dimension: Performing Arts' },
];

export default function EmailSection({ userEmail }: { userEmail: string }) {
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [segment, setSegment] = useState('all');
  const [preview, setPreview] = useState<RecipientPreview | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const loadPreview = useCallback((seg: string) => {
    api
      .get('/api/admin/recipients', { params: { segment: seg } })
      .then(({ data }) => setPreview(data.data))
      .catch(() => setPreview(null));
  }, []);

  const loadCampaigns = useCallback(() => {
    api
      .get('/api/admin/campaigns')
      .then(({ data }) => setCampaigns(data.data?.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadPreview(segment);
  }, [segment, loadPreview]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const notify = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 5000);
  };

  const validate = (): boolean => {
    if (!subject.trim()) {
      notify('Subject is required.');
      return false;
    }
    if (!bodyHtml.trim()) {
      notify('Body is required.');
      return false;
    }
    return true;
  };

  const sendTest = async () => {
    if (!validate()) return;
    setSending(true);
    try {
      const { data } = await api.post('/api/admin/campaigns', {
        subject,
        bodyHtml,
        segment,
        testEmail: userEmail,
      });
      notify(`Test email queued to ${userEmail} (${data.data?.queued ?? 1}).`);
    } catch {
      notify('Failed to queue test email.');
    } finally {
      setSending(false);
    }
  };

  const sendCampaign = async () => {
    if (confirmText.trim().toUpperCase() !== 'SEND') return;
    setSending(true);
    try {
      const { data } = await api.post('/api/admin/campaigns', {
        subject,
        bodyHtml,
        segment,
        confirm: true,
      });
      notify(`Campaign queued to ${data.data?.queued ?? 0} recipients.`);
      setShowConfirm(false);
      setConfirmText('');
      setSubject('');
      setBodyHtml('');
      loadCampaigns();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to send campaign.';
      notify(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg uppercase tracking-[0.25em] text-[#c2d0dc]">
          Email &amp; Marketing
        </h2>
        <p className={cx('mt-1 text-xs', ui.mut)}>
          Compose and send branded newsletters to artist segments.
        </p>
      </div>

      {flash && (
        <div className="rounded border border-[#f5c451]/40 bg-[#f5c451]/10 px-4 py-3 text-sm text-[#f5c451]">
          {flash}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Compose */}
        <div className="lg:col-span-2">
          <Panel title="COMPOSE">
            <label className={cx('block', ui.label)}>Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Your monthly kalaCUBE dispatch…"
              className={cx(ui.input, 'mt-1')}
            />

            <label className={cx('mt-4 block', ui.label)}>Body (HTML)</label>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              rows={12}
              placeholder="<p>Hello artists,</p><p>We have news to share…</p>"
              className={cx(ui.input, 'mt-1 text-xs')}
            />
            <p className={cx('mt-1 text-xs', ui.mut)}>
              HTML is rendered inside the branded kalaCUBE newsletter template.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={sendTest}
                disabled={sending}
                className={cx(ui.btn, 'disabled:opacity-50')}
              >
                Send test to me
              </button>
              <button
                onClick={() => {
                  if (validate()) setShowConfirm(true);
                }}
                disabled={sending}
                className={cx(ui.btnPrimary, 'disabled:opacity-50')}
              >
                Send Campaign
              </button>
            </div>
          </Panel>
        </div>

        {/* Segment + recipients */}
        <div>
          <Panel title="SEGMENT">
            <label className={cx('block', ui.label)}>Segment</label>
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              className={cx(ui.select, 'mt-1 w-full px-3 py-2 text-sm')}
            >
              {SEGMENTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <div className="mt-5 rounded border border-[#132030] bg-[#080d13] p-4 text-center">
              <div
                className="text-4xl font-semibold tabular-nums"
                style={{ color: '#3ef2a1' }}
              >
                {preview ? preview.count : '—'}
              </div>
              <div className={cx('mt-1', ui.label)}>recipients</div>
            </div>

            {preview && preview.sample.length > 0 && (
              <div className="mt-4">
                <div className={ui.label}>Sample</div>
                <ul className={cx('mt-1 space-y-1 text-xs', ui.mut)}>
                  {preview.sample.map((e) => (
                    <li key={e} className="truncate">
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* History */}
      <Panel title="CAMPAIGN HISTORY" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className={ui.rTable}>
            <thead className={ui.rThead}>
              <tr>
                <th className={ui.th}>Subject</th>
                <th className={ui.th}>Segment</th>
                <th className={ui.th}>Recipients</th>
                <th className={ui.th}>Sent by</th>
                <th className={ui.th}>Date</th>
              </tr>
            </thead>
            <tbody className={ui.rTbody}>
              {campaigns.map((c) => (
                <tr key={c._id} className={cx(ui.rowHover, ui.rTr)}>
                  <td
                    data-label="Subject"
                    className={cx(ui.rTd, 'font-medium text-[#c2d0dc]')}
                  >
                    {c.subject}
                  </td>
                  <td data-label="Segment" className={cx(ui.rTd, ui.cyan)}>
                    {c.segment}
                  </td>
                  <td
                    data-label="Recipients"
                    className={cx(ui.rTd, 'tabular-nums', ui.green)}
                  >
                    {c.recipientCount}
                  </td>
                  <td data-label="Sent by" className={cx(ui.rTd, ui.mut)}>
                    {c.sentBy}
                  </td>
                  <td data-label="Date" className={cx(ui.rTd, ui.mut)}>
                    {c.createdAt
                      ? new Date(c.createdAt).toLocaleString()
                      : '—'}
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className={cx(ui.rTdEmpty, ui.mut)}
                  >
                    No campaigns sent yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className={cx(ui.panel, 'w-full max-w-md p-6')}>
            <h3 className="text-sm uppercase tracking-[0.25em] text-[#c2d0dc]">
              Confirm campaign send
            </h3>
            <p className={cx('mt-2 text-sm', ui.mut)}>
              This will queue{' '}
              <span className={cx('font-semibold tabular-nums', ui.green)}>
                {preview?.count ?? 0}
              </span>{' '}
              emails to the{' '}
              <span className="font-semibold text-[#c2d0dc]">
                {SEGMENTS.find((s) => s.value === segment)?.label || segment}
              </span>{' '}
              segment. This cannot be undone. Type{' '}
              <span className={cx('font-semibold', ui.amber)}>SEND</span> to
              confirm.
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SEND"
              className={cx(ui.input, 'mt-4')}
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText('');
                }}
                className={ui.btn}
              >
                Cancel
              </button>
              <button
                onClick={sendCampaign}
                disabled={
                  sending || confirmText.trim().toUpperCase() !== 'SEND'
                }
                className={cx(ui.btnPrimary, 'disabled:opacity-40')}
              >
                Send now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
