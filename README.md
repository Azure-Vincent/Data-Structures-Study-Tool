# DS Study Lab — Data Structures and Algorithms

An offline, interactive learning application for data structures and algorithms in C++: memory management and pointers, singly, doubly and circular linked lists, stacks, queues, trees and graphs.

Every pointer change can be followed step by step, predicted before it happens, performed by hand, written as pseudocode and studied as a complete C++ program, with immediate and specific feedback. Progress is stored on the device. No account, no internet connection and no AI service are required.

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

The desktop app checks GitHub for a newer Release when it starts and every few hours while it is open (turn this off under **Settings and Data → Updates**; nothing about you or your progress is sent).

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

The application is organized as seven **learning modules** and a set of practice and application sections.

| Navigation | Purpose |
|---|---|
| **Learning Dashboard** | the recommended next activity, concept mastery, recent errors and concepts due for review |
| **Learning Modules** | the seven modules (below), each a sequence of steps with an outline that can be collapsed |
| **Interactive Visualizations** | build any structure and execute its operations step by step; edit pointers directly |
| **Practice Exercises** | short sessions of generated exercises: mixed, targeted review, one module, or one concept |
| **Pseudocode Development** | write pseudocode and execute it line by line on a simulated heap; guided exercises are checked on test cases |
| **Cumulative Review** | spaced review of every pseudocode operation from all modules |
| **C++ Implementation** | all 34 complete programs in C++, with equivalent Python and pseudocode, stepped on the diagram |
| **Algorithm Debugging** | damaged structures: identify the first incorrect operation, undo it and correct the structure |
| **Knowledge Assessment** | module assessments and a comprehensive assessment without hints or worked steps |
| **Learning Progress** | every concept with its attempts, mastery level and next review |

### Learning modules

1. **Memory Management and Pointer Fundamentals** — contiguous and linked storage, addresses, pointers, dynamic allocation and deallocation, arrays with insertion and deletion.
2. **Singly Linked Lists** — nodes and the head pointer; creation, insertion, deletion and traversal; circular singly linked lists.
3. **Doubly Linked Lists** — prev and next pointers, insertion and deletion in both directions, recursive node counting.
4. **Stack Data Structures** — LIFO, push and pop, array stacks (count and index conventions) and linked stacks.
5. **Queue Data Structures** — FIFO, enqueue and dequeue, linear and circular array queues and linked queues.
6. **Tree Data Structures** — terminology, levels and height, full, perfect and complete binary trees, array and linked representation, preorder, inorder and postorder traversal.
7. **Graph Data Structures** — adjacency matrix and adjacency list, depth-first and breadth-first search, connected components.

The 237 steps are labeled by the kind of work they ask for: *Conceptual Foundations, Data Structure Representation, Memory Visualization, Algorithm Execution, Algorithm Tracing, Pseudocode Interpretation, Pseudocode Construction, C++ Implementation, Error Identification and Debugging* and *Application and Problem Solving*, plus callouts labeled *Technical Note, Terminology, Prerequisite, Extension* and *Common Errors and Edge Cases*. Every module covers the purpose, organization and terminology of its structure, every operation as a simulation that pauses for predictions and as a complete program, the common errors and edge cases (empty structures, one node, invalid positions, full and empty arrays), and ends with the progression *predict the output → complete the code → write the pseudocode*. See `docs/CURRICULUM.md` for the full curriculum.

**Code in C++, Python and pseudocode.** Every code panel offers C++, Python and pseudocode (and C where manual memory management is the subject). The choice applies to the whole application. All pseudocode follows one convention, described in Module 1 and in `docs/PSEUDOCODE.md`: `=` for assignment and `==` for comparison, `NULL` for “no node”, explicit block ends (`end if`, `end while`, `end for`, `end function`), four-space indentation and descriptive identifiers (`head`, `new_node`, `create_node()`, `node_count`, `insert_at_position`, `front`, `rear`, `top`, `root`). The pseudocode is executable, so every example can be run.

**Complete programs.** 34 programs, from an array with shifting to breadth-first search, each written in C++, Python and pseudocode. Node-based structures are built explicitly from nodes (no library containers), and the C++ versions release every node with `delete`. The pseudocode runs step by step; the matching C++ and Python statements are highlighted at every step, next to the diagram, the variables, the output and an explanation. Each program has several starting situations (a list of several nodes, one node, an empty list, an invalid position). `tests/langs/verify.mjs` compiles and runs the C++ and Python versions and checks that they output exactly what the pseudocode outputs.

