import { useEffect, useRef } from 'react';

// Google Translate language code overrides
const LANG_MAP = {
  'zh': 'zh-CN',
  'he': 'iw',
};

const getBrowserLang = () => {
  const raw = navigator.language || navigator.userLanguage || 'en';
  const base = raw.split('-')[0].toLowerCase();
  return LANG_MAP[base] || base;
};

// Trigger Google Translate widget for a given language code
const triggerGT = (lang) => {
  const select = document.querySelector('.goog-te-combo');
  if (!select || !lang || lang === 'en') return false;
  select.value = lang;
  select.dispatchEvent(new Event('change'));
  return true;
};

// Returns true if the node is part of Google Translate's own DOM
const isGTNode = (node) => {
  if (!node || node === document.body) return false;
  const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  if (!el) return false;
  const cls = el.className || '';
  const id  = el.id || '';
  return (
    cls.includes('goog') ||
    cls.includes('skiptranslate') ||
    id.includes('google') ||
    id === 'google_translate_element' ||
    el.tagName === 'FONT' // GT wraps text in <font> tags
  );
};

// Returns true if a mutation batch contains real new app content
const hasNewAppContent = (mutations) =>
  mutations.some((m) => {
    if (isGTNode(m.target)) return false;
    return [...m.addedNodes].some(
      (node) =>
        !isGTNode(node) &&
        (node.nodeType === Node.TEXT_NODE
          ? node.textContent.trim().length > 0
          : node.nodeType === Node.ELEMENT_NODE && node.textContent.trim().length > 0)
    );
  });

/**
 * AutoTranslate
 *
 * 1. On mount: detect browser language → trigger Google Translate automatically.
 * 2. MutationObserver: watches the entire document for new content added by
 *    React (route changes, API responses, lazy-loaded components).
 *    When real new text is detected, re-triggers translation so dynamic
 *    content is always translated — exactly like Google's own translate behavior.
 * 3. Debounced: batches rapid DOM mutations into a single re-translate call
 *    to avoid flickering.
 * 4. Session-persisted: remembers the active translation language so page
 *    refreshes and route navigations stay translated.
 */
const AutoTranslate = () => {
  const targetLangRef = useRef(null);
  const observerRef   = useRef(null);
  const debounceRef   = useRef(null);

  useEffect(() => {
    const browserLang = getBrowserLang();
    if (browserLang === 'en') return;

    // Restore previously chosen translation language (persists across route changes)
    const saved = sessionStorage.getItem('gtLang');
    targetLangRef.current = saved || browserLang;

    // ── Step 1: Initial translation ────────────────────────────────
    // Poll until the Google Translate widget script has loaded
    let attempts = 0;
    const initPoll = setInterval(() => {
      if (triggerGT(targetLangRef.current)) {
        sessionStorage.setItem('gtLang', targetLangRef.current);
        clearInterval(initPoll);
        setupObserver(); // start watching after first successful translation
      }
      if (attempts++ > 50) clearInterval(initPoll); // give up after ~12s
    }, 250);

    return () => {
      clearInterval(initPoll);
      teardown();
    };
  }, []);

  const setupObserver = () => {
    if (observerRef.current) return; // already observing

    observerRef.current = new MutationObserver((mutations) => {
      // Ignore if all mutations are from Google Translate itself
      if (!hasNewAppContent(mutations)) return;

      // Debounce: wait for React to finish its render batch before re-translating
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const lang = targetLangRef.current;
        if (lang && lang !== 'en') {
          triggerGT(lang);
        }
      }, 600);
    });

    observerRef.current.observe(document.body, {
      childList:     true,  // watch for added/removed elements
      subtree:       true,  // watch entire DOM tree
      characterData: false, // skip character-level changes (avoids GT noise)
    });
  };

  const teardown = () => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    clearTimeout(debounceRef.current);
  };

  return null;
};

export default AutoTranslate;
