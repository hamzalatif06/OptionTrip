/**
 * AutoTranslate — full-page translation like Google Translate
 *
 * Translates:
 *   • All visible text nodes (paragraphs, headings, buttons, labels…)
 *   • placeholder, title, and aria-label attributes on form elements
 *
 * Two-phase approach:
 *   Phase 1 (sync):  Apply all localStorage-cached translations instantly
 *   Phase 2 (async): Fetch uncached strings from Google Translate API
 *
 * MutationObserver + follow-up timers catch async-rendered sections.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { translateBatch, getCached } from '../../services/translateService';

const CHUNK_SIZE = 40;

// Tags whose inner text content should never be translated
const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT',
  'SELECT', 'CODE', 'PRE', 'SVG', 'MATH',
]);

// CSS class substrings that mark "do not translate" containers
const SKIP_CLASS_HINTS = [
  'notranslate', 'language-switcher', 'currency-switcher',
  'country-switcher', 'header-lang',
];

// Attributes to translate on form elements
const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label'];

// ── Helpers ────────────────────────────────────────────────────────────────────

const shouldSkipNode = (node) => {
  let el = node.parentElement;
  while (el && el !== document.body) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.hasAttribute('data-notranslate')) return true;
    const cls = el.className;
    if (typeof cls === 'string' && SKIP_CLASS_HINTS.some(h => cls.includes(h))) return true;
    el = el.parentElement;
  }
  return false;
};

const isTranslatableText = (text) => {
  const t = text?.trim();
  if (!t || t.length < 2) return false;
  if (/^[\d\s.,+\-$€£¥%:/()\[\]{}@#!?*&^~`|\\<>=]+$/.test(t)) return false;
  return true;
};

const collectTextNodes = (root) => {
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!isTranslatableText(node.textContent)) continue;
    if (shouldSkipNode(node)) continue;
    nodes.push(node);
  }
  return nodes;
};

/** Collect all elements that have at least one translatable attribute */
const collectAttrElements = (root) => {
  const results = [];
  const all = root.querySelectorAll(
    TRANSLATABLE_ATTRS.map(a => `[${a}]`).join(',')
  );
  all.forEach(el => {
    const attrMap = {};
    TRANSLATABLE_ATTRS.forEach(attr => {
      const val = el.getAttribute(attr);
      if (val && isTranslatableText(val)) attrMap[attr] = val;
    });
    if (Object.keys(attrMap).length > 0) results.push({ el, attrMap });
  });
  return results;
};

// Debounce with guaranteed maxWait — fires even during rapid continuous mutations
const makeDebounced = (fn, delay, maxWait) => {
  let timer = null;
  let firstAt = null;
  return () => {
    const now = Date.now();
    if (!firstAt) firstAt = now;
    clearTimeout(timer);
    if (now - firstAt >= maxWait) {
      firstAt = null; fn();
    } else {
      timer = setTimeout(() => { firstAt = null; fn(); }, delay);
    }
  };
};

// ── Component ──────────────────────────────────────────────────────────────────

