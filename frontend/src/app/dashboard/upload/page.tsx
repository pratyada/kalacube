'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

export default function UploadArtworkPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, fetchUser } = useAuthStore();
  const [form, setForm] = useState({
    title: '',
    description: '',
    medium: '',
    material: '',
    theme: '',
    cost: '',
    currency: 'INR',
    heightCm: '',
    widthCm: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.replace('/auth/login');
    else if (user?.isNewUser) router.replace('/onboarding');
  }, [isLoading, isAuthenticated, user, router]);

  const onPick = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).slice(0, 8);
    setFiles(arr);
    setPreviews(arr.map((f) => URL.createObjectURL(f)));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) {
      setError('Give your artwork a title.');
      return;
    }
    if (files.length === 0) {
      setError('Add at least one image.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      if (form.description) fd.append('description', form.description);
      if (form.medium) fd.append('medium', form.medium);
      if (form.material) fd.append('material', form.material);
      if (form.theme) fd.append('theme', form.theme);
      if (form.cost) fd.append('cost', form.cost);
      fd.append('currency', form.currency);
      if (form.heightCm) fd.append('heightCm', form.heightCm);
      if (form.widthCm) fd.append('widthCm', form.widthCm);
      files.forEach((f) => fd.append('images', f));

      const { data } = await api.post('/api/artworks', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const id = data?.data?._id;
      router.push(id ? `/art-work/${id}` : '/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message || 'Upload failed. Please try again.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  const field =
    'w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-[#202f9a] focus:ring-2 focus:ring-[#202f9a]/30';

  return (
    <main className="min-h-screen bg-[#faf7f2] px-4 py-10 text-neutral-900">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="text-sm text-[#202f9a] hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-3 font-serif text-4xl">Upload artwork</h1>
        <p className="mt-2 text-neutral-600">
          Share a new piece with the KalaCUBE community.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={field}
              placeholder="Untitled No. 4"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Images *</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => onPick(e.target.files)}
              className="block w-full text-sm text-neutral-600 file:mr-4 file:rounded-full file:border-0 file:bg-[#202f9a]/20 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#202f9a] hover:file:bg-[#202f9a]/40"
            />
            {previews.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {previews.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt={`preview ${i + 1}`}
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className={field}
              placeholder="Materials, inspiration, story…"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Medium</label>
              <input
                value={form.medium}
                onChange={(e) => setForm({ ...form, medium: e.target.value })}
                className={field}
                placeholder="Oil on canvas"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Material</label>
              <input
                value={form.material}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
                className={field}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Theme</label>
              <input
                value={form.theme}
                onChange={(e) => setForm({ ...form, theme: e.target.value })}
                className={field}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Price</label>
              <input
                type="number"
                min={0}
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className={field}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Height (cm)</label>
              <input
                type="number"
                min={0}
                value={form.heightCm}
                onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                className={field}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Width (cm)</label>
              <input
                type="number"
                min={0}
                value={form.widthCm}
                onChange={(e) => setForm({ ...form, widthCm: e.target.value })}
                className={field}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-[#0b1f52] py-3 text-sm font-semibold text-white transition hover:bg-[#202f9a] disabled:opacity-60"
          >
            {saving ? 'Publishing…' : 'Publish artwork'}
          </button>
        </form>
      </div>
    </main>
  );
}
