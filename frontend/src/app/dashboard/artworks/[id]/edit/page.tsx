'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

interface MyArtwork {
  _id: string;
  title?: string;
  description?: string;
  medium?: string;
  material?: string;
  theme?: string;
  cost?: number;
  currency?: string;
  available?: boolean;
  dimensions?: { height?: number; width?: number };
  images?: string[];
}

const field =
  'w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-[#202f9a] focus:ring-2 focus:ring-[#202f9a]/30';

export default function EditArtworkPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, isLoading, isAuthenticated, fetchUser } = useAuthStore();

  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
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
    available: true,
  });
  // Existing S3 image URLs the artist still wants to keep.
  const [keptImages, setKeptImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
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

  // Prefill from the owner-scoped list (guarantees ownership + all fields).
  useEffect(() => {
    if (!isAuthenticated || !id) return;
    api
      .get('/api/artworks/mine')
      .then((res) => {
        const items: MyArtwork[] = res.data?.data?.items ?? [];
        const art = items.find((a) => a._id === id);
        if (!art) {
          setNotFound(true);
          setLoaded(true);
          return;
        }
        setForm({
          title: art.title ?? '',
          description: art.description ?? '',
          medium: art.medium ?? '',
          material: art.material ?? '',
          theme: art.theme ?? '',
          cost: art.cost != null ? String(art.cost) : '',
          currency: art.currency || 'INR',
          heightCm: art.dimensions?.height ? String(art.dimensions.height) : '',
          widthCm: art.dimensions?.width ? String(art.dimensions.width) : '',
          available: art.available !== false,
        });
        setKeptImages(art.images ?? []);
        setLoaded(true);
      })
      .catch(() => {
        setNotFound(true);
        setLoaded(true);
      });
  }, [isAuthenticated, id]);

  const onPick = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).slice(0, 8);
    setNewFiles(arr);
    setNewPreviews(arr.map((f) => URL.createObjectURL(f)));
  };

  const removeExisting = (url: string) =>
    setKeptImages((cur) => cur.filter((u) => u !== url));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) {
      setError('Give your artwork a title.');
      return;
    }
    if (keptImages.length === 0 && newFiles.length === 0) {
      setError('Keep at least one image or add a new one.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('description', form.description);
      fd.append('medium', form.medium);
      fd.append('material', form.material);
      fd.append('theme', form.theme);
      fd.append('currency', form.currency);
      fd.append('available', form.available ? 'true' : 'false');
      if (form.cost) fd.append('cost', form.cost);
      if (form.heightCm) fd.append('heightCm', form.heightCm);
      if (form.widthCm) fd.append('widthCm', form.widthCm);
      // Which existing images to keep (removals are the ones NOT listed).
      fd.append('keepImages', JSON.stringify(keptImages));
      // Any brand-new images to upload and append.
      newFiles.forEach((f) => fd.append('images', f));

      await api.patch(`/api/artworks/${id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      router.push('/dashboard/artworks');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message || 'Save failed. Please try again.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !loaded) {
    return (
      <main className="min-h-screen bg-[#faf7f2] px-4 py-10 text-neutral-900">
        <div className="mx-auto max-w-2xl">
          <p className="text-neutral-500">Loading…</p>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-[#faf7f2] px-4 py-10 text-neutral-900">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/dashboard/artworks"
            className="text-sm text-[#202f9a] hover:underline"
          >
            ← Back to my artworks
          </Link>
          <h1 className="mt-3 font-serif text-3xl">Artwork not found</h1>
          <p className="mt-2 text-neutral-600">
            This artwork doesn’t exist or isn’t yours to edit.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf7f2] px-4 py-10 text-neutral-900">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard/artworks"
          className="text-sm text-[#202f9a] hover:underline"
        >
          ← Back to my artworks
        </Link>
        <h1 className="mt-3 font-serif text-4xl">Edit artwork</h1>
        <p className="mt-2 text-neutral-600">
          Fix the title, details, or images. Changes go live right away.
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

          {/* Current images with remove controls */}
          <div>
            <p className="mb-1 block text-sm font-medium">Current images</p>
            {keptImages.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {keptImages.map((url) => (
                  <div key={url} className="group relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt="artwork"
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeExisting(url)}
                      aria-label="Remove image"
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm transition hover:bg-red-600 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-neutral-300 bg-white px-3 py-4 text-sm text-neutral-500">
                All existing images removed — add at least one below.
              </p>
            )}
          </div>

          {/* Add new images */}
          <div>
            <p className="mb-1 block text-sm font-medium">Add images</p>
            <label className="flex min-h-[44px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#202f9a]/40 bg-white px-4 py-6 text-center transition hover:border-[#202f9a] hover:bg-[#202f9a]/5">
              <span className="text-sm font-semibold text-[#202f9a]">
                Tap to choose images
              </span>
              <span className="text-xs text-neutral-500">
                up to 8 — these are added to the ones you keep
              </span>
              {newFiles.length > 0 && (
                <span className="mt-1 rounded-full bg-[#202f9a]/10 px-3 py-1 text-xs font-medium text-[#202f9a]">
                  {newFiles.length} new image{newFiles.length === 1 ? '' : 's'}
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => onPick(e.target.files)}
                className="sr-only"
              />
            </label>
            {newPreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {newPreviews.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt={`new preview ${i + 1}`}
                    className="aspect-square w-full rounded-lg object-cover ring-2 ring-[#FFD200]"
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className={field}
              placeholder="Materials, inspiration, story…"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                onChange={(e) =>
                  setForm({ ...form, material: e.target.value })
                }
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

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
              <label className="mb-1 block text-sm font-medium">
                Height (cm)
              </label>
              <input
                type="number"
                min={0}
                value={form.heightCm}
                onChange={(e) =>
                  setForm({ ...form, heightCm: e.target.value })
                }
                className={field}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Width (cm)
              </label>
              <input
                type="number"
                min={0}
                value={form.widthCm}
                onChange={(e) => setForm({ ...form, widthCm: e.target.value })}
                className={field}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) =>
                setForm({ ...form, available: e.target.checked })
              }
              className="h-4 w-4 rounded border-neutral-300 text-[#202f9a] focus:ring-[#202f9a]"
            />
            Available for sale / enquiry
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-full bg-[#0b1f52] py-3 text-sm font-semibold text-white transition hover:bg-[#202f9a] disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <Link
              href="/dashboard/artworks"
              className="rounded-full border border-neutral-300 px-6 py-3 text-center text-sm font-semibold text-neutral-700 transition hover:bg-white"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
