import React from "react";
import { Link } from "react-router-dom";

export default function ModelCard({ model }) {
  const slug = model.slug || "";
  const name = model.display_name || slug || "Unknown model";
  const avatar = model.avatar_url || model.banner_url || "";

  return (
    <Link
      to={`/model/${encodeURIComponent(slug)}`}
      className="block max-w-5xl mx-auto rounded-3xl overflow-hidden bg-card border border-pink-500/70"
    >
      <div className="w-full bg-black">
        <img
          src={avatar}
          alt={name}
          className="w-full object-cover"
          style={{ maxHeight: 420 }}
        />
      </div>
      <div className="px-4 py-3">
        <p className="text-lg font-semibold text-pink-400">{name}</p>
      </div>
    </Link>
  );
}
