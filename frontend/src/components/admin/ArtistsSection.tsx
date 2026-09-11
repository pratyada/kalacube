'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { ROLES, displayName, type AdminUser } from './types';
import { Panel, ui, cx } from './console';

const PAGE_SIZE = 25;

export default function ArtistsSection() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/api/admin/users', {
        params: {
          search: search || undefined,
          role: roleFilter || undefined,
          page,
          limit: PAGE_SIZE,
        },
      })
      .then(({ data }) => {
        setUsers(data.data?.items || []);
        setTotal(data.data?.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, roleFilter, page]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  // Reset to page 1 when filters change.
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  const patch = async (id: string, body: Partial<AdminUser>) => {
    await api.patch(`/api/admin/users/${id}`, body);
    load();
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg uppercase tracking-[0.25em] text-[#c2d0dc]">
            Artists &amp; Users
          </h2>
          <p className={cx('mt-1 text-xs', ui.mut)}>
            <span className={cx('tabular-nums', ui.green)}>{total}</span> record
            {total === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, username, email…"
            className={cx(ui.input, 'w-full sm:w-72')}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={ui.select}
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Panel title="USER REGISTRY" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className={ui.rTable}>
            <thead className={ui.rThead}>
              <tr>
                <th className={ui.th}>User</th>
                <th className={ui.th}>Email</th>
                <th className={ui.th}>Role</th>
                <th className={ui.th}>Active</th>
                <th className={ui.th}>Featured</th>
              </tr>
            </thead>
            <tbody className={ui.rTbody}>
              {users.map((u) => (
                <tr key={u._id} className={cx(ui.rowHover, ui.rTr)}>
                  <td data-label="User" className={ui.rTd}>
                    <span className="text-left max-sm:text-right">
                      <span className="font-medium text-[#c2d0dc]">
                        {displayName(u)}
                      </span>
                      <span className={cx('block text-xs', ui.mut)}>
                        @{u.username}
                      </span>
                    </span>
                  </td>
                  <td data-label="Email" className={cx(ui.rTd, ui.mut)}>
                    {u.email}
                  </td>
                  <td data-label="Role" className={ui.rTd}>
                    <select
                      value={u.role}
                      onChange={(e) => patch(u._id, { role: e.target.value })}
                      className={ui.select}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td data-label="Active" className={ui.rTd}>
                    <button
                      onClick={() => patch(u._id, { isActive: !u.isActive })}
                      className={cx(
                        'rounded border px-2.5 py-1 text-[10px] uppercase tracking-widest transition',
                        u.isActive
                          ? 'border-[#3ef2a1]/40 bg-[#3ef2a1]/10 text-[#3ef2a1]'
                          : 'border-[#3a1e22] bg-[#ff6b6b]/5 text-[#ff6b6b]',
                      )}
                    >
                      {u.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td data-label="Featured" className={ui.rTd}>
                    <button
                      onClick={() => patch(u._id, { isFeatured: !u.isFeatured })}
                      className={cx(
                        'rounded border px-2.5 py-1 text-[10px] uppercase tracking-widest transition',
                        u.isFeatured
                          ? 'border-[#f5c451]/50 bg-[#f5c451]/10 text-[#f5c451]'
                          : 'border-[#1b2c3d] text-[#8fa4b6] hover:border-[#3ef2a1] hover:text-[#3ef2a1]',
                      )}
                    >
                      {u.isFeatured ? '★ Featured' : 'Feature'}
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className={cx(ui.rTdEmpty, ui.mut)}
                  >
                    No users found.
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
