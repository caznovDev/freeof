import { useEffect, useState, useCallback } from "react";

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
 * 5th-VIDEO: OPEN AD IN NEW TAB ONLY
 * =======================================================*/

function getVideoCount() {
  return getIntLS(VIDEO_COUNT_KEY);
}

function setVideoCount(n) {
  setIntLS(VIDEO_COUNT_KEY, n);
}

/**
 * useVideoPlayAd
 *
 * Returns a `registerVideoPlay` function.
 * Call it when a video actually starts playing (`onPlay`).
 * On the Nth play (`threshold`), it opens `adUrl` in a new tab
 * and resets the counter.
 */
export function useVideoPlayAd({
  threshold = 5,
  adUrl = AD_URL
} = {}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const current = getVideoCount();
    if (current < 0) setVideoCount(0);
  }, []);

  const registerVideoPlay = useCallback(() => {
    if (typeof window === "undefined") return;

    const current = getVideoCount() + 1;
    setVideoCount(current);

    if (current >= threshold) {
      // reset counter and open ad in new tab
      setVideoCount(0);
      try {
        window.open(adUrl, "_blank");
      } catch {
        // ignore popup blocker
      }
    }
  }, [threshold, adUrl]);

  return { registerVideoPlay };
}
