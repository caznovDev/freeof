import React from "react";
import Navbar from "./Navbar";
import { useEntryGate, useDualRedirect } from "../hooks/useEntryGateAndDualRedirect";

const AD_URL =
  "https://www.effectivegatecpm.com/fspkxf7f0?key=ab4f7c97fff46fa5a9a80f09a863e87b";

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
          <div className="bg-[#111827] border border-gray-700 rounded-2xl max-w-md w-full mx-4 p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-2">
              Content warning & monetization notice
            </h2>
            <p className="text-sm text-gray-300 mb-2">
              This site contains adult content and monetized external links.
              By continuing, you confirm you are over 18 and agree to open the
              site in a new tab.
            </p>
            <p className="text-xs text-gray-400 mb-4">
              The current tab may be redirected to an advertising partner
              (Adsterra). You can always come back to FreeOF from the new tab.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={leave}
                className="px-3 py-1.5 text-sm rounded-full border border-gray-500 text-gray-100 bg-transparent hover:bg-gray-800"
              >
                Leave
              </button>
              <button
                onClick={accept}
                className="px-4 py-1.5 text-sm rounded-full bg-blue-600 text-white hover:bg-blue-500 font-semibold"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
