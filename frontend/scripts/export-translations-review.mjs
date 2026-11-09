import { writeFile } from 'node:fs/promises';
import en from '../src/i18n/en.js';
import hi from '../src/i18n/hi.js';
import ta from '../src/i18n/ta.js';
import bn from '../src/i18n/bn.js';
import placeContent from '../src/data/translations/placeContent.js';
import authoredRoutes from '../src/data/translations/authored-routes.js';
import { MONUMENTS } from '../src/data/monuments.js';
const rows = new Map();
const add = (key, values) => rows.set(key, [values.en ?? '', values.hi ?? '', values.ta ?? '', values.bn ?? '']);
for (const key of new Set([...Object.keys(en), ...Object.keys(hi), ...Object.keys(ta), ...Object.keys(bn)])) add(`ui.${key}`, { en: en[key], hi: hi[key], ta: ta[key], bn: bn[key] });
const monuments = new Map(MONUMENTS.map((place) => [place.id, place]));
for (const [id, translations] of Object.entries(placeContent)) {
  const base = monuments.get(id) || {};
  const tr = (lang) => translations[lang] || {};
  for (const field of ['name', 'shortDescription', 'overview']) add(`place.${id}.${field}`, { en: field === 'name' ? base.title : base[field], hi: tr('hi')[field], ta: tr('ta')[field], bn: tr('bn')[field] });
  for (const field of ['highlights','tags']) {
    const english = field === 'highlights' ? base.keyHighlights || [] : base.tags || [];
    const max = Math.max(english.length, ...['hi','ta','bn'].map((lang) => tr(lang)[field]?.length || 0));
    for (let i=0;i<max;i++) add(`place.${id}.${field}.${i+1}`, { en: english[i], hi: tr('hi')[field]?.[i], ta: tr('ta')[field]?.[i], bn: tr('bn')[field]?.[i] });
  }
  const guideKeys = new Set([...Object.keys(base.visitorGuidelines || {}), ...['hi','ta','bn'].flatMap((lang) => Object.keys(tr(lang).visitorGuidelines || {}))]);
  for (const key of guideKeys) {
    if (key === 'photoSpots') {
      const max = Math.max(base.visitorGuidelines?.photoSpots?.length || 0, ...['hi','ta','bn'].map((lang) => tr(lang).visitorGuidelines?.photoSpots?.length || 0));
      for (let i=0;i<max;i++) for (const prop of ['name','tip']) add(`place.${id}.visitorGuidelines.photoSpots.${i+1}.${prop}`, { en: base.visitorGuidelines?.photoSpots?.[i]?.[prop], hi: tr('hi').visitorGuidelines?.photoSpots?.[i]?.[prop], ta: tr('ta').visitorGuidelines?.photoSpots?.[i]?.[prop], bn: tr('bn').visitorGuidelines?.photoSpots?.[i]?.[prop] });
    } else add(`place.${id}.visitorGuidelines.${key}`, { en: base.visitorGuidelines?.[key], hi: tr('hi').visitorGuidelines?.[key], ta: tr('ta').visitorGuidelines?.[key], bn: tr('bn').visitorGuidelines?.[key] });
  }
  const maxDining = Math.max(base.nearbyDining?.length || 0, ...['hi','ta','bn'].map((lang) => tr(lang).nearbyDining?.length || 0));
  for (let i=0;i<maxDining;i++) for (const prop of ['name','cuisine']) add(`place.${id}.nearbyDining.${i+1}.${prop}`, { en: base.nearbyDining?.[i]?.[prop], hi: tr('hi').nearbyDining?.[i]?.[prop], ta: tr('ta').nearbyDining?.[i]?.[prop], bn: tr('bn').nearbyDining?.[i]?.[prop] });
}
for (const [id, translations] of Object.entries(authoredRoutes)) {
  const base = monuments.get(id) || {};
  for (const lang of ['hi','ta','bn']) {
    const authored = translations[lang] || {};
    for (const kind of ['route','guidelines']) {
      const values = authored[kind] || (kind === 'guidelines' ? [] : []);
      const list = Array.isArray(values) ? values : Object.entries(values).map(([key,value]) => ({ key,value }));
      const english = kind === 'route' ? base.walkingRoute || [] : base.visitorGuidelines?.photoSpots || [];
      list.forEach((entry,index) => Object.entries(entry).forEach(([prop,value]) => {
        if (typeof value !== 'string') return;
        const key = `authored.${id}.${kind}.${index+1}.${prop}`;
        const row = rows.get(key) || ['', '', '', ''];
        row[0] ||= english[index]?.[prop] || '';
        row[['hi','ta','bn'].indexOf(lang)+1] = value;
        rows.set(key,row);
      }));
    }
  }
}
const q = (value) => `"${String(value ?? '').replaceAll('"','""')}"`;
const csv = [['key','English','Hindi','Tamil','Bengali'], ...[...rows].map(([key,values]) => [key,...values])].map((r) => r.map(q).join(',')).join('\n')+'\n';
await writeFile(new URL('../../translations-review.csv', import.meta.url), csv, 'utf8');
console.log(`Wrote ${rows.size} translation rows to translations-review.csv`);
