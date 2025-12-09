# Task: Create @choragen/web package with Next.js 14 and tRPC dependencies

**Chain**: CHAIN-042-web-api-server  
**Task**: 001-package-setup  
**Status**: in-review  
**Type**: impl  
**Created**: 2025-12-09

---

## Objective

Create the `@choragen/web` package with Next.js 14 (app router) and tRPC v11 dependencies. This is the foundation for the web dashboard API layer.

---

## Expected Files

- `packages/web/`
- `├── package.json           # Package with Next.js 14, tRPC v11, Zod deps`
- `├── tsconfig.json          # TypeScript config extending root`
- `├── next.config.mjs        # Next.js configuration`
- `├── tailwind.config.ts     # Tailwind CSS config`
- `├── postcss.config.mjs     # PostCSS config for Tailwind`
- `├── src/`
- `│   └── app/`
- `│       ├── layout.tsx     # Root layout`
- `│       ├── page.tsx       # Placeholder home page`
- `│       └── globals.css    # Tailwind imports`
- `└── AGENTS.md              # Package-specific agent guidelines`

---

## Acceptance Criteria

- [ ] packages/web/package.json created with:
- [ ] - name: @choragen/web
- [ ] - next: ^14.2.0
- [ ] - @trpc/server: ^11.0.0
- [ ] - @trpc/client: ^11.0.0
- [ ] - @trpc/react-query: ^11.0.0
- [ ] - @tanstack/react-query: ^5.0.0
- [ ] - zod: ^3.23.0
- [ ] - tailwindcss, postcss, autoprefixer
- [ ] - lucide-react for icons
- [ ] - Dependency on @choragen/core
- [ ] tsconfig.json extends root and includes Next.js paths
- [ ] next.config.mjs configured for monorepo (transpilePackages)
- [ ] Tailwind CSS configured with shadcn/ui compatible settings
- [ ] Basic app router structure with layout and placeholder page
- [ ] pnpm install succeeds from workspace root
- [ ] pnpm --filter @choragen/web dev starts the dev server

---

## Notes

**Tech Stack (Decided)**:
- Next.js 14 (app router)
- tRPC v11
- shadcn/ui + Tailwind CSS
- Recharts for charts (add later)
- Lucide React for icons

**Reference CR**: `docs/requests/change-requests/doing/CR-20251208-002-web-api-server.md`

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
