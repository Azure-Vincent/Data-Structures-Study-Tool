# DS Study Lab — Data Structures, Lectures 07–14

An offline, interactive study app for the C/C++ data-structures lectures 07–14: arrays vs linked lists, singly / doubly / circular linked lists, stacks and queues, trees, graphs and traversals.

You watch every pointer change step by step, predict what happens next, rewire pointers yourself, and get immediate, specific feedback. Progress is saved on your computer. No account, no internet, no AI service.

---

## Get the Windows .exe from GitHub (no setup needed)

1. Create a new repository on GitHub and upload this whole folder (or `git push` it — see below).
2. Open the **Actions** tab. The workflow **Build Windows app** runs automatically on every push. It takes about 5 minutes.
3. Open the finished run and download the **DS-Study-Lab-windows** artifact (a zip). Inside it are:
   - `DS-Study-Lab-1.0.0-portable.exe` — double-click to run, nothing to install;
   - `DS-Study-Lab-1.0.0-setup.exe` — a normal installer with a Start-menu entry.
4. To get a permanent download link, create a version tag. GitHub then makes a **Release** with both .exe files attached:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

The .exe is not code-signed, so Windows SmartScreen may say “Windows protected your PC”. Click **More info → Run anyway**.

### Updates

The desktop app checks GitHub for a newer Release when it starts and every few hours while it is open (turn this off under **Settings & data → Updates**; nothing about you or your progress is sent). Your progress is kept across updates.

- **Installed copy** (`setup.exe`): the new version downloads in the background; the app offers **Restart and update**, or installs it the next time you quit.
- **Portable copy** (`portable.exe`): it cannot replace itself, so it shows **Update available** with a button that opens the Release page to download the new file.

To ship an update, push a higher version tag (for example `git tag v1.0.3 && git push origin v1.0.3`). The workflow builds the app *as* that version and attaches the two .exe files plus `latest.yml` and `.blockmap` files to the Release — the installed copies need those two to update themselves. Tags must keep increasing (`v1.0.3` → `v1.0.4` → `v1.1.0` …).

Pushing from the command line, the first time:
```bash
git init
git add .
git commit -m "DS Study Lab"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

---

## Run it from source

You need **Node.js 18 or newer** (the LTS version from <https://nodejs.org>). Nothing else.

### Windows
| Double-click | What it does |
|---|---|
| `start-browser.bat` | Starts a tiny local server and opens the app in your browser. No install step. |
| `start-desktop.bat` | Opens the app in its own window. The first run downloads the desktop runtime (`npm install`, about 100 MB). |
| `build-windows-exe.bat` | Builds the .exe files yourself into the `dist` folder. |
| `run-tests.bat` | Runs the automated tests. |

### Linux
```bash
chmod +x *.sh          # once
./start-browser.sh     # opens http://localhost:5173 in your browser
./start-desktop.sh     # desktop window (first run: npm install)
./run-tests.sh
```
If the desktop window fails with a sandbox error (common in containers), run `./start-desktop.sh --no-sandbox`.

### Any system, by hand
```bash
node server.js 5173 --open      # browser mode, then visit http://localhost:5173
npm install && npm start        # desktop mode
npm test                        # tests
```

Opening `app/index.html` by double-clicking does **not** work: browsers block JavaScript modules on `file://` pages. Always use one of the launchers above.

---

## What is inside

**Guided lessons (one per lecture).** Every section cites its PDF page. Each concept follows the same cycle:
1. A short explanation and a worked example.
2. The simulation pauses before key steps and asks you to predict them.
3. You perform the operation yourself.
4. Your result is explained immediately.
5. A fresh variation with less guidance.
6. The concept returns later in mixed practice.

“Correction / clarification” callouts flag where the notes miss an edge case or use non-standard names. These include one-node deletions, the circular `NULL` loop, the depth convention, and “full” vs “perfect”. See `docs/LECTURE_MAP.md`.

**Workspace.** It shows the diagram, the code with the current line highlighted, variables and pointers (address vs value), an explanation of the last step, the operation history and the operation counters. All of these come from one simulation state. Controls: Step forward, Step back, Play/Pause, Reset and Speed. Keyboard: → step, ← back, Space play/pause, Home reset.

**Exercises.** There are 65 templates (at least 5 per lecture), and values, positions, shapes and operation sequences are generated randomly. Types:
- predict
- rewire pointers (click, drag, or keyboard panel)
- arrange pseudocode
- complete the code
- find the bug with a failing example
- click a traversal while the stack/queue is shown
- drawing ↔ matrix ↔ adjacency list
- build a tree from its array
- choose a structure
- count the work

Answers are computed by the simulator. Ordering and fill-in answers are *executed* on several test lists, so any equivalent correct solution is accepted. Each exercise offers three hints: a concept, a highlight on the diagram, and the next concrete step. You can reveal the full solution, which replays its reasoning step by step. After a mistake you get an explanation of what your action changed and why it broke things, plus a similar exercise.

**Repair mode.** Six broken scenarios:
- a broken link
- lost access
- a dangling pointer
- an unintended cycle
- a wrong backward link
- a node freed while still referenced

The checker names the first problematic action. Click any action to undo back to it.

