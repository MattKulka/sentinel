// Generates a self-contained coverage badge (no external service) from Vitest's
// coverage-summary.json. Run after `pnpm test:coverage`; writes badges/coverage.svg.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const summary = JSON.parse(
  readFileSync('coverage/coverage-summary.json', 'utf8'),
);
const pct = Math.round(summary.total.lines.pct);

const color =
  pct >= 90
    ? '#4c1'
    : pct >= 80
      ? '#97ca00'
      : pct >= 70
        ? '#a4a61d'
        : pct >= 60
          ? '#dfb317'
          : '#e05d44';

const label = 'coverage';
const value = `${pct}%`;
// Rough monospace-ish width estimate (6px/char + padding) keeps it self-contained.
const labelW = label.length * 6.5 + 10;
const valueW = value.length * 7 + 12;
const totalW = labelW + valueW;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalW}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="20" fill="#555"/>
    <rect x="${labelW}" width="${valueW}" height="20" fill="${color}"/>
    <rect width="${totalW}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelW / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelW / 2}" y="14">${label}</text>
    <text x="${labelW + valueW / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelW + valueW / 2}" y="14">${value}</text>
  </g>
</svg>
`;

mkdirSync('badges', { recursive: true });
writeFileSync('badges/coverage.svg', svg);
console.log(`coverage badge written: ${value}`);
