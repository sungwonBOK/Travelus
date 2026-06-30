# Next.js Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the initial Travelus Next.js, TypeScript, and Tailwind CSS foundation tracked by GitHub issue #1.

**Architecture:** Keep the first slice minimal: a single Next.js App Router page, global Tailwind styles, TypeScript configuration, lint/build/typecheck scripts, and documentation-ready project metadata. This task creates a working shell only; domain types and Taipei sample data start in issue #2.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, ESLint, npm.

---

### Task 1: Scaffold Project Foundation

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Modify: `.gitignore`

- [ ] **Step 1: Generate the Next.js baseline**

Run:

```powershell
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --use-npm --yes
```

Expected: Next.js project files are created without deleting existing `docs/` content.

- [ ] **Step 2: Confirm project scripts**

Check `package.json` contains:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 3: Replace the starter page with a Travelus shell**

Set `src/app/page.tsx` to a mobile-first Travelus home shell that links the scaffold to the Taipei MVP without implementing issue #5 yet.

- [ ] **Step 4: Run validation**

Run:

```powershell
npm run typecheck
npm run lint
npm run build
```

Expected: all commands complete successfully.

- [ ] **Step 5: Update issue #1**

Add a completion comment to GitHub issue #1 with the validation commands and commit hash, then close the issue if the scaffold is committed and pushed.
