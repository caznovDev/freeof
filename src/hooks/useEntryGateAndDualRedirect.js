import { useEffect, useState } from "react";

const ENTRY_KEY = "freeof_lastEntryTs";
const REDIRECT_KEY = "freeof_lastDualRedirectTs";
const AD_URL =
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
    // ignore
  }
}

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
    setIntLS(ENTRY_KEY, nowMs());
    const target = window.location.href;
    try {
      window.open(target, "_blank");
    } catch {
      // ignore
    }
    setTimeout(() => {
      window.location.href = adUrl;
    }, 250);
  };

  const leave = () => {
    window.location.href = adUrl;
  };

  return { showPopup, accept, leave };
}

function canDualRedirect(delayMinutes = 2) {
  const pageStart =
    window.__freeof_page_start || (window.__freeof_page_start = nowMs());
  const delayMs = delayMinutes * 60 * 1000;
  const last = getIntLS(REDIRECT_KEY);
  const now = nowMs();

  if (!last) {
    return now - pageStart >= delayMs;
  }
  return now - last >= delayMs;
}

function recordDualRedirect() {
  setIntLS(REDIRECT_KEY, nowMs());
}

function fadeAndRedirect(adUrl) {
  try {
    document.body.style.transition = "opacity 0.25s ease";
    document.body.style.opacity = "0.5";
  } catch {
    // ignore
  }
  setTimeout(() => {
    window.location.href = adUrl;
  }, 250);
}

export function useDualRedirect({
  adUrl = AD_URL,
  selector = "a",
  delayMinutes = 7
} = {}) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handler = (evt) => {
      const target = evt.target;
      if (!target) return;

      const link = target.closest(selector);
      if (!link) return;

      if (link.dataset.noDual === "1") return;

      if (!link.href || link.href.startsWith("javascript:")) return;

      if (!canDualRedirect(delayMinutes)) return;

      evt.preventDefault();
      recordDualRedirect();

      try {
        window.open(link.href, "_blank");
      } catch {
        // ignore
      }

      fadeAndRedirect(adUrl);
    };

    document.addEventListener("click", handler, true);
    return () => {
      document.removeEventListener("click", handler, true);
    };
  }, [adUrl, selector, delayMinutes]);
}