**Explore.** Free play with all ten structures:
- singly, doubly and circular linked lists
- array stack, linked stack at the head, linked stack at the tail (as in the notes)
- linear and circular array queue, linked queue
- binary tree builder (with an optional, clearly labelled BST mode)
- graph editor that updates the matrix and adjacency list live, and runs BFS/DFS with discovered, processed, frontier and output shown separately

You can also edit pointers by hand with a live diagnosis.

**Complexity lab.** Plots real operation counts for n = 1…24, for example:
- head-only vs tail pointer
- stack at the head vs at the tail
- creatlist Θ(n²)
- BFS with a list vs a matrix
- recursion depth

Each plot ends with a prediction question about the growth rate.

**Progress.** Mastery means at least 3 independent correct answers (no hints, no revealed solution, not the fully guided version) on at least 2 different exercise templates, with the latest attempt correct. Watching a simulation or revealing a solution never counts. The dashboard shows the next activity, recent mistakes, recurring mistake types and topics due for review (simple spaced repetition). Practice sessions are 8 tasks, one at a time, and can be resumed after closing the app. The timer is optional. Progress can be exported, imported or reset under **Settings & data**.

Free-text reflections and “write your own pseudocode” boxes are clearly marked **ungraded**. The app never pretends to evaluate them.

---

## Project layout
```
app/                    the web app (no build step, plain ES modules)
  js/core/              structure logic + traced algorithms (no DOM)
      pointerWorld.js   simulated heap: addresses, nodes, pointer variables
      sll.js dll.js csll.js stackQueue.js tree.js graph.js
      trace.js          step recorder + Player (step/back/play)
      invariants.js     detects lost access, dangling pointers, cycles, bad back links
      interp.js         tiny interpreter for pointer statements (grades order/fill answers)
  js/sim/               specs → traces, prediction questions
  js/exercises/         65 templates (l07.js … l14.js), checkers (kit.js), solver, repair scenarios
  js/progress/          storage, mastery, spaced review, session builder
  js/content/           lessons (with page references) and concept list
  js/ui/ + js/views/    presentation only
electron/main.cjs       desktop wrapper (serves app/ from a private app:// origin)
electron/updater.cjs    update checks (installer: electron-updater; portable: GitHub Releases API)
electron/preload.cjs    the small update API the page can call
server.js               zero-dependency local web server (browser mode)
tests/                  node:test suites; tests/ui/ optional Playwright browser checks
.github/workflows/      builds the Windows .exe on GitHub
docs/LECTURE_MAP.md     page-by-page mapping and corrections
```

## Testing
`npm test` runs 105 automated tests, covering:
- every pointer operation on empty, one-node and longer lists
- invalid positions and repeated operations
- doubly linked consistency in both directions
- circular one-lap traversal and the NULL-loop demo
- stack and queue overflow, underflow and the final item
- tree measures, classification and array round-trips
- graph matrices and lists, self-loops, cycles and disconnected graphs
- the Lecture 14 BFS/DFS orders
- BFS edges vs weights, and list vs matrix costs
- **every exercise template across 40 random seeds**: the model answer is accepted, a wrong answer is rejected, generation is deterministic, and there are 3 hints each
- every lesson simulation and exercise
- progress persistence across reload, mastery rules, import/export/reset, corrupted storage, and session rebuilding

`tests/ui/*.py` are optional browser checks, run with Playwright against `node server.js 5173`:
- `interact.py` covers predictions, rewiring (click, drag and keyboard), practice resume after reload, explore, repair, BFS and a tree traversal.
- `kinds.py` answers all 65 templates through the real interface.
- `lessons.py` opens all 158 lesson sections.

### What was verified for this release
- All 105 Node tests pass.
- In headless Chromium:
  - every route and all 158 lesson sections open with no console errors;
  - all 65 templates (2 seeds each) were answered correctly through the UI;
  - the primary interactions work: predictions, click/drag/keyboard rewiring with undo, practice resume after reload, repair diagnosis, BFS/DFS, tree traversal;
  - dark mode and a 390 px phone width render correctly.
- The Electron app launched on Linux and kept its saved data across a restart.
- The Windows portable .exe was cross-built on Linux. Its packaged contents were checked, but it was **not run on a real Windows machine**. The GitHub workflow builds it natively on `windows-latest`.

## Known limitations
- The .exe is unsigned, so SmartScreen shows a warning the first time.
- In-progress answers are not saved; a resumed session continues at the current task, not mid-task.
- The pointer interpreter that grades “arrange / complete the code” understands pointer statements: assignments, `->`, `getnode()`, `free()`, `while`/`do-while`/`if`, `print`. It does not understand integer counters or arithmetic, so exercises keep those parts fixed.
- Mastery and review intervals use simple fixed rules (Leitner boxes), not an adaptive model.
- Two things depend on reading the handwriting, which was ambiguous:
  - the directed graph on Lec 13 p.6;
  - the remark on Lec 14 p.3 that the distance “between e and a is 2”, which the app treats as an edge label rather than a distance.
- Diagrams with many nodes scroll sideways instead of shrinking. Symbols such as → depend on the fonts installed (no web fonts, so the app stays fully offline).
