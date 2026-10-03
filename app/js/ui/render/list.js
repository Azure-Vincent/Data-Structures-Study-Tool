// SVG diagram for pointer structures: nodes with data and link fields,
// simulated addresses, named pointer variables and arrows.
import { s } from '../dom.js';
import { fieldsOf, forwardField, walk, lostNodes, GARBAGE } from '../../core/pointerWorld.js';

let uid = 0;
const H = 44; // node height
const ROW0 = 130; // chain row top
const ROW1 = 300; // detached row top

function geometry(kind) {
  if (kind === 'dll') return { w: 150, fields: { left: [0, 42], data: [42, 108], right: [108, 150] }, gap: 62 };
  return { w: 120, fields: { data: [0, 64], next: [64, 120] }, gap: 62 };
}

/**
 * opts: {
 *   hl, mark:[addr], head, interactive:{onField,onNode,onVar,onConnect,armed}, clickable:{onNode, picked:[addr]}
 * }
 */
export function renderList(world, opts = {}) {
  const w = world;
  const id = ++uid;
  const kind = w.kind;
  const G = geometry(kind);
  const ff = forwardField(kind);
  const hl = opts.hl || {};
  const head = opts.head || (w.globals && w.globals[0]) || w.varOrder[0];
  const chain = walk(w, w.vars[head], ff, 60);
  const chainAddrs = chain.addrs.filter((a) => w.nodes[a]);
  // other heads (e.g. a second global) may reach nodes not on the main chain
  const placed = new Map();
  chainAddrs.forEach((a, i) => placed.set(a, { x: 130 + i * (G.w + G.gap), y: ROW0, row: 0 }));
  const others = Object.keys(w.nodes)
    .map(Number)
    .filter((a) => !placed.has(a))
    .sort((a, b) => a - b);
  others.forEach((a, i) => placed.set(a, { x: 130 + i * (G.w + G.gap), y: ROW1, row: 1 }));
  const lost = new Set(lostNodes(w));

  const maxX = Math.max(400, ...[...placed.values()].map((p) => p.x + G.w)) + 70;
  const hasRow1 = others.length > 0;
  const height = (hasRow1 ? ROW1 + H + 70 : ROW0 + H + 80) + (kind === 'csll' || chainAddrs.length > 1 ? 10 : 0);

  const svg = s('svg', {
    viewBox: `0 0 ${maxX} ${height}`,
    width: maxX,
    height,
    role: 'img',
    'aria-label': describe(w, head),
    class: 'list-svg',
  });
  const defs = s('defs');
  for (const [name, cls] of [
    ['a', 'pointer'],
    ['l', 'violet'],
    ['h', 'marker'],
    ['b', 'bad'],
    ['v', 'pointer'],
  ]) {
    defs.append(
      s('marker', { id: `m${name}${id}`, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, s('path', { d: 'M0,0 L10,5 L0,10 z', fill: `var(--${cls})` })),
    );
  }
  svg.append(defs);

  const gEdges = s('g');
  const gNodes = s('g');
  const gVars = s('g');
  svg.append(gEdges, gNodes, gVars);

  if (hasRow1) svg.append(s('text', { x: 14, y: ROW1 + H / 2 + 4, class: 'svg-label' }, 'not in list'));
  if (!Object.keys(w.nodes).length) svg.append(s('text', { x: 130, y: ROW0 + 26, class: 'svg-label' }, `${head} = NULL — the list is empty`));

  const hlLinks = new Set((hl.links || []).map((l) => `${l.from}.${l.field}`));
  const hlNodes = new Set((hl.nodes || []).map(Number));
  const mark = new Set((opts.mark || []).map(Number));
  const picked = new Set((opts.clickable?.picked || []).map(Number));

  // ---- nodes
  for (const [a, p] of placed) {
    const n = w.nodes[a];
    const cls = ['svg-node'];
    if (hlNodes.has(a)) cls.push('hl');
    if (hl.visit === a || picked.has(a)) cls.push('visit');
    if (n.freed) cls.push('freed');
    else if (lost.has(a)) cls.push('lost');
    if (mark.has(a)) cls.push('mark');
    if (hl.anim === 'alloc' && hlNodes.has(a)) cls.push('anim-alloc');
    if (hl.anim === 'free' && hlNodes.has(a)) cls.push('anim-free');
    const g = s('g', { class: cls.join(' '), 'data-addr': a });
    g.append(s('rect', { class: 'box', x: p.x, y: p.y, width: G.w, height: H, rx: 3 }));
    for (const [f, [x0, x1]] of Object.entries(G.fields)) {
      if (f === 'data') {
        g.append(s('text', { class: 'data', x: p.x + (x0 + x1) / 2, y: p.y + H / 2 + 6, 'text-anchor': 'middle' }, n.data === GARBAGE ? '?' : String(n.data)));
        continue;
      }
      g.append(s('rect', { class: 'field', x: p.x + x0, y: p.y, width: x1 - x0, height: H }));
      const v = n[f];
      g.append(
        s(
          'text',
          { class: v === null ? 'nulltxt' : 'ptrtxt', x: p.x + (x0 + x1) / 2, y: p.y + H / 2 + 4, 'text-anchor': 'middle' },
          v === null ? 'NULL' : v === GARBAGE ? '?' : String(v),
        ),
      );
      g.append(s('text', { class: 'svg-label', x: p.x + (x0 + x1) / 2, y: p.y - 5, 'text-anchor': 'middle', style: 'font-size:10px' }, f));
    }
    g.append(s('text', { class: 'svg-label', x: p.x + G.fields.data[0] + (G.fields.data[1] - G.fields.data[0]) / 2, y: p.y - 5, 'text-anchor': 'middle', style: 'font-size:10px' }, 'data'));
    g.append(s('text', { class: 'addr', x: p.x + 2, y: p.y + H + 16 }, `@${a}`));
    if (n.freed) g.append(s('text', { class: 'tag', x: p.x + G.w, y: p.y + H + 16, 'text-anchor': 'end' }, 'freed'));
    else if (lost.has(a)) g.append(s('text', { class: 'tag', x: p.x + G.w, y: p.y + H + 16, 'text-anchor': 'end' }, 'unreachable'));

    const clickNode = opts.clickable?.onNode || opts.interactive?.onNode;
    if (clickNode) {
      g.classList.add('clickable-node');
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', `node at address ${a}, data ${n.data}${n.freed ? ', freed' : ''}`);
      g.addEventListener('click', (e) => {
        if (e.target.closest('.field-hit')) return;
        clickNode(a);
      });
      g.addEventListener('keydown', (e) => {
        if (e.target !== g) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          clickNode(a);
        }
      });
    }
    // editable pointer fields
    if (opts.interactive && !n.freed) {
      for (const [f, [x0, x1]] of Object.entries(G.fields)) {
        if (f === 'data') continue;
        const armed = opts.interactive.armed && opts.interactive.armed.type === 'field' && opts.interactive.armed.addr === a && opts.interactive.armed.field === f;
        const hit = s('rect', {
          class: `field-hit${armed ? ' armed' : ''}`,
          x: p.x + x0 + 2,
          y: p.y + 2,
          width: x1 - x0 - 4,
          height: H - 4,
          tabindex: 0,
          role: 'button',
          'aria-label': `edit ${a}->${f}, currently ${n[f] === null ? 'NULL' : n[f]}`,
          'data-field': f,
        });
        hit.addEventListener('click', (e) => {
          e.stopPropagation();
          opts.interactive.onField(a, f);
        });
        hit.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            opts.interactive.onField(a, f);
          }
        });
        enableDrag(hit, svg, (target) => opts.interactive.onConnect({ type: 'field', addr: a, field: f }, target), id);
        g.append(hit);
      }
    }
    gNodes.append(g);
  }

  // ---- edges
  const centerY = (p) => p.y + H / 2;
  for (const [a, p] of placed) {
    const n = w.nodes[a];
    for (const f of fieldsOf(kind)) {
      const t = n[f];
      if (typeof t !== 'number') continue;
      const tp = placed.get(t);
      const [x0, x1] = G.fields[f];
      const sx = p.x + (x0 + x1) / 2;
      const sy = centerY(p);
      const isLeft = f === 'left';
      const dangling = !w.nodes[t] || w.nodes[t].freed;
      const classes = ['edge'];
      if (isLeft) classes.push('left');
      if (hlLinks.has(`${a}.${f}`)) classes.push('hl');
      if (hl.anim === 'link' && hlLinks.has(`${a}.${f}`)) classes.push('anim-link');
      if (dangling) classes.push('bad');
      const mk = hlLinks.has(`${a}.${f}`) ? 'h' : dangling ? 'b' : isLeft ? 'l' : 'a';
      let d;
      if (!tp) {
        d = `M${sx},${sy} l30,30`;
      } else if (t === a) {
        // self loop
        d = `M${sx},${p.y + H} C${sx + 30},${p.y + H + 50} ${p.x - 30},${p.y + H + 50} ${p.x + 18},${p.y + H}`;
      } else if (tp.row === p.row && tp.x > p.x && !isLeft && tp.x - p.x <= G.w + G.gap + 1) {
        const y = kind === 'dll' ? sy - 8 : sy;
        d = `M${p.x + x1 - 6},${y} L${tp.x},${y}`;
      } else if (isLeft && tp.row === p.row && tp.x < p.x && p.x - tp.x <= G.w + G.gap + 1) {
        d = `M${p.x + x0 + 6},${sy + 8} L${tp.x + G.w},${sy + 8}`;
      } else if (tp.row === p.row) {
        // arc below (backward / long jumps), above for left-links to keep them apart
        const below = !isLeft;
        const yy = below ? p.y + H : p.y;
        const ty = below ? tp.y + H : tp.y;
        const depth = 40 + Math.min(70, Math.abs(tp.x - p.x) / 8);
        const cy = below ? yy + depth : yy - depth;
        d = `M${sx},${yy} C${sx},${cy} ${tp.x + G.w / 2},${cy} ${tp.x + G.w / 2},${ty}`;
      } else {
        const ty = tp.row > p.row ? tp.y : tp.y + H;
        const fy = tp.row > p.row ? p.y + H : p.y;
        d = `M${sx},${fy} C${sx},${(fy + ty) / 2} ${tp.x + G.w / 2},${(fy + ty) / 2} ${tp.x + G.w / 2},${ty}`;
      }
      gEdges.append(s('path', { class: classes.join(' '), d, 'marker-end': `url(#m${mk}${id})` }));
    }
  }

  // ---- pointer variables
  const slotsOver = new Map();
  let freeX = 12;
  const order = w.varOrder.filter((v) => v in w.vars);
  for (const v of order) {
    const val = w.vars[v];
    const tp = typeof val === 'number' ? placed.get(val) : null;
    const isGlobal = (w.globals || [head]).includes(v);
    let bx;
    let by;
    if (tp) {
      const k = slotsOver.get(val) || 0;
      slotsOver.set(val, k + 1);
      bx = tp.x + k * 78 - 4;
      by = tp.row === 0 ? 22 + (k % 2) * 0 : tp.y - 78;
      if (tp.row === 1) by = ROW1 - 70;
    } else {
      bx = freeX;
      by = 22 + 0;
      freeX += 0;
      by = 22 + (slotsOver.get('free') || 0) * 46;
      slotsOver.set('free', (slotsOver.get('free') || 0) + 1);
    }
    const W = 72;
    const cls = ['var-box'];
    if (!isGlobal) cls.push('local');
    if ((hl.vars || []).includes(v)) cls.push('hl');
    const g = s('g', { class: cls.join(' '), 'data-var': v });
    g.append(s('rect', { x: bx, y: by, width: W, height: 38, rx: 4 }));
    g.append(s('text', { class: 'name', x: bx + 6, y: by + 15 }, v));
    g.append(s('text', { class: 'v', x: bx + 6, y: by + 31 }, val === null ? 'NULL' : val === GARBAGE ? '?' : String(val)));
    if (opts.interactive && opts.interactive.onVar) {
      const armed = opts.interactive.armed && opts.interactive.armed.type === 'var' && opts.interactive.armed.name === v;
      const hit = s('rect', { class: `field-hit${armed ? ' armed' : ''}`, x: bx, y: by, width: W, height: 38, rx: 4, tabindex: 0, role: 'button', 'aria-label': `edit pointer variable ${v}, currently ${val === null ? 'NULL' : val}` });
      hit.addEventListener('click', () => opts.interactive.onVar(v));
      hit.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          opts.interactive.onVar(v);
        }
      });
      enableDrag(hit, svg, (target) => opts.interactive.onConnect({ type: 'var', name: v }, target), id);
      g.append(hit);
    }
    gVars.append(g);
    if (tp) {
      const dangling = w.nodes[val]?.freed;
      gEdges.append(
        s('path', {
          class: `var-edge${(hl.vars || []).includes(v) ? ' hl' : ''}${dangling ? ' bad' : ''}`,
          d: `M${bx + 20},${by + 38} L${Math.max(tp.x + 14, Math.min(bx + 20, tp.x + G.w - 14))},${tp.y - 14}`,
          'marker-end': `url(#m${(hl.vars || []).includes(v) ? 'h' : 'v'}${id})`,
        }),
      );
    } else if (typeof val === 'number') {
      g.append(s('text', { class: 'svg-label', x: bx + W + 4, y: by + 24 }, `→ ${val} (gone)`));
    }
  }
  return svg;
}

