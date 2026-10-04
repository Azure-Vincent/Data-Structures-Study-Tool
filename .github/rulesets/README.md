# Repository rulesets

GitHub does not apply these files automatically. Import each one once:
**Settings → Rules → Rulesets → New ruleset → Import a ruleset**, pick the file, review, **Create**.

| File | Protects | Rules |
|---|---|---|
| `protect-main.json` | the default branch (`main`) | No deleting it and no force-pushes. Every change arrives through a pull request whose review threads are resolved, after the `test` and `windows` CI jobs pass. |
| `protect-release-tags.json` | tags `v*` | Only repository admins can create, move or delete release tags. A `v*` tag publishes a Release, and the desktop app installs/announces it to every user, so this guards the update channel. |

Notes
- `required_approving_review_count` is 0 because a pull request author cannot approve their own pull request; with a single maintainer, requiring 1 would block every merge. Raise it when there are other maintainers.
- Admins can bypass the `main` rules **only when merging a pull request** (an escape hatch if CI itself is broken); they cannot push to `main` directly.
- If a CI job is renamed in `.github/workflows/build-windows.yml`, update the `context` names in `protect-main.json` (and in the live ruleset), or merges will wait for a check that never runs.
