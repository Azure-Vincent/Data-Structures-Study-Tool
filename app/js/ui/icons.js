// Small stroke icons (24×24 viewBox), drawn with currentColor.
import { s } from './dom.js';

const PATHS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/>',
  practice: '<path d="M4 4h16v12H8l-4 4z"/><path d="m9 10 2 2 4-4"/>',
  progress: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
  explore: '<rect x="2.5" y="8" width="7" height="8" rx="1.5"/><rect x="14.5" y="8" width="7" height="8" rx="1.5"/><path d="M9.5 12h5"/><path d="m12.5 10 2 2-2 2"/>',
  repair: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  complexity: '<path d="M3 3v18h18"/><path d="M7 15c3 0 4-8 7-8s3 4 6 4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  shuffle: '<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  brand: '<rect x="1.5" y="7" width="9" height="10" rx="2"/><rect x="13.5" y="7" width="9" height="10" rx="2"/><path d="M7.5 12h8"/><path d="m13.5 9.5 2.5 2.5-2.5 2.5"/>',
};

export function icon(name, cls = 'ico') {
  return s('svg', { class: cls, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', html: PATHS[name] || '' });
}
