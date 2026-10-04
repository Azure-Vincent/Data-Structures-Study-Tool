// Update alerts for the desktop app. In a plain browser there is no
// window.dslabDesktop bridge and everything here is a no-op.
import { h, clear } from './dom.js';

const bridge = typeof window !== 'undefined' ? window.dslabDesktop : null;
const DISMISS_KEY = 'dslab-update-dismissed';

export const desktopUpdates = !!bridge;

function dismissed(version) {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === version;
  } catch {
    return false;
  }
}
function dismiss(version) {
  try {
    window.localStorage.setItem(DISMISS_KEY, version);
  } catch {
    /* ignore */
  }
}

/** Short human text for an update status (shared by the banner and Settings). */
export function statusText(s, info) {
  switch (s && s.state) {
    case 'checking':
      return 'Checking for updates…';
    case 'available':
      return `Version ${s.version} is available.`;
    case 'downloading':
      return `Downloading version ${s.version}… ${s.percent ? s.percent + '%' : ''}`;
    case 'ready':
      return `Version ${s.version} is downloaded and will be installed when you restart.`;
    case 'none':
      return `You have the latest version (${(info && info.version) || s.current}).`;
    case 'error':
      return `Could not check for updates: ${s.message}`;
    default:
      return '';
  }
}

/** Actions for a status: download page for portable copies, restart for installed ones. */
export function statusActions(s, { onDismiss } = {}) {
  if (!s) return [];
  if (s.state === 'available') return [h('button', { class: 'btn primary small', onclick: () => bridge.openRelease() }, 'Download update'), onDismiss ? h('button', { class: 'btn ghost small', onclick: onDismiss }, 'Later') : null];
  if (s.state === 'ready') return [h('button', { class: 'btn primary small', onclick: () => bridge.installUpdate() }, 'Restart and update'), onDismiss ? h('button', { class: 'btn ghost small', onclick: onDismiss }, 'Later') : null];
  return [];
}

/** Floating card that appears when an update is available or ready. */
export function mountUpdateBanner() {
  if (!bridge) return;
  const el = h('div', { class: 'update-banner', role: 'status', 'aria-live': 'polite', hidden: true });
  document.body.append(el);
  const show = (s) => {
    if (!s || !['available', 'ready'].includes(s.state) || dismissed(`${s.state}:${s.version}`)) {
      el.hidden = true;
      return;
    }
    clear(el).append(
      h('div', { class: 'update-title' }, s.state === 'ready' ? 'Update ready' : 'Update available'),
      h('p', {}, s.state === 'ready' ? `DS Study Lab ${s.version} has been downloaded. Restart to start using it — your progress is kept.` : `DS Study Lab ${s.version} is out. Download the new version to get the latest fixes and features — your progress is kept.`),
      h('div', { class: 'row' }, statusActions(s, { onDismiss: () => { dismiss(`${s.state}:${s.version}`); el.hidden = true; } })),
    );
    el.hidden = false;
  };
  bridge.onUpdateStatus(show);
  bridge.getUpdateInfo().then((info) => show(info.status)).catch(() => {});
}

/** The "Updates" panel on the Settings page (desktop app only). */
export function updatesPanel() {
  if (!bridge) return null;
  const panel = h('section', { class: 'panel' }, h('h2', {}, 'Updates'));
  const auto = h('input', { type: 'checkbox', 'aria-label': 'check for updates automatically' });
  const line = h('p', { class: 'small', 'aria-live': 'polite' });
  const acts = h('div', { class: 'row' });
  let info = null;
  let off = null;
  const draw = (s) => {
    line.textContent = statusText(s, info) || 'Updates are checked when the app starts and every few hours while it is open.';
    clear(acts).append(h('button', { class: 'btn', disabled: s && ['checking', 'downloading'].includes(s.state), onclick: () => bridge.checkForUpdates().then(draw) }, 'Check for updates now'), statusActions(s));
  };
  bridge.getUpdateInfo().then((i) => {
    info = i;
    auto.checked = i.auto;
    auto.addEventListener('change', () => bridge.setAutoUpdate(auto.checked));
    panel.append(
      h('div', { class: 'setting-row' }, h('span', { class: 'lbl' }, 'Installed version', h('small', {}, i.mode === 'installed' ? 'Installed copy — updates download in the background.' : i.mode === 'portable' ? 'Portable copy — you will be told when a new version is out, with a link to download it.' : 'Development run — you will only be told about new releases.')), h('b', {}, i.version)),
      h('label', { class: 'setting-row' }, h('span', { class: 'lbl' }, 'Check for updates automatically', h('small', {}, 'Asks GitHub for the latest release. Nothing about you or your progress is sent.')), auto),
      line,
      acts,
    );
    draw(i.status);
    off = bridge.onUpdateStatus(draw);
  });
  panel.cleanup = () => off && off();
  return panel;
}
