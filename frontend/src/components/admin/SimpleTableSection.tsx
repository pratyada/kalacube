'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Panel, ui, cx } from './console';

interface Column {
  header: string;
  render: (row: Record<string, unknown>) => string;
}

export default function SimpleTableSection({
  title,
  endpoint,
  columns,
}: {
  title: string;
  endpoint: string;
  columns: Column[];
}) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(endpoint)
      .then(({ data }) => {
        const payload = data.data;
        setRows(Array.isArray(payload) ? payload : payload?.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [endpoint]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg uppercase tracking-[0.25em] text-[#c2d0dc]">
          {title}
        </h2>
        <p className={cx('mt-1 text-xs', ui.mut)}>
          <span className={cx('tabular-nums', ui.green)}>{rows.length}</span>{' '}
          record{rows.length === 1 ? '' : 's'}
        </p>
      </div>

      <Panel title={title.toUpperCase()} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className={ui.rTable}>
            <thead className={ui.rThead}>
              <tr>
                {columns.map((c) => (
                  <th key={c.header} className={ui.th}>
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={ui.rTbody}>
              {rows.map((row, i) => (
                <tr
                  key={(row._id as string) || i}
                  className={cx(ui.rowHover, ui.rTr)}
                >
                  {columns.map((c) => (
                    <td key={c.header} data-label={c.header} className={ui.rTd}>
                      {c.render(row) || '—'}
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className={cx(ui.rTdEmpty, ui.mut)}
                  >
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
