# Migration from Next.js to Vite + React Router

**Date**: 2025-09-30
**Reason**: Next.js `output: 'export'` mode had limitations with route groups and added unnecessary complexity for a pure static site.

## Changes Made

### Framework Switch
- **Before**: Next.js 15 with App Router in static export mode
- **After**: Vite 7 + React 19 + React Router 7

### Benefits of Vite
✅ **Faster dev server** - Instant HMR, no compilation delays
✅ **Simpler routing** - React Router works perfectly for client-side SPAs
✅ **Smaller bundle** - No Next.js framework overhead
✅ **Better DX** - No fighting against server-side features we don't need
✅ **Easier deployment** - Just static files to Cloudflare Pages

### Directory Structure Changes

**Before (Next.js)**:
```
app/
├── (host)/login/page.tsx
├── (host)/dashboard/page.tsx
├── test/page.tsx
├── page.tsx
├── layout.tsx
└── globals.css
lib/
types/
```

**After (Vite)**:
```
index.html                 # Entry HTML
src/
├── main.tsx              # React root
├── App.tsx               # React Router setup
├── globals.css
├── pages/
│   ├── HomePage.tsx
│   ├── TestPage.tsx
│   └── host/
│       ├── HostLoginPage.tsx
│       └── HostDashboardPage.tsx
├── lib/                  # (unchanged - services, hooks, utils)
├── types/                # (unchanged - TypeScript types)
└── components/           # (to be created - UI components)
```

### Code Changes

**Navigation**:
- **Before**: `import { useRouter } from 'next/navigation'` → `router.push('/path')`
- **After**: `import { useNavigate } from 'react-router-dom'` → `navigate('/path')`

**Links**:
- **Before**: `<Link href="/path">` (Next.js Link)
- **After**: `<Link to="/path">` (React Router Link)

**No More**:
- ❌ `'use client'` directives (not needed in standard React)
- ❌ `next/link`, `next/navigation` imports
- ❌ Next.js App Router conventions
- ❌ Route groups `(name)` syntax

### Configuration

**vite.config.ts** (new):
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

**package.json scripts**:
- **Before**: `"dev": "next dev"`, `"build": "next build"`
- **After**: `"dev": "vite"`, `"build": "vite build"`

### Services & Hooks
✅ **No changes needed** - All client-side services in `src/lib/` work exactly the same:
- `lib/services/auth-service.ts`
- `lib/services/game-service.ts`
- `lib/services/team-service.ts`
- `lib/services/question-service.ts`
- `lib/hooks/use-auth.ts`
- `lib/hooks/use-game.ts`
- `lib/hooks/use-realtime-game.ts`

### Deployment
**Build output**: `dist/` directory (was `.next/`)
**Cloudflare Pages**: Point to `dist/` instead of `.next/`
**No changes needed** to deployment process besides output directory

## Testing Results

✅ All routes working:
- `http://localhost:3000/` - Home page
- `http://localhost:3000/host/login` - Host login
- `http://localhost:3000/host/dashboard` - Host dashboard
- `http://localhost:3000/test` - Test page

✅ Build successful:
```bash
npm run build
# ✓ built in 1.18s
# dist/index.html                   0.48 kB
# dist/assets/index-BTjHtLWx.css    7.46 kB
# dist/assets/index-D1awLZR_.js   376.37 kB
```

## Next Steps

1. ✅ Migration complete
2. ⏳ Update remaining spec documents (spec.md, plan.md, tasks.md)
3. ⏳ Continue building remaining pages (player, TV interfaces)
4. ⏳ Update E2E tests to use new routing patterns

## Documentation Updated

- ✅ `CLAUDE.md` - Updated Technology Stack and Architecture sections
- ✅ `package.json` - Updated scripts for Vite
- ⏳ `specs/001-game-setup-multi/plan.md` - Needs update
- ⏳ `specs/001-game-setup-multi/tasks.md` - Needs review

## Rollback Plan (if needed)

1. Restore `next.config.ts`
2. Move `src/` back to `app/`
3. Restore `'use client'` directives
4. Change imports back to Next.js patterns
5. Update package.json scripts

(Not recommended - Vite is working perfectly)