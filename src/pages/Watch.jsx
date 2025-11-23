import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";

export default function Watch() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRel, setLoadingRel] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function fetchVideo() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/videos?id=${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        const item = Array.isArray(data)
          ? data[0]
          : (data.items && data.items[0]) || data;
        if (!cancelled) setVideo(item || null);
      } catch (e) {
        if (!cancelled) {
          setError("Failed to load video.");
          setVideo(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchVideo();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!video?.model_id) return;
    let cancelled = false;

    async function fetchRelated() {
      setLoadingRel(true);
      try {
        const res = await fetch(
          `/api/videos?model_id=${encodeURIComponent(
            video.model_id
          )}&limit=40&page=1&sort=recent`
        );
        if (!res.ok) throw new Error("Related API error");
        const data = await res.json();
        let items = Array.isArray(data) ? data : data.items || [];
        items = items.filter((v) => v.id !== video.id);
        items.sort(() => Math.random() - 0.5);
        items = items.slice(0, 8);
        if (!cancelled) setRelated(items);
      } catch {
        if (!cancelled) setRelated([]);
      } finally {
        if (!cancelled) setLoadingRel(false);
      }
    }

    fetchRelated();
    return () => {
      cancelled = true;
    };
  }, [video]);

  const title = video?.title || "Watch video";
  const src = video?.video_url || "";
  const thumb = video?.thumbnail_url || "";
  const modelName = video?.model_name || "";
  const modelSlug = video?.model_slug || "";

  return (
    <>
      <Helmet>
        <title>{title} — FreeOF</title>
        <meta
          name="description"
          content={
            modelName
              ? `Watch ${title} from ${modelName} on FreeOF.`
              : `Watch ${title} in HD on FreeOF.`
          }
        />
        {thumb && <meta property="og:image" content={thumb} />}
        <link
          rel="canonical"
          href={`https://freeof.pages.dev/watch/${encodeURIComponent(
            id || ""
          )}`}
        />
      </Helmet>

      <main className="max-w-6xl mx-auto px-4 sm:px-0">
        <section className="mb-8" id="videoSection">
          {loading && <p className="text-gray-400">Loading video…</p>}
          {error && !loading && (
            <p className="text-red-400">Failed to load video.</p>
          )}
          {!loading && !video && !error && (
            <p className="text-red-400">Video not found.</p>
          )}
          {video && (
            <>
              <div className="mb-3">
                <h1 className="text-2xl font-semibold mb-2">{title}</h1>
                {modelName && (
                  <p className="text-sm text-gray-400">{modelName}</p>
                )}
              </div>
              <video
                controls
                preload="metadata"
                poster={thumb}
                className="w-full rounded-xl bg-black"
              >
                <source src={src} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </>
          )}
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-semibold mb-3">More from this model</h2>
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4"
            id="relatedGrid"
          >
            {loadingRel && (
              <p className="text-gray-400 text-sm">Loading…</p>
            )}
            {!loadingRel && !related.length && (
              <p className="text-gray-400 text-sm col-span-full">
                No related videos found.
              </p>
            )}
            {related.map((v) => (
              <Link
                key={v.id}
                to={`/watch/${v.id}`}
                className="block bg-card rounded-xl overflow-hidden hover:scale-[1.02] transition"
              >
                <img
                  src={v.thumbnail_url || ""}
                  className="w-full h-28 object-cover"
                  alt={v.title || "Video"}
                />
                <div className="p-2">
                  <p className="text-[11px] font-semibold line-clamp-2">
                    {v.title || "Untitled"}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {modelSlug && (
            <div className="mt-2" id="seeAllWrap">
              <Link
                to={`/model/${encodeURIComponent(modelSlug)}`}
                className="inline-flex items-center px-4 py-2 rounded-full bg-blue-600 text-white text-sm hover:bg-blue-500"
              >
                See all videos
              </Link>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
