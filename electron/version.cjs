// Version comparison for update checks (no Electron imports, so it is testable).

/** -1 / 0 / 1 comparing "1.2.3"-style versions (a leading v and any -suffix are ignored). */
function compareVersions(a, b) {
  const pa = String(a).replace(/^v/, '').split('-')[0].split('.').map((x) => parseInt(x, 10) || 0);
  const pb = String(b).replace(/^v/, '').split('-')[0].split('.').map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

module.exports = { compareVersions };
