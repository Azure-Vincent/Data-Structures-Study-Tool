# DS Study Lab — Data Structures, Lectures 07–14

An offline, interactive study app for the C/C++ data-structures lectures 07–14: arrays vs linked lists, singly / doubly / circular linked lists, stacks and queues, trees, graphs and traversals.

You watch every pointer change step by step, predict what happens next, rewire pointers yourself, and get immediate, specific feedback. Progress is saved on your computer. No account, no internet, no AI service.

---

## Install the desktop app

The app runs on **Windows 10/11**, **macOS 12 or newer** (Apple Silicon and Intel) and **64-bit Linux**. Get the files from the repository's **Releases** page (or from the latest run of the **Build desktop apps** workflow in the **Actions** tab, under *Artifacts*).

| System | File | Install |
|---|---|---|
| Windows | `DS-Study-Lab-<version>-setup.exe` | Run it. It installs for your user only (no administrator rights), adds a Start-menu entry, and updates itself. Uninstall from **Settings → Apps**. |
| Windows | `DS-Study-Lab-<version>-portable.exe` | Nothing to install: double-click it. Works from a USB stick. |
| macOS | `DS-Study-Lab-<version>-mac-universal.dmg` | Open it and drag **DS Study Lab** onto **Applications**. One file for Apple Silicon and Intel Macs. |
| Debian, Ubuntu, Mint… | `DS-Study-Lab-<version>-linux-amd64.deb` | `sudo apt install ./DS-Study-Lab-<version>-linux-amd64.deb`, then start it from the app menu or with `ds-study-lab`. Remove it with `sudo apt remove ds-study-lab`. |
| Any Linux | `DS-Study-Lab-<version>-linux-x86_64.AppImage` | `chmod +x` the file and run it. It updates itself. |

The app is free and not signed with a paid certificate, so each system warns once:
- **Windows** SmartScreen says “Windows protected your PC”: click **More info → Run anyway**.
- **macOS** says Apple cannot check the app for malicious software. Open the app once, then go to **System Settings → Privacy & Security** and click **Open Anyway** (on macOS 14 and older you can instead Control-click the app → **Open**). Or run this in Terminal:
  ```bash
  xattr -dr com.apple.quarantine "/Applications/DS Study Lab.app"
  ```
- **Linux AppImage** needs FUSE 2: `sudo apt install libfuse2t64` (Ubuntu 24.04 and newer) or `sudo apt install libfuse2` (older). If it stops with a sandbox error (Ubuntu 24.04 restricts this for apps without an AppArmor profile), run it with `--no-sandbox`, or use the .deb, which installs the profile.

Your progress is stored per user (`%APPDATA%\DS Study Lab` on Windows, `~/Library/Application Support/DS Study Lab` on macOS, `~/.config/DS Study Lab` on Linux), so it survives updates and reinstalling.

### Updates

The desktop app checks GitHub for a newer Release when it starts and every few hours while it is open (turn this off under **Settings & data → Updates**; nothing about you or your progress is sent).

- **Windows installer** and **Linux AppImage**: the new version downloads in the background; the app offers **Restart and update**, or installs it the next time you quit.
- **Windows portable, macOS and Linux .deb**: the app shows **Update available** with a button that opens the Release page to download the new file.

### Publishing a release

Every push and pull request runs the **Build desktop apps** workflow. On Windows, macOS and Linux it runs the tests, builds the installers, installs them the way a user would, launches the installed app and drives its core features, then uninstalls it.

To publish a version, push a tag:
```bash
git tag v1.0.3
git push origin v1.0.3
```
The workflow builds the app *as* that version and attaches every file to a new Release, including `latest.yml`, `latest-linux.yml` and the `.blockmap` files that the installed copies need to update themselves. Tags must keep increasing (`v1.0.3` → `v1.0.4` → `v1.1.0` …).

To build the files yourself, run `npm install` and then `npm run dist:win` on Windows (or double-click `build-windows-exe.bat`), `npm run dist:mac` on a Mac, or `npm run dist:linux` on Linux. Each platform's files have to be built on that platform. They land in `dist/`.

---

## Run it from source

You need **Node.js** from <https://nodejs.org>:
- **browser mode** works with Node.js 18 or newer and needs no install step;
- **desktop mode** needs Node.js **22.12 or newer**. The first run downloads the desktop runtime (`npm install`, about 100 MB).

### Windows
| Double-click | What it does |
|---|---|
| `start-browser.bat` | Starts a tiny local server and opens the app in your browser. |
| `start-desktop.bat` | Opens the app in its own window. |
| `build-windows-exe.bat` | Builds the .exe files yourself into the `dist` folder. |
| `run-tests.bat` | Runs the automated tests. |

### macOS and Linux
In Terminal, in this folder:
```bash
./start-browser.sh     # opens http://localhost:5173 in your browser
./start-desktop.sh     # desktop window
./run-tests.sh
```
If a script says “Permission denied” (for example after downloading a .zip), run `chmod +x *.sh` once, or start it with `bash start-desktop.sh`. On Linux, if the desktop window fails with a sandbox error (common in containers), run `./start-desktop.sh --no-sandbox`.

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

**Pseudocode Lab.** You write pseudocode and run it line by line on a simulated heap. A real parser and interpreter execute it; nothing is evaluated as JavaScript. You watch nodes being created, pointers changing, traversals and deletions as separate steps. Nodes keep stable addresses (@100, @200, …), so a value change looks different from a pointer change. Controls: Run/Pause, Step, Back, Run to end, Reset, Stop, speed and an instruction limit.
- Feedback separates syntax errors, runtime errors (NULL, deleted nodes, undefined variables, endless loops) and logic warnings (unreachable nodes, cycles, broken links). Each problem has a before/after view of the step that caused it.
- 21 guided exercises cover singly, doubly and circular lists, stacks, queues, trees and graphs. Each is checked on several test cases, including empty and single-node structures, with three hints before the solution.
- In free mode you build any starting structure.

