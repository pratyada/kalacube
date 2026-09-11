'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { ARTWORK_STATUSES, displayName, type AdminArtwork } from './types';
import { Panel, ui, cx } from './console';

const PAGE_SIZE = 25;

export default function ArtworksSection() {
  const [items, setItems] = useState<AdminArtwork[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/api/admin/artworks', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          page,
          limit: PAGE_SIZE,
        },
      })
      .then(({ data }) => {
        setItems(data.data?.items || []);
        setTotal(data.data?.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, statusFilter, page]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const setStatus = async (id: string, status: string) => {
    await api.patch(`/api/admin/artworks/${id}`, { status });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this artwork permanently?')) return;
    await api.delete(`/api/admin/artworks/${id}`);
    load();
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg uppercase tracking-[0.25em] text-[#c2d0dc]">
            Artworks
          </h2>
          <p className={cx('mt-1 text-xs', ui.mut)}>
            <span className={cx('tabular-nums', ui.green)}>{total}</span> artwork
            {total === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title…"
            className={cx(ui.input, 'w-full sm:w-72')}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={ui.select}
          >
            <option value="">All statuses</option>
            {ARTWORK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Panel title="ARTWORK CATALOG" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className={ui.rTable}>
            <thead className={ui.rThead}>
              <tr>
                <th className={ui.th}>Thumb</th>
                <th className={ui.th}>Artwork</th>
                <th className={ui.th}>Artist</th>
                <th className={ui.th}>Status</th>
                <th className={ui.th}></th>
              </tr>
            </thead>
            <tbody className={ui.rTbody}>
              {items.map((w) => (
                <tr key={w._id} className={cx(ui.rowHover, ui.rTr)}>
                  <td data-label="Thumb" className={ui.rTd}>
                    {w.images && w.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={w.images[0]}
                        alt={w.title || 'artwork'}
                        className="h-12 w-12 rounded border border-[#1b2c3d] bg-[#0a1119] object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded border border-[#1b2c3d] bg-[#0a1119] text-[9px] uppercase tracking-widest text-[#3d5266]">
                        no img
                      </div>
                    )}
                  </td>
                  <td
                    data-label="Artwork"
                    className={cx(ui.rTd, 'font-medium text-[#c2d0dc]')}
                  >
                    {w.title || 'Untitled'}
                  </td>
                  <td data-label="Artist" className={cx(ui.rTd, ui.mut)}>
                    {w.artist ? displayName(w.artist) : '—'}
                  </td>
                  <td data-label="Status" className={ui.rTd}>
                    <select
                      value={w.status || ''}
                      onChange={(e) => setStatus(w._id, e.target.value)}
                      className={ui.select}
                    >
                      {!w.status && <option value="">—</option>}
                      {ARTWORK_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td data-label="Actions" className={ui.rTd}>
                    <button
                      onClick={() => remove(w._id)}
                      className={ui.btnDanger}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className={cx(ui.rTdEmpty, ui.mut)}
                  >
                    No artworks found.
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
