---
name: plan-to-issues
description: Split this repo's plan.md into GitHub issues with gh, one per unit of work, after a human has reviewed the split. Use when a plan is ready and has no issues yet.
---

# plan-to-issues

Turns `plan.md` into GitHub issues that workers can pick up cold. Easiest with `gh`, authenticated,
in a shell this agent can run.

## Steps

1. Read `plan.md`, `AGENTS.md` and `docs/adr/`.
2. Draft the split as a table: title · plan section · scope · done when · blocked by.
   One issue per unit of work.
3. **Stop and show the table to the human.** Publish nothing until they approve it.
4. Ask the human what every issue here must carry (fields, labels, wording), unless it is
   already written down in this session or in the repo. The shape below is the one agreed so far;
   ask only about changes to it.
5. Create each issue in dependency order, so blocked-by can cite real numbers:

   ```sh
   gh issue create --title "<title>" --body-file <tmp.md>
   ```

6. Record every issue URL from gh's output (not from memory) and reply with the list.

## Issue shape

Every issue split from a plan carries this, in this order:

- **Title:** short, names the unit of work (`Digest page: GET /digest/:night`).
- **Label:** `plan:<plan>`, the `plan:` value from the plan's frontmatter (`plan:morning-digest`).
  Create it once per plan: `gh label create plan:<plan>`.
- **Body:**

  ```md
  Source: plan.md § <n>

  ## Scope

  <what to build, from the plan section; the rules it must keep>

  ## Done when

  <the plan's "Done when", word for word>

  ## Blocked by

  <#n, with what it needs from it, or —>
  ```

- The first line is always `Source: plan.md § <n>`, with the section as the plan numbers it
  (`§ 1`, `§ 2a`). The reviewer sorts issues by it.
- One section can be one issue or more; never put two sections in one issue.
- A "Done when" that needs someone else (a reviewer, a user) holds only once they have acted.
  The issue stays open until then, and whatever it blocks waits.

Closing one, with the closing comment from AGENTS.md:

```sh
gh issue close <n> -c "<closing comment>"
```

## No `gh`

Steps 1–4 hold either way. GitHub reachable another way (a connector, the REST API, the web UI):
the same issues, made that way. GitHub issues out of reach altogether: write them as files in
`docs/issues/`, format in ADR 0004, then commit and push.

## Don'ts

- Don't paste the whole plan into one issue, and don't keep issues only in chat.
- Don't invent sections the plan doesn't have. If the plan is unclear, ask.