**Workspace.** The diagram, the code with the current line highlighted, the variables and pointers (address and value), an explanation of the last step and the execution history all come from one simulation state. Controls: Step forward, Step back, Play/Pause, Reset and Speed; keyboard: → step, ← back, Space play/pause, Home reset. Panels keep their size while stepping: each panel is measured with the content of every step and reserves the largest size, so stepping never moves the rest of the page.

**Exercises.** 83 exercise templates generate new values, positions, shapes and operation sequences every time: prediction, pointer manipulation (click, drag or keyboard), step ordering, code completion, pseudocode writing graded on several starting structures, error identification, traversal order, representation conversion, tree construction from an array and structure selection. Answers are computed by the simulator; ordering and completion answers are *executed* on several test lists, so every equivalent correct solution is accepted. Each exercise offers three hints (a concept, a highlight on the diagram and the next concrete step) and a solution that replays its reasoning step by step. After an error the feedback explains what the action changed and why it is incorrect, and offers a similar exercise.

**Knowledge Assessment.** A module assessment draws 8 exercises from the concepts of one module; the comprehensive assessment draws 14 from all modules. Assessments give no worked steps and insert no follow-up exercises; the latest and best result of each assessment is recorded.

**Cumulative Review.** Every graded pseudocode exercise (33 in all) is a review item. A review opens it in Pseudocode Development with the starting structure drawn as a diagram and the exercise’s starting code; the check sets when it is scheduled again:
- **recalled**: passed on the first check without hints; the review level increases (1 → 3 → 7 → 16 → 35 → 90 days);
- **recalled with difficulty**: passed after a failed check or with hints; same level, half the interval;
- **not recalled**: the solution was shown or the exercise skipped; back to level 1, due in 10 minutes and once more at the end of the session.

A session contains every due exercise plus up to 5 new exercises per day, in module order. The overview shows the exercises due, a 7-day forecast and a filter by module; the menu shows the number of exercises due.

**Algorithm Debugging.** Six scenarios: a broken link, lost access, a dangling pointer, an unintended cycle, an incorrect backward link and a node released while still referenced. The checker names the first incorrect operation; selecting an operation undoes back to it.

**Interactive Visualizations.** Singly, doubly and circular linked lists; array stacks (count or index convention), linked stacks with the top at the head or at the tail; linear and circular array queues and linked queues; a binary tree builder (with an optional binary search tree mode, marked as an extension); and a graph editor that updates the adjacency matrix and lists immediately and runs BFS and DFS with the discovered, processed, frontier and output sets shown separately. Pointers can also be edited by hand with an immediate diagnosis.

**Pseudocode Development.** A parser and interpreter execute the pseudocode; nothing is evaluated as JavaScript. Nodes keep stable addresses (@100, @200, …), so a value change looks different from a pointer change. Feedback separates syntax errors, runtime errors (NULL dereferences, deleted nodes, undefined variables, nonterminating loops) and logic warnings (unreachable nodes, cycles, broken links), each with a before/after view of the step that caused it. 35 guided exercises are checked on several test cases, including empty and single-node structures and invalid positions. In free mode any starting structure can be built. The language is documented in `docs/PSEUDOCODE.md` and in the application's syntax reference.

**Learning Progress.** A concept is mastered after at least 3 independent correct answers (no hints, no revealed solution, not fully guided) on at least 2 different exercise templates, with the latest attempt correct. Viewing a simulation or a revealed solution never counts. Progress can be exported, imported or reset under **Settings and Data**. Free-text reflections are marked **ungraded**; pseudocode is graded by running it.

