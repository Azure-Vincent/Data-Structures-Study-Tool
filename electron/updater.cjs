// Update checks for the desktop app.
//  - Windows installer (setup.exe) and Linux AppImage: electron-updater
//    downloads the new version in the background; the user restarts to apply
//    it (or it applies on quit).
//  - Windows portable .exe, macOS (unsigned, so it can't replace itself),
//    Linux .deb and unpackaged dev runs: we only ask GitHub for the latest
//    release and tell the user where to download it.
// Nothing is sent except a normal request to GitHub; offline = silently skipped.
const { app, ipcMain, net, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { compareVersions } = require('./version.cjs');

const OWNER = 'Azure-Vincent';
const REPO = 'Data-Structures-Study-Tool';
const RELEASES_URL = `https://github.com/${OWNER}/${REPO}/releases/latest`;
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;

function detectMode() {
  if (!app.isPackaged) return 'dev';
  if (process.platform === 'win32') return process.env.PORTABLE_EXECUTABLE_DIR ? 'portable' : 'installed';
  if (process.platform === 'linux') return process.env.APPIMAGE ? 'appimage' : 'package';
  return 'mac';
}
const mode = detectMode();
const selfUpdating = mode === 'installed' || mode === 'appimage';
let status = { state: 'idle' };
let win = null;
let autoUpdater = null;
let timer = null;

const prefsFile = () => path.join(app.getPath('userData'), 'update-prefs.json');
function readPrefs() {
  try {
    return { auto: true, ...JSON.parse(fs.readFileSync(prefsFile(), 'utf8')) };
  } catch {
    return { auto: true };
  }
}
function writePrefs(p) {
  try {
    fs.writeFileSync(prefsFile(), JSON.stringify(p));
  } catch {
    /* ignore: preferences are a convenience */
  }
}

function send(next) {
  status = next;
  if (win && !win.isDestroyed()) win.webContents.send('updates:status', status);
}

async function checkGitHub() {
  const res = await net.fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'DS-Study-Lab' } });
  if (res.status === 404) return send({ state: 'none', current: app.getVersion() });
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
  const rel = await res.json();
  const latest = String(rel.tag_name || '').replace(/^v/, '');
  if (latest && compareVersions(latest, app.getVersion()) > 0) send({ state: 'available', version: latest, url: rel.html_url || RELEASES_URL, notes: rel.body || '' });
  else send({ state: 'none', current: app.getVersion() });
}

function setupAutoUpdater() {
  ({ autoUpdater } = require('electron-updater'));
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('update-available', (info) => send({ state: 'downloading', version: info.version, percent: 0 }));
  autoUpdater.on('download-progress', (p) => send({ ...status, state: 'downloading', percent: Math.round(p.percent || 0) }));
  autoUpdater.on('update-downloaded', (info) => send({ state: 'ready', version: info.version }));
  autoUpdater.on('update-not-available', () => send({ state: 'none', current: app.getVersion() }));
}

async function check(manual) {
  if (['checking', 'downloading', 'ready'].includes(status.state)) return status;
  send({ state: 'checking' });
  try {
    if (selfUpdating) await autoUpdater.checkForUpdates();
    else await checkGitHub();
  } catch (e) {
    // Offline or GitHub unreachable: only worth mentioning when the user asked.
    send(manual ? { state: 'error', message: String((e && e.message) || e) } : { state: 'idle' });
  }
  return status;
}

function schedule() {
  clearInterval(timer);
  timer = null;
  if (!readPrefs().auto) return;
  setTimeout(() => check(false), 4000);
  timer = setInterval(() => check(false), CHECK_EVERY_MS);
}

function initUpdates(window) {
  win = window;
  if (selfUpdating) setupAutoUpdater();
  ipcMain.handle('updates:info', () => ({ version: app.getVersion(), mode, auto: readPrefs().auto, status, releasesUrl: RELEASES_URL }));
  ipcMain.handle('updates:check', () => check(true));
  ipcMain.handle('updates:setAuto', (_e, on) => {
    writePrefs({ ...readPrefs(), auto: !!on });
    schedule();
    return !!on;
  });
  ipcMain.handle('updates:install', () => {
    if (selfUpdating && status.state === 'ready') setImmediate(() => autoUpdater.quitAndInstall());
  });
  ipcMain.handle('updates:open', () => shell.openExternal(status.url || RELEASES_URL));
  schedule();
}

module.exports = { initUpdates, compareVersions, checkNow: () => check(true), setWindow: (w) => (win = w) };