function enableDrag(hit, svg, onDrop, id) {
  let line = null;
  let start = null;
  hit.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const pt = toSvg(svg, e);
    start = { ...pt, moved: false, id: e.pointerId };
    hit.setPointerCapture(e.pointerId);
  });
  hit.addEventListener('pointermove', (e) => {
    if (!start || e.pointerId !== start.id) return;
    const pt = toSvg(svg, e);
    if (!start.moved && Math.hypot(pt.x - start.x, pt.y - start.y) < 6) return;
    start.moved = true;
    if (!line) {
      line = s('path', { class: 'edge hl', 'marker-end': `url(#mh${id})` });
      svg.append(line);
    }
    line.setAttribute('d', `M${start.x},${start.y} L${pt.x},${pt.y}`);
  });
  const end = (e) => {
    if (!start || e.pointerId !== start.id) return;
    const moved = start.moved;
    start = null;
    if (line) {
      line.remove();
      line = null;
    }
    if (!moved) return;
    hit.releasePointerCapture?.(e.pointerId);
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const node = el && el.closest('[data-addr]');
    const nul = el && el.closest('[data-null-drop]');
    if (node) onDrop(Number(node.getAttribute('data-addr')));
    else if (nul) onDrop(null);
    e.preventDefault();
    hit.dataset.dragged = '1';
    setTimeout(() => delete hit.dataset.dragged, 0);
  };
  hit.addEventListener('pointerup', end);
  hit.addEventListener('pointercancel', () => {
    start = null;
    if (line) line.remove();
    line = null;
  });
  // suppress the click that follows a drag
  hit.addEventListener(
    'click',
    (e) => {
      if (hit.dataset.dragged) {
        e.stopImmediatePropagation();
      }
    },
    true,
  );
}

function toSvg(svg, e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const m = svg.getScreenCTM();
  return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
}

function describe(w, head) {
  const r = walk(w, w.vars[head], forwardField(w.kind));
  const parts = r.addrs.map((a) => `${w.nodes[a].data} at ${a}`);
  return `${w.kind === 'dll' ? 'Doubly linked' : w.kind === 'csll' ? 'Circular' : 'Singly linked'} list from ${head}: ${parts.join(', ') || 'empty'}${r.end === 'cycle' ? ', loops back' : ''}`;
}
