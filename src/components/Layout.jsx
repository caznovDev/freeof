// src/components/Layout.jsx
import React from "react";
import Navbar from "./Navbar";
import { useEntryGate, AD_URL } from "../hooks/useEntryGateAndDualRedirect";

export default function Layout({ children }) {
  const { showPopup, accept, leave } = useEntryGate({
    cooldownMinutes: 60,
    adUrl: AD_URL
  });

  return (
    <div className="min-h-screen bg-darkbg text-gray-200">
      <Navbar />
      <main className="pt-24 pb-10">{children}</main>

      {showPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
          <div className="bg-darkbg border border-gray-700 rounded-2xl max-w-sm w-full mx-4 px-6 py-8 text-center shadow-2xl">
            {/* FreeOF logo, aligned with dark/blue theme */}
            <div className="mb-6 text-3xl font-semibold tracking-tight">
              <span className="text-gray-100">Free</span>
              <span className="text-blue-500">OF</span>
            </div>

            {/* Erome-style disclaimer text, adapted */}
            <p className="text-sm text-gray-100 leading-relaxed mb-6">
              This site is an adult community that contains sexually explicit
              material. You must be 18 years old or over to enter.
            </p>

            <button
              onClick={accept}
              className="mb-3 w-full rounded-full bg-blue-600 py-3 text-sm font-semibold tracking-wide text-white hover:bg-blue-500 transition"
            >
              I AM 18 OR OLDER – ENTER
            </button>

            <button
              onClick={leave}
              className="w-full rounded-full border border-gray-600 py-2.5 text-xs font-medium text-gray-300 hover:bg-[#020617] transition"
            >
              LEAVE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
