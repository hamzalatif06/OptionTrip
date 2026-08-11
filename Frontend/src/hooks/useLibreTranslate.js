import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { translateText, translateBatch } from '../services/translateService';

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
