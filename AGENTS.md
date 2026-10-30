# rig

The lane's resident service: keeps a heartbeat, serves the status board, reads the night's run
log. Hono + JSX, rendered on the server, Node 22+.

Read first: `docs/vision.md`, `docs/styleguide.md`. Decisions: `docs/adr/`.

## Commands

- Toolchain: `mise.toml` pins node and pnpm. Run `mise install` once; mise puts them on `PATH`.
- `pnpm dev` / `pnpm start`: serves on `PORT` (8787). Needs `.env` (copy `.env.example`).
- `pnpm test`: vitest. `pnpm typecheck`: tsc.

## How work moves here

1. A feature starts as a plan: `plan.md` at the root (one at a time). Finished plans live in
   `docs/plans/done/`.
2. The plan is split into GitHub issues: skill `plan-to-issues` (`.agents/skills/`). A human
   reviews the split before anything is published. GitHub issues out of reach: files in
   `docs/issues/` (ADR 0004).
3. Issues are worked by workers, one issue per worker, each on its own branch or worktree.
   Pick the model per issue: the strongest for logic, a cheaper one for views and tests.
4. A worker closes its issue with a closing comment, exactly this shape:

   ```
   done: <what changed, one line>
   worker: <harness> · <model> · <effort>
   commit: <sha or "none">
   ```

5. An issue is closed only when its "Done when" holds. If it can't hold yet, leave it open and
   say what it waits on.

## Previews

A preview (ADR 0003) goes out through the GitHub Actions workflow `preview`, never by hand and
never as a committed file. It renders the page in CI and deploys it to GitHub Pages:

- With the marker, for the review: `gh workflow run preview.yml -f marker=true`. The marker comes
  from the repo secret `LANE_MARKER` (`gh secret set LANE_MARKER`), never from a commit.
- Without it, once the review is in: `gh workflow run preview.yml -f marker=false`. Same link, and
  the banner reads "no marker set".
- Before you send the link, and after each run, fetch the live page yourself and check the banner.
- Pages is off between plans. Turning it on (`gh api -X POST repos/<owner>/<repo>/pages -f
  build_type=workflow`), every run that publishes, and turning it off again need a human's yes
  first, because the link is public. When the plan is done: turn Pages off and delete the secret.
- The page to save is in the workflow (`scripts/save-page.ts <path> <out-file>`); change it there
  for a new plan.

## Skills

Shared skills live in `.agents/skills/`, one folder each, `SKILL.md` inside. That folder is the
one source for every harness on the team. If yours loads skills from somewhere else, point it
here (a link or a config entry). Don't copy: copies drift.

## Rules

- Never commit `.env`, tokens or previews.
- Don't touch `runs/`: those are real nights, read-only fixtures.
- No client JS (ADR 0001).
