import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import VideoGridCard from "../components/VideoGridCard";

const PAGE_LIMIT = 20;

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchVideos() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_LIMIT)
        });
        const res = await fetch(`/api/videos/random?${params.toString()}`);
        if (!res.ok) throw new Error("error");
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items || [];
        if (!cancelled) {
          setVideos(items);
          setHasMore(data.hasMore ?? items.length === PAGE_LIMIT);
        }
      } catch (e) {
        if (!cancelled) setError("Failed to load videos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchVideos();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <>
      <Helmet>
        <title>Onlyfans Leaks Videos — FreeOF</title>
        <meta name="google-site-verification" content="mCHd-SkAoDEEm86xcniCou1FiExzOa7QpNdpybupTy0" />
        <meta
          name="description"
          content="Watch high quality porn videos and leaked OnlyFans content on FreeOF."
        />
        <link rel="canonical" href="https://freeof.pages.dev/" />
      </Helmet>

      <div className="flex items-center justify-between mb-6 px-4 sm:px-0 max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold">OF Videos</h1>
        <div className="flex bg-gray-800 rounded-full p-1 text-xs sm:text-sm">
          <button className="bg-blue-600 text-white rounded-full px-4 py-1">
            Random
          </button>
        </div>
      </div>

      <section className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto px-0">
          {loading && !videos.length && (
            <p className="text-gray-400 px-4 sm:px-0">Loading videos…</p>
          )}
          {error && !videos.length && (
            <p className="text-red-400 px-4 sm:px-0">{error}</p>
          )}
          {!loading &&
            !error &&
            videos.map((v) => <VideoGridCard key={v.id} video={v} />)}
        </div>
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
