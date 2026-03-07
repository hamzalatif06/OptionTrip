/**
 * AutoTranslate — full-page LibreTranslate integration
 *
 * Translates ALL visible text on the page (hardcoded JSX + dynamic content)
 * by operating directly on DOM text nodes, just like Google Translate.
 *
 * How it works:
 * 1. On language change → collect every text node in document.body
 * 2. Store each node's original English text in a WeakMap
 * 3. Batch-translate all unique strings via /api/translate (cached)
 * 4. Write translated text back into the DOM nodes
 * 5. MutationObserver watches for React re-renders that restore English text
 *    → debounced re-translation ensures translated state persists
 * 6. On switch back to English → restore originals from WeakMap
 *
 * Also handles i18n JSON missing-key auto-translation for t() calls.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { translateBatch, translateMissingKeys } from '../../services/translateService';

// Tags whose text content should never be translated
const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT',
  'SELECT', 'CODE', 'PRE', 'SVG', 'MATH',
]);

// CSS class substrings that indicate "do not translate"
const SKIP_CLASS_HINTS = ['notranslate', 'language-switcher', 'currency-switcher', 'country-switcher'];

const shouldSkipNode = (node) => {
  const parent = node.parentElement;
  if (!parent) return true;
  if (SKIP_TAGS.has(parent.tagName)) return true;
  if (parent.closest('[data-notranslate]')) return true;
  const cls = parent.className || '';
  if (typeof cls === 'string' && SKIP_CLASS_HINTS.some(h => cls.includes(h))) return true;
  return false;
};

const isTranslatableText = (text) => {
  const t = text.trim();
  if (t.length < 2) return false;
  // Skip pure numbers / symbols
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

const CHUNK_SIZE = 60; // strings per /api/translate call

const AutoTranslate = () => {
  const { i18n } = useTranslation();

  // WeakMap: text node → original English text
  const nodeOriginals = useRef(new WeakMap());
  // Map: `lang:text` → translated text
  const translationCache = useRef(new Map());

  const observerRef = useRef(null);
  const debounceRef = useRef(null);
  const isTranslating = useRef(false);
  const currentLangRef = useRef('en');

  // ── i18n bundle: translate missing keys via LibreTranslate ──────────────
  const patchI18nBundle = useCallback(async (lang) => {
    if (lang === 'en') return;
    try {
      const [{ default: enBundle }, targetMod] = await Promise.all([
        import('../../locales/en.json'),
        import(`../../locales/${lang}.json`).catch(() => ({ default: {} })),
      ]);
      const targetBundle = targetMod.default || targetMod;
      const missing = await translateMissingKeys(enBundle, targetBundle, lang);
      if (Object.keys(missing).length === 0) return;

      const unflatten = (flat) => {
        const result = {};
        for (const [dotKey, value] of Object.entries(flat)) {
          const parts = dotKey.split('.');
          let cur = result;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!cur[parts[i]]) cur[parts[i]] = {};
            cur = cur[parts[i]];
          }
          cur[parts[parts.length - 1]] = value;
        }
        return result;
      };

      const existing = i18n.getResourceBundle(lang, 'translation') || {};
      const merged = deepMerge(existing, unflatten(missing));
      i18n.addResourceBundle(lang, 'translation', merged, true, true);
    } catch {
      // silently ignore — graceful degradation
    }
  }, [i18n]);

  // ── DOM translation ──────────────────────────────────────────────────────
  const translateDOM = useCallback(async (lang) => {
    if (isTranslating.current) return;
    isTranslating.current = true;

    try {
      const nodes = collectTextNodes(document.body);

      if (lang === 'en') {
        // Restore original English text
        nodes.forEach(node => {
          if (nodeOriginals.current.has(node)) {
            const orig = nodeOriginals.current.get(node);
            if (node.textContent !== orig) node.textContent = orig;
          }
        });
        return;
      }

      // Record original text before any translation
      nodes.forEach(node => {
        if (!nodeOriginals.current.has(node)) {
          nodeOriginals.current.set(node, node.textContent);
        }
      });

      // Collect unique originals that are not yet cached
      const originalsSet = new Set(
        nodes
          .map(n => nodeOriginals.current.get(n))
          .filter(t => t && isTranslatableText(t))
      );
      const uncached = [...originalsSet].filter(
        t => !translationCache.current.has(`${lang}:${t}`)
      );

      // Batch translate in chunks
      for (let i = 0; i < uncached.length; i += CHUNK_SIZE) {
        const chunk = uncached.slice(i, i + CHUNK_SIZE);
        const translated = await translateBatch(chunk, lang);
        chunk.forEach((text, idx) => {
          translationCache.current.set(`${lang}:${text}`, translated[idx] || text);
        });
      }

      // Apply translations to DOM
      nodes.forEach(node => {
        const orig = nodeOriginals.current.get(node);
        if (!orig) return;
        const translated = translationCache.current.get(`${lang}:${orig}`);
        if (translated && translated !== node.textContent) {
          node.textContent = translated;
        }
      });
    } catch (err) {
      console.warn('[AutoTranslate] DOM translation error:', err.message);
    } finally {
      isTranslating.current = false;
    }
  }, []);

  // ── MutationObserver: re-translate after React re-renders ───────────────
  const startObserver = useCallback(() => {
    if (observerRef.current) return;

    observerRef.current = new MutationObserver((mutations) => {
      const lang = currentLangRef.current;
      if (lang === 'en') return;

      // Check if any mutation added real app content (not our own changes)
      const hasNewContent = mutations.some(m =>
        [...m.addedNodes].some(n =>
          n.nodeType === Node.ELEMENT_NODE || n.nodeType === Node.TEXT_NODE
        )
      );
      if (!hasNewContent) return;

      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        translateDOM(lang);
      }, 400);
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }, [translateDOM]);

  const stopObserver = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    clearTimeout(debounceRef.current);
  }, []);

  // ── Main effect ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handleLanguageChange = async (lng) => {
      const lang = (lng || 'en').split('-')[0];
      currentLangRef.current = lang;

      stopObserver();

      // Run i18n bundle patching and DOM translation in parallel
      await Promise.all([
        patchI18nBundle(lang),
        translateDOM(lang),
      ]);

      // Start observer after initial translation so React re-renders get re-translated
      if (lang !== 'en') startObserver();
    };

    // Run for current language on mount
    handleLanguageChange(i18n.language);

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
      stopObserver();
    };
  }, [i18n, patchI18nBundle, translateDOM, startObserver, stopObserver]);

  return null;
};

const deepMerge = (source, target) => {
  const result = { ...source };
  for (const [k, v] of Object.entries(target)) {
    if (typeof v === 'object' && v !== null && typeof result[k] === 'object') {
      result[k] = deepMerge(result[k], v);
    } else {
      result[k] = v;
    }
  }
  return result;
};

export default AutoTranslate;
