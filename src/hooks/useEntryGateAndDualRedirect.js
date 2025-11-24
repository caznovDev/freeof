import { useEffect, useState } from "react";

const ENTRY_KEY = "freeof_lastEntryTs";
const REDIRECT_KEY = "freeof_lastDualRedirectTs";

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

// =============== ENTRY POPUP ===============

function shouldShowEntryPopup(cooldownMinutes = 60) {
  const cooldownMs = cooldownMinutes * 60 * 1000;
  const last = getIntLS(ENTRY_KEY);
  if (!last) return true;
  return nowMs() - last >= cooldownMs;
}

/**
 * Entry gate hook.
 * - Shows popup if user hasn't accepted in the last `cooldownMinutes`.
 * - On "accept": opens current page in a new tab and redirects THIS tab to `adUrl`.
 * - On "leave": just redirects to `adUrl`.
 */
export function useEntryGate({ cooldownMinutes = 1, adUrl = AD_URL } = {}) {
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
      // ignore blocker
    }

    // Small delay so the new tab opens first
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

// =============== DUAL REDIRECT ===============

/**
 * Start time of this page view. We want it to start on page load,
 * NOT on the first click, so the delay really counts from entry.
 */
function getPageStart() {
  if (typeof window === "undefined") return nowMs();
  if (!window.__freeof_page_start) {
    window.__freeof_page_start = nowMs();
  }
  return window.__freeof_page_start;
}

function canDualRedirect(delayMinutes = 2) {
  const delayMs = delayMinutes * 60 * 1000;
  const now = nowMs();
  const last = getIntLS(REDIRECT_KEY);
  const pageStart = getPageStart();

  // First redirect in this session: use time since page load
  if (!last) {
    return now - pageStart >= delayMs;
  }

  // Subsequent redirects: use time since last redirect
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

/**
 * Dual redirect hook.
 * - After `delayMinutes` from page load (or last redirect),
 *   the next click on a matching link:
 *   • opens the link in a new tab
 *   • fades and redirects current tab to `adUrl`
 */
export function useDualRedirect({
  adUrl = AD_URL,
  selector = "a",
  delayMinutes = 2
} = {}) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    // Initialize page start as soon as hook runs
    getPageStart();

    const handler = (evt) => {
      const target = evt.target;
      if (!target || !target.closest) return;

      const link = target.closest(selector);
      if (!link) return;

      // Opt-out for specific links
      if (link.dataset.noDual === "1") return;

      const href = link.href;
      if (!href || href.startsWith("javascript:")) return;

      if (!canDualRedirect(delayMinutes)) return;

      evt.preventDefault();
      recordDualRedirect();

      try {
        window.open(href, "_blank");
      } catch {
        // popup blocked: user still stays on this tab, which we redirect
      }

      fadeAndRedirect(adUrl);
    };

    document.addEventListener("click", handler, true);
    return () => {
      document.removeEventListener("click", handler, true);
    };
  }, [adUrl, selector, delayMinutes]);
}
