import React from "react";
import Navbar from "./Navbar";
import {
  useEntryGate,
  useDualRedirect,
  AD_URL
} from "../hooks/useEntryGateAndDualRedirect";

export default function Layout({ children }) {
  const { showPopup, accept, leave } = useEntryGate({
    cooldownMinutes: 60,
    adUrl: AD_URL
  });

  useDualRedirect({
    adUrl: AD_URL,
    delayMinutes: 7,
    selector: "a"
  });

  return (
    <div className="min-h-screen bg-darkbg text-gray-200">
      <Navbar />
      <main className="pt-24 pb-10">{children}</main>

      {showPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
          <div className="bg-[#111111] border border-gray-700 rounded-2xl max-w-sm w-full mx-4 px-6 py-8 text-center shadow-2xl">
            {/* “Logo” similar to Erome */}
            <div className="mb-6 text-3xl font-semibold tracking-tight">
              <span className="text-white">ero</span>
              <span className="text-pink-400">me</span>
            </div>

            {/* Main disclaimer – almost the same text as the screenshot */}
            <p className="text-sm text-gray-100 leading-relaxed mb-6">
              This site is an adult community that contains sexually explicit
              material. You must be 18 years old or over to enter.
            </p>

            {/* Extra small note about monetization / redirect behaviour */}
            <p className="text-[11px] text-gray-400 mb-6">
              By clicking &quot;I am 18 or older – enter&quot; you agree that
              the site may open in a new tab and the current tab may be
              redirected to an advertising partner.
            </p>

            <button
              onClick={accept}
              className="mb-3 w-full rounded-full bg-pink-500 py-3 text-sm font-semibold tracking-wide text-white hover:bg-pink-400 transition"
            >
              I AM 18 OR OLDER – ENTER
            </button>

            <button
              onClick={leave}
              className="w-full rounded-full border border-gray-500 py-2.5 text-xs font-medium text-gray-300 hover:bg-gray-900 transition"
            >
              LEAVE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
