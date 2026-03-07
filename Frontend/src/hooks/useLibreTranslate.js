/**
 * useLibreTranslate — hook for translating dynamic content via LibreTranslate
 *
 * Usage:
 *   const { translate } = useLibreTranslate();
 *   const [label, setLabel] = useState('');
 *   useEffect(() => { translate('Hello world').then(setLabel); }, [translate]);
 *
 * OR for static text in JSX:
 *   const name = useTranslatedText(activity.name);
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { translateText, translateBatch } from '../services/translateService';

/**
 * Returns translate() and translateMany() functions bound to the current i18n language.
 */
export const useLibreTranslate = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').split('-')[0];

  const translate = useCallback(
    (text) => translateText(text, lang),
    [lang]
  );

  const translateMany = useCallback(
    (texts) => translateBatch(texts, lang),
    [lang]
  );

  return { translate, translateMany, lang };
};

/**
 * Translates a single string and returns the translated value reactively.
 * Returns the original text immediately, then updates once translation arrives.
 *
 * @param {string} text  - English source text
 * @returns {string}     - Translated text (or original while loading)
 */
export const useTranslatedText = (text) => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').split('-')[0];
  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    if (!text || lang === 'en') {
      setTranslated(text);
      return;
    }
    let cancelled = false;
    translateText(text, lang).then(result => {
      if (!cancelled) setTranslated(result);
    });
    return () => { cancelled = true; };
  }, [text, lang]);

  return translated;
};

/**
 * Translates an array of strings and returns them reactively.
 *
 * @param {string[]} texts - English source texts
 * @returns {string[]}     - Translated texts (or originals while loading)
 */
export const useTranslatedTexts = (texts) => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').split('-')[0];
  const [translated, setTranslated] = useState(texts);

  useEffect(() => {
    if (!texts?.length || lang === 'en') {
      setTranslated(texts);
      return;
    }
    let cancelled = false;
    translateBatch(texts, lang).then(results => {
      if (!cancelled) setTranslated(results);
    });
    return () => { cancelled = true; };
  }, [JSON.stringify(texts), lang]);

  return translated;
};

export default useLibreTranslate;
