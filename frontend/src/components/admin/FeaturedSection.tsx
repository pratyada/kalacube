'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { displayName, type AdminUser } from './types';
import { ui, cx } from './console';

export default function FeaturedSection() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/api/admin/featured')
      .then(({ data }) => setItems(data.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unfeature = async (id: string) => {
    await api.patch(`/api/admin/users/${id}`, { isFeatured: false });
    load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg uppercase tracking-[0.25em] text-[#c2d0dc]">
          Featured Artists
        </h2>
        <p className={cx('mt-1 text-xs', ui.mut)}>
          <span className={cx('tabular-nums', ui.amber)}>{items.length}</span>{' '}
          highlighted artist{items.length === 1 ? '' : 's'}
        </p>
      </div>

      {!loading && items.length === 0 && (
        <p
          className={cx(
            'rounded-md border border-dashed border-[#1b2c3d] bg-[#0a1119] p-8 text-center text-sm',
            ui.mut,
          )}
        >
          No featured artists yet. Feature artists from the Artists tab.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((u) => (
          <div
            key={u._id}
            className={cx(ui.panel, 'overflow-hidden')}
          >
            <div className="flex h-32 items-center justify-center border-b border-[#132030] bg-[#080d13]">
              {u.avatar?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={u.avatar.url}
                  alt={displayName(u)}
                  className="h-20 w-20 rounded-full border border-[#1b2c3d] object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#3ef2a1]/40 bg-[#3ef2a1]/10 text-2xl font-semibold text-[#3ef2a1]">
                  {displayName(u).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="truncate text-base text-[#c2d0dc]">
                {displayName(u)}
              </div>
              <div className={cx('truncate text-xs', ui.mut)}>
                @{u.username}
              </div>
              {u.location?.city && (
                <div className={cx('mt-1 truncate text-xs', ui.cyan)}>
                  {[u.location.city, u.location.country]
                    .filter(Boolean)
                    .join(', ')}
                </div>
              )}
              <button
                onClick={() => unfeature(u._id)}
                className={cx(ui.btnDanger, 'mt-3 w-full')}
              >
                Un-feature
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
