import React from "react";
import { Link } from "react-router-dom";

export default function VideoGridCard({ video }) {
  const title = video.title || "Untitled";
  const thumb = video.thumbnail_url || "";
  const modelName = video.model_name || "";
  const id = video.id;

  return (
    <Link
      to={`/watch/${id}`}
      className="block bg-card rounded-2xl overflow-hidden hover:scale-[1.02] transition"
    >
      <div className="relative w-full">
        <img
          src={thumb}
          alt={modelName}
          className="w-full h-72 md:h-80 object-cover"
        />
      </div>
      <div className="p-3">
        {modelName && (
          <p className="text-xs text-gray-400 mt-1">{modelName}</p>
        )}
      </div>
    </Link>
  );
}