The language is documented in `docs/PSEUDOCODE.md` and in the app's syntax reference.

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
  js/lab/               Pseudocode Lab: parser (lang.js), interpreter (machine.js), analysis, exercises
electron/main.cjs       desktop wrapper (serves app/ from a private app:// origin)
electron/updater.cjs    update checks (Windows installer + AppImage: electron-updater; others: GitHub Releases API)
electron/preload.cjs    the small update API the page can call
server.js               zero-dependency local web server (browser mode)
tests/                  node:test suites; tests/ui/ optional Playwright browser checks
tests/desktop/smoke.mjs launches the real desktop app and drives its core features
.github/workflows/      builds, installs and tests the app on Windows, macOS and Linux
docs/LECTURE_MAP.md     page-by-page mapping and corrections
```

## Testing
`npm test` runs 127 automated tests, covering:
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
- the Pseudocode Lab:
  - the parser and its syntax errors
  - the interpreter
  - every runtime error type and the instruction limit
  - lost-reference detection and tolerance of temporary states
  - the final structure checks
  - step back/forward/stop/reset over real snapshots
  - every lab exercise: its solution passes, its starter fails, and each common mistake gets the right diagnosis
- progress persistence across reload, mastery rules, import/export/reset, corrupted storage, and session rebuilding

`tests/ui/*.py` are optional browser checks, run with Playwright against `node server.js 5173`:
- `interact.py` covers predictions, rewiring (click, drag and keyboard), practice resume after reload, explore, repair, BFS and a tree traversal.
- `kinds.py` answers all 65 templates through the real interface.
- `lessons.py` opens all 158 lesson sections.
- `lab.py` drives the Pseudocode Lab: a wrong pointer order, before/after, hints and solution, Run/Pause/Stop/Reset, the limit, edits resetting the run, syntax errors, drafts after reload, and free-mode trees and graphs.

`tests/desktop/smoke.mjs` tests the desktop app itself. It launches a built or installed copy with a fresh profile and checks that:
- the window opens with the right title, menus (Edit menu shortcuts, the macOS app menu) and profile folder;
- every page renders;
- a lesson simulation steps and asks its prediction;
- an exercise is answered and graded through the interface;
- the Pseudocode Lab runs a program and grades it, and Explore steps an operation;
- the update panel reports the right kind of copy (installer, portable, AppImage, .deb, macOS);
- a second copy hands over to the first one instead of opening twice;
- progress is still there after the app is closed and reopened;
- no page errors occur.

```bash
npm run test:desktop -- --source --mode dev                      # this checkout
npm run test:desktop -- --exe "/Applications/DS Study Lab.app/Contents/MacOS/DS Study Lab" --mode mac
npm run test:desktop -- --exe /usr/bin/ds-study-lab --mode package --arg --no-sandbox   # e.g. in a container
```
It writes a JSON report and a screenshot to `smoke-out/`. The CI workflow runs it against every installer it builds.

### What was verified for this release
- All 127 Node tests pass on Windows, macOS and Linux.
- The **Build desktop apps** workflow built, installed and launched every download and ran the desktop smoke test against it:

  | Download | Installed / launched on | Smoke test |
  |---|---|---|
  | Windows `setup.exe` | Windows (GitHub `windows-latest`): silent per-user install, Start-menu entry and Apps & features entry checked, then a clean uninstall | 18/18 |
  | Windows `portable.exe` | Windows, run straight from the file | 14/14 (attached through DevTools, so the main-process and second-launch checks don't apply) |
  | macOS `.dmg` (universal) | macOS on Apple Silicon (`macos-latest`): copied from the mounted dmg, signature verified, both architectures present | 19/19 natively, 19/19 as Intel under Rosetta |
  | Linux `.deb` | Ubuntu 24.04: installed with apt, launched as `ds-study-lab`, then removed cleanly | 18/18 |
  | Linux AppImage | Ubuntu 24.04, run directly (no `--no-sandbox`) | 18/18 |
- In headless Chromium (browser mode):
  - every route and all 158 lesson sections open with no console errors;
  - all 65 templates (2 seeds each) were answered correctly through the UI;
  - the primary interactions work: predictions, click/drag/keyboard rewiring with undo, practice resume after reload, repair diagnosis, BFS/DFS, tree traversal.
- Not verified: a physical Intel Mac, Windows on ARM, Linux distributions other than Ubuntu, and the self-update download itself (it needs a published Release newer than the installed copy).

## Known limitations
- The app is not signed with a paid certificate: Windows SmartScreen and macOS Gatekeeper warn the first time (see *Install the desktop app*). The macOS app is ad-hoc signed but not notarized by Apple.
- Only the Windows installer and the Linux AppImage update themselves; the portable .exe, the macOS app and the .deb show a download link instead.
- Linux builds are for x64 only.
- In-progress answers are not saved; a resumed session continues at the current task, not mid-task.
- The pointer interpreter that grades “arrange / complete the code” understands pointer statements: assignments, `->`, `getnode()`, `free()`, `while`/`do-while`/`if`, `print`. It does not understand integer counters or arithmetic, so exercises keep those parts fixed.
- Mastery and review intervals use simple fixed rules (Leitner boxes), not an adaptive model.
- Two things depend on reading the handwriting, which was ambiguous:
  - the directed graph on Lec 13 p.6;
  - the remark on Lec 14 p.3 that the distance “between e and a is 2”, which the app treats as an edge label rather than a distance.
- Diagrams with many nodes scroll sideways instead of shrinking. Symbols such as → depend on the fonts installed (no web fonts, so the app stays fully offline).
