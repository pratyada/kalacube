'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatINR } from '@/lib/commerce';
import {
  FULFILMENT_STATUSES,
  displayName,
  type AdminOrder,
  type OrdersSummary,
} from './types';
import { Panel, StatTile, ui, cx } from './console';

const PAGE_SIZE = 25;
const PAYMENT_STATES = ['pending', 'paid', 'refunded'];

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/** Operations table: who's selling what, to whom, when, + payment/fulfilment. */
export default function OrdersSection() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [summary, setSummary] = useState<OrdersSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [payFilter, setPayFilter] = useState('');
  const [fulFilter, setFulFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/api/admin/orders', {
        params: {
          search: search || undefined,
          paymentStatus: payFilter || undefined,
          fulfilmentStatus: fulFilter || undefined,
          page,
          limit: PAGE_SIZE,
        },
      })
      .then(({ data }) => {
        setOrders(data.data?.items || []);
        setTotal(data.data?.total || 0);
        setSummary(data.data?.summary || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, payFilter, fulFilter, page]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, payFilter, fulFilter]);

  const setStatus = async (id: string, status: string) => {
    setSavingId(id);
    try {
      await api.patch(`/api/orders/${id}/status`, { status });
      load();
    } finally {
      setSavingId('');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total orders" value={total} accent="cyan" />
        <StatTile label="Paid orders" value={summary?.paidOrders ?? 0} accent="green" />
        <StatTile
          label="Gross (paid)"
          value={formatINR(summary?.grossPaid ?? 0)}
          accent="green"
        />
        <StatTile
          label="In transit"
          value={summary?.byStatus?.IN_TRANSIT ?? 0}
          accent="amber"
        />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg uppercase tracking-[0.25em] text-[#c2d0dc]">
            Orders &amp; Fulfilment
          </h2>
          <p className={cx('mt-1 text-xs', ui.mut)}>
            <span className={cx('tabular-nums', ui.green)}>{total}</span> order
            {total === 1 ? '' : 's'} · who&apos;s selling what, to whom, when
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search buyer / artwork…"
            className={cx(ui.input, 'w-full sm:w-60')}
          />
          <select
            value={payFilter}
            onChange={(e) => setPayFilter(e.target.value)}
            className={ui.select}
          >
            <option value="">All payments</option>
            {PAYMENT_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={fulFilter}
            onChange={(e) => setFulFilter(e.target.value)}
            className={ui.select}
          >
            <option value="">All statuses</option>
            {FULFILMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Panel title="ORDER LEDGER" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className={ui.rTable}>
            <thead className={ui.rThead}>
              <tr>
                <th className={ui.th}>Artist</th>
                <th className={ui.th}>Artwork</th>
                <th className={ui.th}>Buyer</th>
                <th className={ui.th}>Amount</th>
                <th className={ui.th}>Payment</th>
                <th className={ui.th}>Fulfilment</th>
                <th className={ui.th}>Tracking</th>
                <th className={ui.th}>When</th>
              </tr>
            </thead>
            <tbody className={ui.rTbody}>
              {orders.map((o) => (
                <tr key={o._id} className={cx(ui.rowHover, ui.rTr)}>
                  <td data-label="Artist" className={ui.rTd}>
                    <span className="font-medium text-[#c2d0dc]">
                      {o.artistId ? displayName(o.artistId) : '—'}
                    </span>
                    <span className={cx('block text-xs', ui.mut)}>
                      @{o.artistId?.username}
                    </span>
                  </td>
                  <td data-label="Artwork" className={cx(ui.rTd, ui.mut)}>
                    {o.items?.map((i) => i.title).join(', ') || '—'}
                    <span className="block text-[10px] uppercase tracking-widest text-[#5c7085]">
                      {o.track === 'pod' ? 'print' : 'original'}
                    </span>
                  </td>
                  <td data-label="Buyer" className={cx(ui.rTd, ui.mut)}>
                    {o.buyer?.name || '—'}
                    <span className={cx('block text-xs', ui.mut)}>
                      {o.buyer?.email}
                    </span>
                    {o.shipTo?.city && (
                      <span className="block text-[10px] text-[#5c7085]">
                        {o.shipTo.city}, {o.shipTo.pincode}
                      </span>
                    )}
                  </td>
                  <td data-label="Amount" className={cx(ui.rTd, 'tabular-nums')}>
                    {formatINR(o.amount?.total, o.currency)}
                  </td>
                  <td data-label="Payment" className={ui.rTd}>
                    <span
                      className={cx(
                        'rounded border px-2 py-0.5 text-[10px] uppercase tracking-widest',
                        o.paymentStatus === 'paid'
                          ? 'border-[#3ef2a1]/40 bg-[#3ef2a1]/10 text-[#3ef2a1]'
                          : o.paymentStatus === 'refunded'
                            ? 'border-[#ff6b6b]/40 bg-[#ff6b6b]/10 text-[#ff6b6b]'
                            : 'border-[#1b2c3d] text-[#8fa4b6]',
                      )}
                    >
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td data-label="Fulfilment" className={ui.rTd}>
                    <select
                      value={o.fulfilmentStatus}
                      disabled={savingId === o._id}
                      onChange={(e) => setStatus(o._id, e.target.value)}
                      className={cx(ui.select, 'max-w-[9.5rem]')}
                    >
                      {FULFILMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td data-label="Tracking" className={cx(ui.rTd, ui.mut)}>
                    {o.shipment?.awb ? (
                      o.shipment.trackingUrl ? (
                        <a
                          href={o.shipment.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={ui.cyan}
                        >
                          {o.shipment.awb}
                        </a>
                      ) : (
                        o.shipment.awb
                      )
                    ) : (
                      '—'
                    )}
                    {o.shipment?.courier && (
                      <span className="block text-[10px] text-[#5c7085]">
                        {o.shipment.courier}
                      </span>
                    )}
                  </td>
                  <td data-label="When" className={cx(ui.rTd, ui.mut)}>
                    {fmtDate(o.createdAt)}
                  </td>
                </tr>
              ))}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={8} className={cx(ui.rTdEmpty, ui.mut)}>
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="flex items-center justify-between text-xs">
        <span className={ui.mut}>
          Page <span className={cx('tabular-nums', ui.cyan)}>{page}</span> of{' '}
          <span className="tabular-nums">{totalPages}</span>
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={cx(ui.btn, 'disabled:opacity-40')}
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={cx(ui.btn, 'disabled:opacity-40')}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
