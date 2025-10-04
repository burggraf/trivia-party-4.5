# Multi-User Trivia Party Application

A real-time trivia game application for pub and restaurant venues, featuring three distinct interfaces for hosts, players, and TV displays.

## Overview

This application enables interactive team-based trivia gameplay with:

- **Host Interface** (desktop/tablet): Game setup, question control, flow management, scoring
- **Player Interface** (mobile-first): Team joining, answer submission, real-time feedback
- **TV Display** (large screens): Question presentation, scoreboard visualization, QR codes

## Features

- 🎮 Real-time multiplayer gameplay with WebSocket synchronization (<300ms latency)
- 👥 Team-based competition with 1-6 players per team
- 📊 Automatic scoring with tie-breaking by cumulative answer time
- 🔀 Deterministic answer shuffling (same order across all clients)
- 🔒 First-answer locking to prevent duplicate team submissions
- 📱 Mobile-first responsive design for players
- 📺 Large-screen optimized TV display
- 🎯 Question reuse prevention across all host's games
- 🔐 Anonymous player sessions (30-day validity)
- 📈 Game history and player leaderboards

## Tech Stack

### Frontend
- **Vite 7+** - Fast development server and optimized production builds
- **React 19** - UI component library
- **React Router 7** - Client-side routing
- **TypeScript 5+** - Strict type safety
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library based on Radix UI
- **Zustand** - State management
- **Recharts** - Score visualizations

### Backend
- **Supabase** - PostgreSQL database with Row-Level Security (RLS)
- **Supabase Auth** - Email/password and anonymous authentication
- **Supabase Realtime** - WebSocket-based broadcast channels

### Testing
- **Vitest** - Unit and component tests
- **React Testing Library** - Component testing utilities
- **Playwright** - End-to-end integration tests

### Deployment
- **Cloudflare Pages** - Static site hosting
- **Supabase Cloud** - Managed PostgreSQL and real-time infrastructure

## Prerequisites

- **Node.js** 18+ (build-time only)
- **npm** or **yarn** or **pnpm**
- **Supabase account** (free tier available)
- **Git**

## Setup Instructions

### 1. Clone Repository

```bash
git clone <repository-url>
cd trivia-party-4.5
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Supabase Setup

#### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for project to finish provisioning
3. Note your project URL and anon key from Settings > API

#### Initialize Local Supabase

```bash
npx supabase init
npx supabase link --project-ref <your-project-ref>
```

#### Run Database Migrations

```bash
npx supabase db push
```

This will create all necessary tables, indexes, RLS policies, and materialized views.

#### Load Question Database (Optional)

If you have a question database dump:

```bash
psql <connection-string> < questions.sql
```

### 4. Environment Variables

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Important**: Never commit `.env.local` to version control. The `.env.example` file shows required variables.

### 5. Start Development Server

```bash
npm run dev
```

Open http://localhost:3001 in your browser.

## Development Workflow

### Running the Application

```bash
# Development server (with HMR)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

### Running Tests

```bash
# Unit tests (Vitest)
npm test

# Unit tests in watch mode
npm test -- --watch

# E2E tests (Playwright)
npm run test:e2e

# E2E tests with UI
npm run test:e2e -- --ui
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

### Database Management

```bash
# Create new migration
npx supabase migration new <migration-name>

# Push migrations to remote
npx supabase db push

# Pull remote schema
npx supabase db pull

