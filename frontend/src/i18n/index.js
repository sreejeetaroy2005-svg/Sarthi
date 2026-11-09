import { useEffect, useState } from 'react';
import en from './en';
import hi from './hi';
import ta from './ta';
import bn from './bn';

const dictionaries = { en, hi, ta, bn };
const locales = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', bn: 'bn-IN' };

function readLanguage() {
  try {
    const profile = JSON.parse(localStorage.getItem('sarthi_user_profile') || '{}');
    return dictionaries[profile.language] ? profile.language : 'en';
  } catch {
    return 'en';
  }
}

export function announceLanguageChange(language) {
  window.dispatchEvent(new CustomEvent('sarthi:language-change', { detail: language }));
}

export function useT() {
  const [language, setLanguage] = useState(readLanguage);
  useEffect(() => {
    const update = (event) => setLanguage(dictionaries[event.detail] ? event.detail : readLanguage());
    window.addEventListener('sarthi:language-change', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('sarthi:language-change', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return (key, values = {}) => {
    const dictionary = dictionaries[language] || en;
    let value = dictionary[key];
    if (value === undefined) {
      if (import.meta.env.DEV) console.warn(`[i18n] missing ${language} translation: ${key}`);
      value = en[key] ?? key;
    }
    return String(value).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? `{${name}}`);
  };
}

export function formatNumber(value, language = readLanguage()) {
  return new Intl.NumberFormat(locales[language] || locales.en).format(value);
}

export function formatCurrency(value, language = readLanguage(), currency = 'INR') {
  return new Intl.NumberFormat(locales[language] || locales.en, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

export function formatTime(value, language = readLanguage(), options = { hour: 'numeric', minute: '2-digit' }) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locales[language] || locales.en, options).format(date);
}

export function formatDate(value, language = readLanguage(), options = { day: 'numeric', month: 'short' }) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locales[language] || locales.en, options).format(date);
}

export function getUILanguage() {
  return readLanguage();
}
