import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import ModelCard from "../components/ModelCard";

const PAGE_LIMIT = 12;

export default function Models() {
  const [models, setModels] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchModels() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_LIMIT),
          sort: "recent"
        });
        const res = await fetch(`/api/models?${params.toString()}`);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items || [];
        if (!cancelled) {
          setModels(items);
          setHasMore(data.hasMore ?? items.length === PAGE_LIMIT);
        }
      } catch (e) {
        if (!cancelled) setError("Failed to load models.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchModels();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <>
      <Helmet>
        <title>OnlyFans Models Directory — FreeOF</title>
        <meta
          name="description"
          content="Browse the FreeOF directory of OnlyFans models and open their full leaked packs and videos."
        />
        <link rel="canonical" href="https://freeof.pages.dev/onlyf" />
      </Helmet>

      <header className="max-w-5xl mx-auto px-4 sm:px-0 mb-6">
        <h1 className="text-3xl font-bold mb-2">OnlyFans Models</h1>
        <p className="text-sm text-gray-400">
          Discover top OnlyFans creators and open all their leaked videos in one
          place.
        </p>
      </header>

      <section className="max-w-5xl mx-auto px-0 space-y-5">
        {loading && !models.length && (
          <p className="text-gray-400 px-4 sm:px-0">Loading models…</p>
        )}
        {error && !models.length && (
          <p className="text-red-400 px-4 sm:px-0">{error}</p>
        )}
        {!loading &&
          !error &&
          models.map((m) => <ModelCard key={m.id} model={m} />)}
      </section>

      <div className="flex justify-center items-center space-x-2 mt-8">
        <button
          className="px-3 py-1 rounded bg-gray-900 text-gray-300 hover:bg-blue-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
        >
          &lt;
        </button>
        <span className="px-3 py-1 rounded bg-blue-600 text-white">{page}</span>
        <button
          className="px-3 py-1 rounded bg-gray-900 text-gray-300 hover:bg-blue-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasMore || loading}
        >
          &gt;
        </button>
      </div>
    </>
  );
}
