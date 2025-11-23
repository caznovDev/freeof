import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

export default function ModelPage() {
  const { slug } = useParams();
  const [model, setModel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loadingModel, setLoadingModel] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState({});

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    async function fetchModel() {
      setLoadingModel(true);
      try {
        const res = await fetch(`/api/models?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error("Model API error");
        const data = await res.json();
        const item = Array.isArray(data)
          ? data[0]
          : (data.items && data.items[0]) || data;
        if (!cancelled) setModel(item || null);
      } catch (e) {
        if (!cancelled) {
          setError("Failed to load model.");
          setModel(null);
        }
      } finally {
        if (!cancelled) setLoadingModel(false);
      }
    }

    async function fetchVideos() {
      setLoadingVideos(true);
      try {
        const res = await fetch(
          `/api/videos?model_slug=${encodeURIComponent(
            slug
          )}&page=1&limit=200&sort=recent`
        );
        if (!res.ok) throw new Error("Videos API error");
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items || [];
        if (!cancelled) setVideos(items);
      } catch (e) {
        if (!cancelled) setError("Failed to load videos.");
      } finally {
        if (!cancelled) setLoadingVideos(false);
      }
    }

    fetchModel();
    fetchVideos();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const name = model?.display_name || model?.slug || "Model";
  const avatar = model?.avatar_url || model?.banner_url || "";
  const createdAt = formatDate(model?.created_at);
  const mainPoster = avatar;

  const onThumbClick = (video) => {
    if (!video.id) return;
    setPlaying((prev) => ({ ...prev, [video.id]: true }));
  };

  return (
    <>
      <Helmet>
        <title>Free {name} OnlyFans Videos — FreeOF</title>
        <meta
          name="description"
          content={`Watch all leaked OnlyFans videos from ${name} on FreeOF. Packs, leaks and HD content.`}
        />
        <meta
          name="keywords"
          content={`${name}, FreeOF, OnlyFans videos, leaked OnlyFans, free OnlyFans pack`}
        />
        <meta property="og:title" content={`${name} OnlyFans — FreeOF`} />
        {mainPoster && <meta property="og:image" content={mainPoster} />}
        {mainPoster && <meta name="twitter:image" content={mainPoster} />}
        <link
          rel="canonical"
          href={`https://freeof.pages.dev/model/${encodeURIComponent(
            slug || ""
          )}`}
        />
      </Helmet>

      <main className="flex-1 mx-auto pt-0 w-full">
        <header className="flex flex-col sm:flex-row items-center sm:items-end gap-4 border-b border-gray-800 pb-4 mb-6 px-4 sm:px-6 max-w-5xl mx-auto">
          {loadingModel && <p className="text-gray-400">Loading model…</p>}
          {!loadingModel && !model && (
            <h1 className="text-xl text-red-400">Model not found.</h1>
          )}
          {model && (
            <>
              <img
                src={avatar}
                alt={name}
                className="w-24 h-24 rounded-full object-cover"
                loading="lazy"
              />
              <div>
                <h1 className="text-3xl font-bold text-white">{name}</h1>
                <p className="text-sm text-gray-400">
                  {createdAt ? createdAt : ""}
                </p>
              </div>
            </>
          )}
        </header>

        <section className="max-w-5xl mx-auto px-0">
          {loadingVideos && (
            <p className="text-gray-400 px-4 sm:px-0">Loading videos…</p>
          )}
          {error && !loadingVideos && (
            <p className="text-red-400 px-4 sm:px-0">{error}</p>
          )}
          {!loadingVideos &&
            !error &&
            videos.map((v) => {
              const videoUrl = v.video_url || "";
              const posterUrl = v.thumbnail_url || avatar || "";
              const title = v.title || "";
              const isPlaying = !!playing[v.id];

              return (
                <div
                  key={v.id}
                  className="px-4 sm:px-0 mb-5 cursor-pointer"
                  onClick={() => onThumbClick(v)}
                >
                  {!isPlaying && (
                    <div className="relative group thumb-wrapper">
                      <img
                        src={posterUrl}
                        alt={title}
                        className="w-full rounded-xl object-cover bg-black"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-black/80 transition">
                          <div className="ml-1 w-0 h-0 border-t-[10px] border-b-[10px] border-l-[16px] border-t-transparent border-b-transparent border-l-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  {isPlaying && (
                    <video
                      controls
                      preload="none"
                      poster={posterUrl}
                      className="w-full rounded-xl bg-black"
                      autoPlay
                    >
                      <source src={videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              );
            })}

          {!loadingVideos && !videos.length && !error && (
            <p className="text-gray-400 px-4 sm:px-0">
              No videos found for this model.
            </p>
          )}
        </section>
      </main>
    </>
  );
}
