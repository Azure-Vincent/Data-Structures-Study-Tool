// Small seeded PRNG so every generated exercise can be recreated from its seed.
export function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  const next = () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng = {
    seed,
    next,
    int: (a, b) => a + Math.floor(next() * (b - a + 1)),
    bool: (p = 0.5) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    shuffle: (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    sample: (arr, k) => rng.shuffle(arr).slice(0, k),
    /** k distinct ints in [a,b], optionally multiples of `step`. */
    distinct: (k, a = 1, b = 99, step = 1) => {
      const pool = [];
      for (let x = a; x <= b; x += step) pool.push(x);
      return rng.shuffle(pool).slice(0, k);
    },
  };
  return rng;
}

export function randomSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}