**Saved progress from earlier versions** is migrated automatically: completed steps keep their stable keys and are counted in the module that now contains them, practice sessions and records refer to modules, review topics become modules, and saved pseudocode drafts use the standardized identifiers. Old links (`#/lesson/<n>/<step>`, `#/drills`, `#/explore/code`) open the corresponding pages.

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
  js/exercises/         83 templates (one file per topic group, impl.js), checkers (kit.js), solver,
                        debugging scenarios (repair.js)
  js/progress/          storage, mastery, spaced review, session builder (practice and assessments),
                        migration of old saves, drills.js (the schedule of the Cumulative Review)
  js/content/           lessons.js (the seven modules), concepts.js (modules and concepts),
                        translations.js (traced code in C++/Python/pseudocode),
                        impl/ (the complete programs, one file per structure)
  js/ui/ + js/views/    presentation only
  js/lab/               Pseudocode Development: parser (lang.js), interpreter (machine.js), analysis,
                        exercises, rename.js (upgrades saved drafts to the standard identifiers)
electron/main.cjs       desktop wrapper (serves app/ from a private app:// origin)
electron/updater.cjs    update checks (Windows installer + AppImage: electron-updater; others: GitHub Releases API)
electron/preload.cjs    the small update API the page can call
server.js               zero-dependency local web server (browser mode)
tests/                  node:test suites; tests/ui/ optional Playwright browser checks
tests/langs/verify.mjs  compiles and runs the C/C++/Python versions and compares them with the pseudocode
tests/desktop/smoke.mjs launches the real desktop app and drives its core features
.github/workflows/      builds, installs and tests the app on Windows, macOS and Linux
docs/CURRICULUM.md      the seven modules, supporting sections, technical notes and conventions
docs/PSEUDOCODE.md      pseudocode conventions and language reference
```

## Testing
`npm test` runs 167 automated tests, covering:
- every pointer operation on empty, one-node and longer lists
- invalid positions and repeated operations
- doubly linked consistency in both directions
- circular one-lap traversal and the NULL-loop demo
- stack and queue overflow, underflow and the final item
- tree measures, classification and array round-trips
- graph matrices and lists, self-loops, cycles and disconnected graphs
- the BFS and DFS orders of the example graph
- BFS edges vs weights
- **every exercise template across 40 random seeds**: the model answer is accepted, a wrong answer is rejected, generation is deterministic, and there are 3 hints each
- every lesson simulation and exercise
- Pseudocode Development:
  - the parser and its syntax errors
  - the interpreter
  - every runtime error type and the instruction limit
  - lost-reference detection and tolerance of temporary states
  - the final structure checks
  - step back/forward/stop/reset over real snapshots
  - every lab exercise: its solution passes, its starter fails, and each common mistake gets the right diagnosis
- progress persistence across reload, mastery rules, import/export/reset, corrupted storage, session rebuilding, and migrating saves from earlier versions (lesson indices to keys, lessons to modules, old identifiers in drafts)
- every complete program and starting situation: it runs as pseudocode, all three languages carry the same statement labels, every executed line can be highlighted in C++ and Python, and the outputs match the worked examples
- the Cumulative Review schedule: recalled / recalled with difficulty / not recalled intervals, due and new exercises per day, module filters, the forecast, requeueing a forgotten exercise once per session, and loading older saves
- the seven modules have their exact names and unique section keys, no section carries a page reference, every module’s pseudocode is valid syntax, every program is taught in its module, each module has the predict → complete → write progression on its own programs, and no running-time material is left

`node tests/langs/verify.mjs` compiles every C++ program (`-std=c++17 -Wall -Wextra -Werror`), runs every Python program, and requires the output of every starting situation to equal the pseudocode’s output (148 comparisons). Module code sections marked as complete programs are compared the same way, including the C versions. It needs a C/C++ compiler and Python 3 and works on Windows, macOS and Linux; CI runs it on all three.

`tests/ui/*.py` are optional browser checks, run with Playwright against `node server.js 5173`:
- `interact.py` covers predictions, rewiring (click, drag and keyboard), practice resume after reload, explore, repair, BFS and a tree traversal.
- `kinds.py` answers all 83 templates through the real interface (including writing pseudocode in the exercise editor).
- `lessons.py` opens all 237 module steps.
- `lab.py` drives Pseudocode Development: a wrong pointer order, before/after, hints and solution, Run/Pause/Stop/Reset, the limit, edits resetting the run, syntax errors, drafts after reload, and free-mode trees and graphs.
- Set `CHROMIUM=/path/to/chrome` to use an already installed Chromium.
- `drills.py` runs a Cumulative Review session: the overview shows every exercise with its starting structure, exercises open in review mode, and the three grades set the schedule, the due badge and the next session.
- `steady.py` checks, at three window sizes, that no panel changes size or moves while stepping through simulations, walkthroughs and Interactive Visualizations, and that no Pseudocode Development panel shrinks when stepping back.
- `scroll.py` checks, at three window sizes, that Step, Play and the arrow keys never scroll the page: the diagram and controls stay in view, and the Operation history shows the current step without a scrollbar of its own.

`tests/desktop/smoke.mjs` tests the desktop app itself. It launches a built or installed copy with a fresh profile and checks that:
- the window opens with the right title, menus (Edit menu shortcuts, the macOS app menu) and profile folder;
- every page renders;
- a lesson simulation steps and asks its prediction;
- an exercise is answered and graded through the interface;
- Pseudocode Development runs a program and grades it, and Interactive Visualizations step an operation;
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

### Verification
For this version (the restructuring into seven learning modules):
- all 167 Node tests pass, and `tests/langs/verify.mjs` compiled every C++ program and the complete C examples, ran every Python program and found all 148 outputs identical to the pseudocode's (Linux, g++ and Python 3);
- in headless Chromium (browser mode) every page opens without console errors, old links redirect to their new pages, all 237 module steps open (`lessons.py`), all 83 templates are answered correctly through the interface (`kinds.py`), and `interact.py`, `lab.py`, `drills.py` (27/27), `steady.py` (27/27) and `scroll.py` (21/21) pass;
- the desktop smoke test and the installers are verified by the **Build desktop apps** workflow on every push.

For the previous release, the **Build desktop apps** workflow built, installed and launched every download and ran the desktop smoke test against it, including the check that a walkthrough highlights the same statement in C++ and Python:

  | Download | Installed / launched on | Smoke test |
  |---|---|---|
  | Windows `setup.exe` | Windows (GitHub `windows-latest`): silent per-user install, Start-menu entry and Apps & features entry checked, then a clean uninstall | 19/19 |
  | Windows `portable.exe` | Windows, run straight from the file | 15/15 (attached through DevTools, so the main-process and second-launch checks don't apply) |
  | macOS `.dmg` (universal) | macOS on Apple Silicon (`macos-latest`): copied from the mounted dmg, signature verified, both architectures present | 20/20 natively, 20/20 as Intel under Rosetta |
  | Linux `.deb` | Ubuntu 24.04: installed with apt, launched as `ds-study-lab`, then removed cleanly | 19/19 |
  | Linux AppImage | Ubuntu 24.04, run directly (no `--no-sandbox`) | 19/19 |

  The first start of the Intel build under Rosetta takes about 105 s (Rosetta translates the whole binary), so that run allows 360 s to start (`--launch-timeout`).

Not verified: a physical Intel Mac, Windows on ARM, Linux distributions other than Ubuntu, and the self-update download itself (it needs a published Release newer than the installed copy).

## Known limitations
- The app is not signed with a paid certificate: Windows SmartScreen and macOS Gatekeeper warn the first time (see *Install the desktop app*). The macOS app is ad-hoc signed but not notarized by Apple.
- Only the Windows installer and the Linux AppImage update themselves; the portable .exe, the macOS app and the .deb show a download link instead.
- Linux builds are for x64 only.
- In-progress answers are not saved; a resumed session continues at the current exercise, not partway through it.
- The pointer interpreter that grades “arrange / complete the code” understands pointer statements: assignments, `->`, `create_node()`, `free()`, `while`/`do-while`/`if`, `print`. It does not understand integer counters or arithmetic, so exercises keep those parts fixed.
- The application executes only the pseudocode. In a walkthrough the C++ and Python lines are highlighted through statement labels; that those programs behave identically is checked by `tests/langs/verify.mjs` (and CI), not inside the application. Written solutions are graded in pseudocode; C++ and Python versions can be compared with the model program but are not graded.
- Mastery and review intervals use simple fixed rules (Leitner boxes), not an adaptive model.
- Time and space complexity analysis is not included in the current curriculum.
- Nothing inside the window has its own scrollbar: wide diagrams shrink to fit, long code lines wrap, and history panels show the latest steps (with **Show all**). A list with many nodes therefore gets small on a narrow window. Symbols such as → depend on the fonts installed (no web fonts, so the app stays fully offline).
