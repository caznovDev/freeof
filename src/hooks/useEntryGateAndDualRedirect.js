// src/hooks/useEntryGateAndDualRedirect.js
import { useEffect, useState } from "react";

const ENTRY_KEY = "freeof_lastEntryTs";
const VIDEO_COUNT_KEY = "freeof_videoPlayCount";

export const AD_URL =
  "https://www.effectivegatecpm.com/fspkxf7f0?key=ab4f7c97fff46fa5a9a80f09a863e87b";

function nowMs() {
  return Date.now();
}

function getIntLS(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? 0 : n;
  } catch {
    return 0;
  }
}

function setIntLS(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // ignore storage errors
  }
}

/* =========================================================
 * ENTRY POPUP (1-hour cooldown)
 * =======================================================*/

function shouldShowEntryPopup(cooldownMinutes = 60) {
  const cooldownMs = cooldownMinutes * 60 * 1000;
  const last = getIntLS(ENTRY_KEY);
  if (!last) return true;
  return nowMs() - last >= cooldownMs;
}

/**
 * Entry gate:
 * - Shows popup if user hasn't accepted in the last `cooldownMinutes`.
 * - On "accept": opens current page in a new tab, redirects this tab to `adUrl`.
 * - On "leave": redirects this tab to `adUrl`.
 */
export function useEntryGate({ cooldownMinutes = 60, adUrl = AD_URL } = {}) {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!shouldShowEntryPopup(cooldownMinutes)) return;
    setShowPopup(true);
  }, [cooldownMinutes]);

  const accept = () => {
    if (typeof window === "undefined") return;

    setIntLS(ENTRY_KEY, nowMs());

    const target = window.location.href;
    try {
      window.open(target, "_blank");
    } catch {
      // ignore popup blocker
    }

    setTimeout(() => {
      window.location.href = adUrl;
    }, 250);
  };

  const leave = () => {
    if (typeof window === "undefined") return;
    window.location.href = adUrl;
  };

  return { showPopup, accept, leave };
}

/* =========================================================
 * 5th-VIDEO POPUP (counter in localStorage)
 * =======================================================*/

function getVideoCount() {
  return getIntLS(VIDEO_COUNT_KEY);
}

function setVideoCount(n) {
  setIntLS(VIDEO_COUNT_KEY, n);
}

/**
 * useVideoPlayPopup
 *
 * Usage:
 *   const { showPopup, registerVideoPlay, accept, close } = useVideoPlayPopup();
 *
 *   // call this when a video actually starts playing
 *   const onPlay = () => {
 *     registerVideoPlay();
 *   };
 *
 *   {showPopup && ( ...your popup UI... )}
 */
export function useVideoPlayPopup({
  threshold = 5,
  adUrl = AD_URL
} = {}) {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Ensure the key exists
    const current = getVideoCount();
    if (current < 0) setVideoCount(0);
  }, []);

  const resetCount = () => {
    setVideoCount(0);
  };

  const registerVideoPlay = () => {
    if (typeof window === "undefined") return;

    const current = getVideoCount() + 1;
    setVideoCount(current);

    if (current >= threshold) {
      setShowPopup(true);
    }
  };

  const accept = () => {
    // Same monetization behavior as entry gate
    resetCount();
    setShowPopup(false);

    if (typeof window === "undefined") return;

    const target = window.location.href;
    try {
      window.open(target, "_blank");
    } catch {
      // ignore popup blocker
    }

    setTimeout(() => {
      window.location.href = adUrl;
    }, 250);
  };

  const close = () => {
    // Just close, also reset the counter
    resetCount();
    setShowPopup(false);
  };

  return { showPopup, registerVideoPlay, accept, close };
}
