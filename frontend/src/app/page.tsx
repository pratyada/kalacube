'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';

const ART_DIMENSIONS = [
  {
    title: 'Handicraft',
    description:
      'Pottery, weaving, woodwork, metalcraft, textile arts, and traditional Indian crafts.',
    icon: '🏺',
    color: 'bg-amber-50 border-amber-200 text-amber-800',
  },
  {
    title: 'Visual Art',
    description:
      'Painting, sculpture, photography, digital art, mixed media, and installations.',
    icon: '🎨',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  {
    title: 'Performing Arts',
    description:
      'Dance, music, theatre, folk performances, and contemporary expressions.',
    icon: '🎭',
    color: 'bg-purple-50 border-purple-200 text-purple-800',
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-rose-50 via-white to-amber-50 py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              kala<span className="text-rose-500">CUBE</span>
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Where Art Meets Community
            </p>
            <p className="text-gray-500 max-w-2xl mx-auto mb-8">
              India&apos;s professional network for artists, curators, and art
              spaces across three dimensions of art — Handicraft, Visual Art,
              and Performing Arts.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/auth/register"
                className="bg-rose-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-rose-600 transition"
              >
                Join as an Artist
              </Link>
              <Link
                href="/explore"
                className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Explore Art
              </Link>
            </div>
          </div>
        </section>

        {/* 3 Dimensions */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10 text-gray-900">
              Three Dimensions of Art
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {ART_DIMENSIONS.map((dim) => (
                <div
                  key={dim.title}
                  className={`border rounded-xl p-6 ${dim.color}`}
                >
                  <div className="text-4xl mb-3">{dim.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{dim.title}</h3>
                  <p className="text-sm opacity-80">{dim.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who is it for */}
        <section className="bg-gray-50 py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10 text-gray-900">
              Built for the Art Community
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  role: 'Artists',
                  desc: 'Showcase your portfolio, connect with curators, and find exhibition opportunities.',
                },
                {
                  role: 'Curators',
                  desc: 'Discover talent, organize exhibitions, and build your curatorial practice.',
                },
                {
                  role: 'Art Spaces',
                  desc: 'List your gallery, host events, and connect with artists and curators.',
                },
                {
                  role: 'Art Lovers',
                  desc: 'Explore art, attend events, and follow your favourite artists.',
                },
              ].map((item) => (
                <div
                  key={item.role}
                  className="bg-white rounded-xl p-6 border border-gray-200"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {item.role}
                  </h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to showcase your art?
            </h2>
            <p className="text-gray-500 mb-6">
              Join thousands of Indian artists building their presence on
              kalaCUBE.
            </p>
            <Link
              href="/auth/register"
              className="inline-block bg-rose-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-rose-600 transition"
            >
              Get Started — It&apos;s Free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-white font-bold text-lg">
            kala<span className="text-rose-400">CUBE</span>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} kalaCUBE. Made in India.
          </p>
        </div>
      </footer>
    </>
  );
}
