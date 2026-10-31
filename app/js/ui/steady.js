// Panels that keep their size while a run is stepped through.
//
// A panel whose content changes at every step (explanation, variables,
// output, history, diagram) would grow and shrink as you step, pushing
// everything below it up and down. steadyPanel() stops that in two ways:
//
//  - measure(count, render): when every step of a run is known in advance
//    (simulations, walkthroughs), each step's content is rendered into an
//    invisible copy of the panel at the same width, and the largest height
//    becomes the panel's min-height. Nothing below it moves for the whole run.
//  - grow(): when steps are only known as they happen, the panel keeps the
//    largest height it has had so far, so stepping back and forth never makes
//    it shrink and grow again. (The Pseudocode Lab does both: it measures a
//    quiet background run of the program and keeps growing past it.)
//
// Both are redone when the panel's width changes (a narrower panel wraps
// more), and reset() forgets everything for a new run.
import { clear } from './dom.js';

export function steadyPanel(panel) {
  let source = null; // { count, render(i) }
  let seen = 0;
  let width = 0;
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => onResize()) : null;
  if (ro) ro.observe(panel);

  function onResize() {
    if (!panel.isConnected) return;
    const w = Math.round(panel.getBoundingClientRect().width);
    if (!w || w === width) return;
    width = w;
    if (source) {
      // a new width wraps differently: what was kept for the old width no longer applies
      seen = 0;
      measureNow();
    } else if (seen) {
      // a new width wraps differently: start growing again from the current content
      seen = 0;
      panel.style.minHeight = '';
      grow();
    }
  }

  // Measuring is spread over animation frames (a few ms each) so a long run never
  // stalls the page. While it runs the current reservation stays (it can only
  // grow); the exact height is set when every step has been measured.
  let job = 0;
  function measureNow() {
    if (!source || !panel.isConnected || !panel.parentNode) return;
    const w = panel.getBoundingClientRect().width;
    if (!w) return;
    width = Math.round(w);
    const mine = ++job;
    const { count, render, keep } = source;
    let best = keep ? seen : 0;
    let i = 0;
    const slice = () => {
      if (mine !== job || !panel.isConnected || !panel.parentNode) return;
      // an invisible copy with the same classes, in the same place in the page, so the same CSS applies
      const probe = panel.cloneNode(false);
      probe.removeAttribute('id');
      probe.removeAttribute('aria-live');
      probe.setAttribute('aria-hidden', 'true');
      probe.inert = true;
      Object.assign(probe.style, { position: 'absolute', visibility: 'hidden', pointerEvents: 'none', left: '0', top: '0', width: `${w}px`, minHeight: '0', height: 'auto', maxHeight: 'none' });
      panel.parentNode.appendChild(probe);
      const t0 = performance.now();
      for (; i < count && performance.now() - t0 < 8; i++) {
        const content = render(i);
        if (content == null) continue;
        clear(probe).append(...(Array.isArray(content) ? content.filter((x) => x != null) : [content]));
        best = Math.max(best, Math.ceil(probe.getBoundingClientRect().height));
      }
      probe.remove();
      if (i < count) {
        if (best > seen) {
          seen = best;
          panel.style.minHeight = `${seen}px`;
        }
        requestAnimationFrame(slice);
      } else {
        seen = best;
        panel.style.minHeight = seen ? `${seen}px` : '';
      }
    };
    slice();
  }

  /** Grow-only: remember the largest height so far (call after each redraw). */
  function grow() {
    if (!panel.isConnected) return;
    const hgt = Math.ceil(panel.getBoundingClientRect().height);
    if (hgt > seen) {
      seen = hgt;
      panel.style.minHeight = `${seen}px`;
    }
  }

  return {
    /**
     * Reserve the largest height over `count` steps; render(i) returns step i's
     * content. With keep, the panel never gets smaller than it already is.
     */
    measure(count, render, { keep = false } = {}) {
      source = { count, render, keep };
      measureNow();
    },
    /** Measure again (e.g. after the code language changed). */
    remeasure: measureNow,
    grow,
    reset() {
      job++;
      source = null;
      seen = 0;
      panel.style.minHeight = '';
    },
    destroy() {
      if (ro) ro.disconnect();
    },
  };
}
