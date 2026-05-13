import Link from "next/link";
import { getBookmarks, addBookmark, deleteBookmark, Bookmark } from "@/app/actions/bookmarks";

export const dynamic = "force-dynamic";

function BookmarkCard({ bookmark }: { bookmark: Bookmark }) {
  const deleteWithId = deleteBookmark.bind(null, bookmark.id);
  const domain = (() => {
    try { return new URL(bookmark.url).hostname; } catch { return ""; }
  })();

  return (
    <div className="group flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md">
      {domain && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
          alt=""
          width={20}
          height={20}
          className="mt-1 shrink-0 rounded"
        />
      )}
      <div className="min-w-0 flex-1">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-gray-900 hover:text-blue-600 truncate block"
        >
          {bookmark.title}
        </a>
        {bookmark.description && (
          <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">{bookmark.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-400 truncate">{bookmark.url}</p>
      </div>
      <form action={deleteWithId} className="shrink-0">
        <button
          type="submit"
          className="rounded p-1 text-gray-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
          aria-label="Delete bookmark"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </form>
    </div>
  );
}

export default async function BookmarksPage() {
  const bookmarks = await getBookmarks();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Back to Max</Link>
          <h1 className="text-3xl font-bold text-gray-900">Bookmarks</h1>
        </div>

        <form
          action={addBookmark}
          className="mb-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="My favourite article"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label htmlFor="url" className="mb-1 block text-sm font-medium text-gray-700">
                URL <span className="text-red-500">*</span>
              </label>
              <input
                id="url"
                name="url"
                type="url"
                required
                placeholder="https://example.com"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              placeholder="Why are you saving this?"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-95"
          >
            Save bookmark
          </button>
        </form>

        {bookmarks.length === 0 ? (
          <p className="text-center text-gray-400">No bookmarks yet. Add one above.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {bookmarks.map((b) => (
              <BookmarkCard key={b.id} bookmark={b} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
