// Cross-language check of the "Build it in code" programs.
//
// For every program and every case: run the pseudocode in the Pseudocode Lab
// interpreter, compile and run the C++ (g++ / clang++ / c++), run the Python 3
// version, and require the three outputs to be identical line by line.
// Lesson code sections marked `check: true` are complete programs too: their
// C (notes), C++, Python and pseudocode versions must print the same.
// Works on Windows, macOS and Linux; a missing compiler or Python is reported
// and makes the run fail unless --allow-missing is given.
//
//   node tests/langs/verify.mjs [--allow-missing] [--only <id>]
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { IMPLEMENTATIONS } from '../../app/js/content/impl/index.js';
import { compileExample } from '../../app/js/content/impl/format.js';
import { runAll } from '../../app/js/lab/run.js';
import { LESSONS } from '../../app/js/content/lessons.js';

const args = process.argv.slice(2);
const allowMissing = args.includes('--allow-missing');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const isWin = process.platform === 'win32';

function find(cands, versionArg) {
  for (const c of cands) {
    const r = spawnSync(c, [versionArg], { encoding: 'utf8', shell: false });
    if (r.status === 0) return c;
  }
  return null;
}
const cxx = find(['g++', 'clang++', 'c++'], '--version');
const cc = find(['gcc', 'clang', 'cc'], '--version');
const python = find(isWin ? ['python', 'py', 'python3'] : ['python3', 'python'], '--version');
console.log(`C++ compiler: ${cxx || 'NOT FOUND'} · C compiler: ${cc || 'NOT FOUND'} · Python: ${python || 'NOT FOUND'} · ${process.platform}`);
if ((!cxx || !python) && !allowMissing) {
  console.error('A C++ compiler and Python 3 are needed (or pass --allow-missing).');
  process.exit(2);
}

const dir = mkdtempSync(join(tmpdir(), 'dslab-langs-'));
const lines = (s) => String(s).replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n').filter((x, i, a) => !(a.length === 1 && x === ''));
let failures = 0;
let checked = 0;
for (const ex of IMPLEMENTATIONS) {
  if (only && ex.id !== only) continue;
  (ex.cases || [{}]).forEach((c, ci) => {
    const prog = compileExample(ex, ci);
    const run = runAll(prog.pseudo.text, prog.setup, { limit: 20000 });
    const label = `${ex.id} [${c.label || ci}]`;
    if (run.syntax || run.error) {
      failures++;
      console.log(`FAIL ${label}: pseudocode ${run.syntax ? 'syntax' : 'runtime'} error: ${(run.syntax || run.error).message} (line ${(run.syntax || run.error).line})`);
      return;
    }
    const want = run.state.output.map(String);
    const results = { pseudo: want };
    if (cxx) {
      const src = join(dir, `${ex.id}-${ci}.cpp`);
      const exe = join(dir, `${ex.id}-${ci}${isWin ? '.exe' : ''}`);
      writeFileSync(src, prog.cpp.text);
      const comp = spawnSync(cxx, ['-std=c++17', '-Wall', '-Wextra', '-Werror', '-o', exe, src], { encoding: 'utf8' });
      if (comp.status !== 0) {
        failures++;
        console.log(`FAIL ${label}: C++ does not compile:\n${comp.stderr}`);
      } else {
        const r = spawnSync(exe, [], { encoding: 'utf8' });
        results.cpp = r.status === 0 ? lines(r.stdout) : [`(exit ${r.status}) ${r.stderr}`];
      }
    }
    if (python) {
      const src = join(dir, `${ex.id}-${ci}.py`);
      writeFileSync(src, prog.py.text);
      const r = spawnSync(python, ['-I', src], { encoding: 'utf8' });
      results.py = r.status === 0 ? lines(r.stdout) : [`(exit ${r.status}) ${r.stderr}`];
    }
    for (const [lang, got] of Object.entries(results)) {
      if (lang === 'pseudo') continue;
      checked++;
      if (got.join('\n') !== want.join('\n')) {
        failures++;
        console.log(`FAIL ${label}: ${lang} printed\n  ${got.join(' | ')}\nbut the pseudocode printed\n  ${want.join(' | ')}`);
      }
    }
    if (!failures) console.log(`ok   ${label}: ${want.join(' ')}`);
  });
}
// ---------------------------------------------------------------- lesson code sections
for (const lesson of LESSONS) {
  for (const sec of lesson.sections) {
    if (sec.type !== 'code' || !sec.check || (only && sec.key !== only)) continue;
    const label = `${lesson.id} "${sec.title}"`;
    const run = runAll(sec.pseudo, { structure: sec.labStructure || 'sll', values: [] }, { limit: 20000 });
    if (run.syntax || run.error) {
      failures++;
      console.log(`FAIL ${label}: pseudocode ${run.syntax ? 'syntax' : 'runtime'} error: ${(run.syntax || run.error).message}`);
      continue;
    }
    const want = run.state.output.map(String);
    const results = {};
    const id = sec.key.replace(/[^a-z0-9]+/gi, '-');
    for (const [lang, compiler, ext, std] of [['cpp', cxx, 'cpp', '-std=c++17'], ['c', cc, 'c', '-std=c11']]) {
      if (!sec[lang] || !compiler) continue;
      const src = join(dir, `${id}.${ext}`);
      const exe = join(dir, `${id}-${lang}${isWin ? '.exe' : ''}`);
      writeFileSync(src, sec[lang]);
      const comp = spawnSync(compiler, [std, '-Wall', '-Wextra', '-Werror', '-o', exe, src], { encoding: 'utf8' });
      if (comp.status !== 0) {
        failures++;
        console.log(`FAIL ${label}: ${lang} does not compile:\n${comp.stderr}`);
        continue;
      }
      const r = spawnSync(exe, [], { encoding: 'utf8' });
      results[lang] = r.status === 0 ? lines(r.stdout) : [`(exit ${r.status}) ${r.stderr}`];
    }
    if (sec.py && python) {
      const src = join(dir, `${id}.py`);
      writeFileSync(src, sec.py);
      const r = spawnSync(python, ['-I', src], { encoding: 'utf8' });
      results.py = r.status === 0 ? lines(r.stdout) : [`(exit ${r.status}) ${r.stderr}`];
    }
    let bad = false;
    for (const [lang, got] of Object.entries(results)) {
      checked++;
      if (got.join('\n') !== want.join('\n')) {
        failures++;
        bad = true;
        console.log(`FAIL ${label}: ${lang} printed\n  ${got.join(' | ')}\nbut the pseudocode printed\n  ${want.join(' | ')}`);
      }
    }
    if (!bad) console.log(`ok   ${label}: ${want.join(' ')}`);
  }
}

rmSync(dir, { recursive: true, force: true });
console.log(`\n${checked} C/C++/Python runs compared with the pseudocode · ${failures} failure(s)`);
process.exit(failures ? 1 : 0);