# Generate TypeScript types from schema
npx supabase gen types typescript --local > src/types/database.types.ts
```

## Project Structure

```
trivia-party-4.5/
├── src/
│   ├── pages/              # React Router pages
│   │   ├── host/           # Host interface pages
│   │   ├── player/         # Player interface pages
│   │   └── tv/             # TV display pages
│   ├── components/         # React components
│   │   ├── ui/             # shadcn/ui primitives
│   │   ├── host/           # Host-specific components
│   │   ├── player/         # Player-specific components
│   │   └── shared/         # Shared components
│   ├── lib/                # Services, hooks, utilities
│   │   ├── services/       # Business logic services
│   │   ├── game/           # Game-specific utilities
│   │   ├── realtime/       # Supabase Realtime channels
│   │   ├── hooks/          # React hooks
│   │   └── supabase/       # Supabase client
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Main app component with routing
│   └── main.tsx            # Application entry point
├── supabase/
│   └── migrations/         # Database migration files
├── tests/
│   ├── e2e/                # Playwright E2E tests
│   └── unit/               # Vitest unit tests
├── specs/
│   └── 001-initial-game-setup/  # Feature specification
└── public/                 # Static assets
```

## Usage Guide

### For Hosts

1. **Register/Login**: Navigate to `/host/login` and create an account
2. **Create Game**: Click "Create New Game" and configure:
   - Game name and venue
   - Number of rounds and questions per round
   - Categories for each round
   - Time limit per question (default: 60s)
   - Team size limits (min/max players)
3. **Start Game**: Review questions and click "Start Game" to generate game code
4. **Control Game**: Use control panel to:
   - Display questions to players and TV
   - Reveal correct answers
   - Navigate between questions
   - Pause/resume game
   - View scores
5. **End Game**: Complete all rounds and view final scores

### For Players

1. **Join Game**: Navigate to `/player/join` and enter 6-character game code
2. **Create/Join Team**: Either create a new team or join an existing one
3. **Wait in Lobby**: See other teams joining in real-time
4. **Answer Questions**: When host starts game:
   - Read question on your device
   - Select answer within time limit
   - First team member to submit locks the answer
5. **View Results**: See your team's final score and ranking

### For TV Display

1. **Open Display**: Navigate to `/tv/<game-code>/lobby` on a large screen
2. **Show QR Code**: Display QR code and game code for players to scan
3. **Automatic Updates**: TV automatically shows:
   - Lobby with joining teams
   - Questions with answer options
   - Teams answered count
   - Scoreboards after each round

## Architecture

### Static Client-Side Application

This is a **pure static site** with no server-side execution:

- All application logic runs in the browser
- Vite builds the app to static HTML/JS/CSS
- Deployed to Cloudflare Pages as static files
- All backend operations via Supabase browser client

### Three-Interface Design

**Host Interface**: Desktop-optimized, data-dense tables and controls
**Player Interface**: Mobile-first, large touch targets, simple navigation
**TV Display**: High contrast, large text, minimal UI chrome

### Real-Time Synchronization

Uses Supabase Realtime broadcast channels (not table subscriptions):

1. **Game Channel** (`game:{game_id}`): Question advances, reveals, state changes
2. **Presence Channel** (`team:{team_id}:presence`): Team member online/offline status
3. **TV Channel** (`tv:{game_id}`): TV-specific updates (teams answered count)

Target latency: <300ms for all real-time events

### Database Architecture

**11 Application Tables**:
- `hosts`, `games`, `rounds`, `game_questions`
- `teams`, `team_members`, `answer_submissions`
- `question_usage` (reuse prevention)
- `player_profiles`, `leaderboard_cache`
- `questions` (pre-populated with 61,000+ questions)

**2 Materialized Views**:
- `game_history`: Completed games with aggregated stats
- `leaderboard_entries`: Player statistics and rankings

**Row-Level Security (RLS)**:
- Hosts can only view/manage their own games
- Players can only view games they've joined
- TV displays have public read access (no auth required)

### Answer Shuffling

Deterministic seeded randomization ensures consistent answer order:

1. Game creation generates randomization seed
2. Seed stored in `game_questions.randomization_seed`
3. All clients (host, players, TV) use same seed for shuffle
4. Same seed = same answer order across all devices

### Question Reuse Prevention

Tracks questions used by each host across ALL their games:

1. `question_usage` table with composite index on `(host_id, question_id)`
2. Question selection excludes all questions in host's usage history
3. Auto-supplements from all categories when selected categories exhausted

## Deployment

### Cloudflare Pages

1. **Connect Repository**: Link your Git repository to Cloudflare Pages
2. **Build Settings**:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`
3. **Environment Variables**: Add in Cloudflare Pages dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Deploy**: Cloudflare automatically builds and deploys on git push

### Supabase Production

1. **Migrations**: Run `npx supabase db push` to apply migrations
2. **RLS Policies**: Verify all RLS policies are enabled
3. **API Keys**: Use production anon key (not service role key)
4. **Rate Limits**: Configure Supabase rate limiting if needed

## Performance Targets

- **First Contentful Paint (FCP)**: <1.5s
- **Time to Interactive (TTI)**: <3.5s on 3G
- **Real-time Sync Latency**: <300ms
- **Lighthouse Performance**: ≥90
- **Bundle Size**: <500KB gzipped

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Android Chrome 90+

Requires WebSocket support for real-time features.

## Troubleshooting

### Common Issues

**Issue**: Dev server shows "Port 3000 in use"
**Solution**: Server automatically tries port 3001. Update Playwright config if needed.

**Issue**: Supabase connection errors
**Solution**: Verify environment variables in `.env.local`. Check Supabase project status.

**Issue**: Real-time sync not working
**Solution**:
- Check Supabase Realtime is enabled in project settings
- Verify no ad blockers blocking WebSocket connections
- Check browser console for connection errors

**Issue**: Database migration errors
**Solution**:
- Run `npx supabase db reset` to reset local database
- Verify migration files are in correct order
- Check for syntax errors in migration SQL

### Debug Mode

Enable debug logging:

```typescript
// In src/lib/supabase/client.ts
const supabase = createClient(url, key, {
  realtime: {
    log_level: 'debug' // Add this line
  }
})
```

## Contributing

This is a feature implementation following the Spec-Driven Development (SDD) workflow. All changes should:

1. Update specification documents first (`specs/001-initial-game-setup/spec.md`)
2. Regenerate implementation plan if needed
3. Update tasks.md to track implementation
4. Follow existing code style and patterns
5. Add tests for new functionality
6. Update documentation

## License

[Add license information]

## Support

[Add support contact information]

---

**Built with** [Claude Code](https://claude.com/claude-code)
