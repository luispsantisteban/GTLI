import Image from "next/image";
import Link from "next/link";

const HERO = "https://images.unsplash.com/photo-1625316708582-7c38734be31d?auto=format&fit=crop&w=1200&q=80";

const photos = [
  {
    src: "https://images.unsplash.com/photo-1580579674179-931317ab63fc?auto=format&fit=crop&w=800&q=80",
    alt: "Max running on grass",
  },
  {
    src: "https://images.unsplash.com/photo-1581351877917-fd4b965ead15?auto=format&fit=crop&w=800&q=80",
    alt: "Max posing",
  },
  {
    src: "https://images.unsplash.com/photo-1585943870180-be99fca07f23?auto=format&fit=crop&w=800&q=80",
    alt: "Max as a puppy",
  },
];

const facts = [
  { emoji: "🐾", label: "Breed", value: "Miniature Schnauzer" },
  { emoji: "👑", label: "Gender", value: "Girl" },
  { emoji: "🎨", label: "Coat", value: "Salt & Pepper" },
  { emoji: "❤️", label: "Personality", value: "Playful & Loving" },
  { emoji: "🏃", label: "Favourite activity", value: "Zoomies" },
  { emoji: "🍖", label: "Favourite treat", value: "Anything, honestly" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-amber-50 font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-bold text-amber-900">Max 🐶</span>
        <Link
          href="/bookmarks"
          className="rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-800 transition hover:bg-amber-200"
        >
          Bookmarks
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative mx-4 mb-16 overflow-hidden rounded-3xl shadow-xl sm:mx-8 lg:mx-16" style={{ height: "70vh", minHeight: 400 }}>
        <Image
          src={HERO}
          alt="Max the Schnauzer"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 text-white">
          <p className="mb-1 text-sm font-medium uppercase tracking-widest text-amber-300">Meet</p>
          <h1 className="text-6xl font-black leading-none sm:text-8xl">Max</h1>
          <p className="mt-2 text-lg text-white/80">The cutest Schnauzer girl in the world</p>
        </div>
      </section>

      {/* About */}
      <section className="mx-auto mb-20 max-w-3xl px-6 text-center">
        <h2 className="mb-4 text-3xl font-bold text-amber-900">About Max</h2>
        <p className="text-lg leading-relaxed text-amber-800">
          Max is a miniature Schnauzer with an oversized personality. She rules every room she
          walks into, melts hearts with a single look, and somehow always knows when it&apos;s
          snack time. Life is simply better with Max in it.
        </p>
      </section>

      {/* Facts */}
      <section className="mb-20 bg-white px-6 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-3xl font-bold text-amber-900">Fun Facts</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {facts.map((f) => (
              <div
                key={f.label}
                className="flex flex-col items-center rounded-2xl bg-amber-50 p-5 text-center shadow-sm"
              >
                <span className="mb-2 text-3xl">{f.emoji}</span>
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-500">{f.label}</p>
                <p className="mt-1 font-medium text-amber-900">{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="mx-auto mb-20 max-w-5xl px-6">
        <h2 className="mb-8 text-center text-3xl font-bold text-amber-900">Gallery</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {photos.map((p) => (
            <div key={p.src} className="relative aspect-square overflow-hidden rounded-2xl shadow-md">
              <Image
                src={p.src}
                alt={p.alt}
                fill
                className="object-cover transition duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="pb-10 text-center text-sm text-amber-400">
        Made with love for Max &hearts;
      </footer>
    </div>
  );
}