const AutoTranslate = () => {
  const { i18n } = useTranslation();

  const nodeOriginals  = useRef(new WeakMap()); // text node → original string
  const attrOriginals  = useRef(new WeakMap()); // element   → { attr: original }
  const localCache     = useRef(new Map());     // `${lang}:${text}` → translated
  const versionRef     = useRef(0);
  const observerRef    = useRef(null);
  const followUpTimers = useRef([]);
  const currentLangRef = useRef('en');
  const debouncedFnRef = useRef(null);

  // ── Phase 1: apply cached translations instantly (no await) ───────────────
  const applyCached = useCallback((lang, nodes, attrEls) => {
    if (lang === 'en') return;

    // Text nodes
    nodes.forEach(node => {
      const orig = nodeOriginals.current.get(node);
      if (!orig) return;
      const key = `${lang}:${orig}`;
      let result = localCache.current.get(key) ?? getCached(orig, lang);
      if (result) {
        localCache.current.set(key, result);
        if (result !== node.textContent) node.textContent = result;
      }
    });

    // Attributes
    attrEls.forEach(({ el, attrMap }) => {
      const origMap = attrOriginals.current.get(el) || {};
      Object.keys(attrMap).forEach(attr => {
        const orig = origMap[attr] || attrMap[attr];
        const key  = `${lang}:${orig}`;
        let result = localCache.current.get(key) ?? getCached(orig, lang);
        if (result) {
          localCache.current.set(key, result);
          if (el.getAttribute(attr) !== result) el.setAttribute(attr, result);
        }
      });
    });
  }, []);

  // ── Full translation pass ──────────────────────────────────────────────────
  const translateDOM = useCallback(async (lang) => {
    const myVersion = ++versionRef.current;

    try {
      const nodes   = collectTextNodes(document.body);
      const attrEls = collectAttrElements(document.body);

      // ── Restore English ──────────────────────────────────────────────────
      if (lang === 'en') {
        nodes.forEach(node => {
          const orig = nodeOriginals.current.get(node);
          if (orig && node.textContent !== orig) node.textContent = orig;
        });
        attrEls.forEach(({ el }) => {
          const origMap = attrOriginals.current.get(el);
          if (!origMap) return;
          Object.entries(origMap).forEach(([attr, orig]) => {
            if (el.getAttribute(attr) !== orig) el.setAttribute(attr, orig);
          });
        });
        return;
      }

      // ── Store originals (English) on first encounter ─────────────────────
      nodes.forEach(node => {
        if (!nodeOriginals.current.has(node)) {
          nodeOriginals.current.set(node, node.textContent);
        }
      });
      attrEls.forEach(({ el, attrMap }) => {
        if (!attrOriginals.current.has(el)) {
          // Store the current attribute values as originals
          const origMap = {};
          Object.keys(attrMap).forEach(attr => {
            origMap[attr] = el.getAttribute(attr);
          });
          attrOriginals.current.set(el, origMap);
        }
      });

      // ── Phase 1: apply cache instantly ──────────────────────────────────
      applyCached(lang, nodes, attrEls);
      if (versionRef.current !== myVersion) return;

      // ── Phase 2: collect uncached strings ───────────────────────────────
      const seen     = new Set();
      const uncached = [];

      const maybeAdd = (text) => {
        if (!text || !isTranslatableText(text)) return;
        if (!localCache.current.has(`${lang}:${text}`) && !seen.has(text)) {
          seen.add(text);
          uncached.push(text);
        }
      };

      nodes.forEach(node => maybeAdd(nodeOriginals.current.get(node)));
      attrEls.forEach(({ el }) => {
        const origMap = attrOriginals.current.get(el) || {};
        Object.values(origMap).forEach(maybeAdd);
      });

      // ── Fetch from Google Translate in chunks ────────────────────────────
      for (let i = 0; i < uncached.length; i += CHUNK_SIZE) {
        if (versionRef.current !== myVersion) return;
        const chunk   = uncached.slice(i, i + CHUNK_SIZE);
        const results = await translateBatch(chunk, lang);
        if (versionRef.current !== myVersion) return;
        chunk.forEach((text, idx) => {
          if (results[idx]) localCache.current.set(`${lang}:${text}`, results[idx]);
        });
      }

      if (versionRef.current !== myVersion) return;

      // ── Apply all translations ───────────────────────────────────────────
      // Re-collect to catch nodes that appeared during the await
      const freshNodes   = collectTextNodes(document.body);
      const freshAttrEls = collectAttrElements(document.body);

      freshNodes.forEach(node => {
        if (!nodeOriginals.current.has(node)) {
          nodeOriginals.current.set(node, node.textContent);
        }
        const orig   = nodeOriginals.current.get(node);
        const result = orig && localCache.current.get(`${lang}:${orig}`);
        if (result && result !== node.textContent) node.textContent = result;
      });

      freshAttrEls.forEach(({ el, attrMap }) => {
        if (!attrOriginals.current.has(el)) {
          const origMap = {};
          Object.keys(attrMap).forEach(attr => { origMap[attr] = el.getAttribute(attr); });
          attrOriginals.current.set(el, origMap);
        }
        const origMap = attrOriginals.current.get(el);
        Object.keys(origMap).forEach(attr => {
          const orig   = origMap[attr];
          const result = orig && localCache.current.get(`${lang}:${orig}`);
          if (result && el.getAttribute(attr) !== result) el.setAttribute(attr, result);
        });
      });

    } catch (err) {
      console.warn('[AutoTranslate]', err.message);
    }
  }, [applyCached]);

  // ── MutationObserver ────────────────────────────────────────────────────────
  const startObserver = useCallback(() => {
    if (observerRef.current) return;

    debouncedFnRef.current = makeDebounced(
      () => translateDOM(currentLangRef.current),
      350,
      1500
    );

    observerRef.current = new MutationObserver((mutations) => {
      if (currentLangRef.current === 'en') return;
      const hasNew = mutations.some(m =>
        [...m.addedNodes].some(n =>
          n.nodeType === Node.ELEMENT_NODE || n.nodeType === Node.TEXT_NODE
        )
      );
      if (hasNew) debouncedFnRef.current?.();
    });

    observerRef.current.observe(document.body, { childList: true, subtree: true });
  }, [translateDOM]);

  const stopObserver = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    debouncedFnRef.current = null;
  }, []);

  const clearFollowUps = useCallback(() => {
    followUpTimers.current.forEach(clearTimeout);
    followUpTimers.current = [];
  }, []);

  // ── Language change handler ─────────────────────────────────────────────────
  useEffect(() => {
    const handleLanguageChange = async (lng) => {
      const lang = (lng || 'en').split('-')[0];
      currentLangRef.current = lang;

      stopObserver();
      clearFollowUps();

      await translateDOM(lang);
      if (lang === 'en') return;

      // Follow-up passes catch async-rendered sections
      [1000, 3000].forEach(delay => {
        const t = setTimeout(() => translateDOM(lang), delay);
        followUpTimers.current.push(t);
      });

      startObserver();
    };

    handleLanguageChange(i18n.language);

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
      stopObserver();
      clearFollowUps();
    };
  }, [i18n, translateDOM, startObserver, stopObserver, clearFollowUps]);

  return null;
};

export default AutoTranslate;
