'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

const ROLES = ['user', 'artist', 'curator', 'art-space', 'admin', 'superadmin'];

export default function AdminPage() {
  const { user, isLoading, fetchUser } = useAuthStore();
  const [tab, setTab] = useState<'overview' | 'users' | 'artworks'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [uSearch, setUSearch] = useState('');
  const [aSearch, setASearch] = useState('');

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const isAdmin = user && ['admin', 'superadmin'].includes(user.role);

  const loadStats = useCallback(() => {
    api.get('/api/admin/stats').then(({ data }) => setStats(data.data)).catch(() => {});
  }, []);
  const loadUsers = useCallback(() => {
    api.get('/api/admin/users', { params: { search: uSearch || undefined, limit: 50 } })
      .then(({ data }) => setUsers(data.data?.items || [])).catch(() => {});
  }, [uSearch]);
  const loadArtworks = useCallback(() => {
    api.get('/api/admin/artworks', { params: { search: aSearch || undefined, limit: 50 } })
      .then(({ data }) => setArtworks(data.data?.items || [])).catch(() => {});
  }, [aSearch]);

  useEffect(() => { if (isAdmin) loadStats(); }, [isAdmin, loadStats]);
  useEffect(() => { if (isAdmin && tab === 'users') { const t = setTimeout(loadUsers, 250); return () => clearTimeout(t); } }, [isAdmin, tab, loadUsers]);
  useEffect(() => { if (isAdmin && tab === 'artworks') { const t = setTimeout(loadArtworks, 250); return () => clearTimeout(t); } }, [isAdmin, tab, loadArtworks]);

  const setUserRole = async (id: string, role: string) => {
    await api.patch(`/api/admin/users/${id}`, { role }); loadUsers(); loadStats();
  };
  const toggleActive = async (id: string, isActive: boolean) => {
    await api.patch(`/api/admin/users/${id}`, { isActive }); loadUsers();
  };
  const setArtworkStatus = async (id: string, status: string) => {
    await api.patch(`/api/admin/artworks/${id}`, { status }); loadArtworks();
  };
  const deleteArtwork = async (id: string) => {
    if (!confirm('Delete this artwork permanently?')) return;
    await api.delete(`/api/admin/artworks/${id}`); loadArtworks(); loadStats();
  };

  if (isLoading) return <div className="min-h-screen bg-[#faf8f5] p-10 text-neutral-600">Loading…</div>;
  if (!isAdmin)
    return (
      <div className="min-h-screen bg-[#faf8f5] p-10 text-center">
        <h1 className="font-serif text-3xl">Admin access required</h1>
        <p className="mt-3 text-neutral-600">Sign in with an admin account to manage KalaCUBE.</p>
        <Link href="/auth/login" className="mt-6 inline-block rounded-full bg-[#111] px-6 py-3 text-sm font-semibold text-white">Sign in</Link>
      </div>
    );

  const STAT_CARDS = stats ? [
    { label: 'Users', value: stats.totalUsers }, { label: 'Artists', value: stats.artists },
    { label: 'Artworks', value: stats.artworks }, { label: 'Submitted', value: stats.submitted },
    { label: 'Art Spaces', value: stats.artspaces }, { label: 'Events', value: stats.events },
    { label: 'Categories', value: stats.artstyles },
  ] : [];

  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-4xl">Admin</h1>
          <span className="text-sm text-neutral-500">Signed in as {user.email} · {user.role}</span>
        </div>

        <div className="mt-6 flex gap-2 border-b border-neutral-200">
          {(['overview', 'users', 'artworks'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm capitalize transition ${tab === t ? 'border-b-2 border-[#a06f1e] font-semibold text-[#a06f1e]' : 'text-neutral-500 hover:text-neutral-900'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {STAT_CARDS.map((c) => (
              <div key={c.label} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="text-3xl font-semibold text-[#a06f1e]">{c.value ?? '—'}</div>
                <div className="mt-1 text-sm text-neutral-500">{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <div className="mt-6">
            <input value={uSearch} onChange={(e) => setUSearch(e.target.value)} placeholder="Search users…"
              className="mb-4 w-full max-w-sm rounded-full border border-neutral-300 px-4 py-2 text-sm outline-none focus:border-[#a06f1e]" />
            <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-neutral-500">
                  <tr><th className="p-3">User</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Active</th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-t border-neutral-100">
                      <td className="p-3 font-medium">{`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username}<div className="text-xs text-neutral-400">@{u.username}</div></td>
                      <td className="p-3 text-neutral-600">{u.email}</td>
                      <td className="p-3">
                        <select value={u.role} onChange={(e) => setUserRole(u._id, e.target.value)}
                          className="rounded border border-neutral-300 px-2 py-1 text-xs">
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="p-3">
                        <button onClick={() => toggleActive(u._id, !u.isActive)}
                          className={`rounded-full px-3 py-1 text-xs ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-500'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ARTWORKS */}
        {tab === 'artworks' && (
          <div className="mt-6">
            <input value={aSearch} onChange={(e) => setASearch(e.target.value)} placeholder="Search artworks…"
              className="mb-4 w-full max-w-sm rounded-full border border-neutral-300 px-4 py-2 text-sm outline-none focus:border-[#a06f1e]" />
            <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-neutral-500">
                  <tr><th className="p-3">Artwork</th><th className="p-3">Artist</th><th className="p-3">Status</th><th className="p-3">Img</th><th className="p-3"></th></tr>
                </thead>
                <tbody>
                  {artworks.map((w) => (
                    <tr key={w._id} className="border-t border-neutral-100">
                      <td className="p-3 font-medium">{w.title || 'Untitled'}</td>
                      <td className="p-3 text-neutral-600">{w.artist?.username || '—'}</td>
                      <td className="p-3">
                        <select value={w.status || ''} onChange={(e) => setArtworkStatus(w._id, e.target.value)}
                          className="rounded border border-neutral-300 px-2 py-1 text-xs">
                          {['submitted', 'draft', 'hidden'].map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="p-3 text-neutral-500">{(w.images || []).length}</td>
                      <td className="p-3">
                        <button onClick={() => deleteArtwork(w._id)} className="text-xs text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
