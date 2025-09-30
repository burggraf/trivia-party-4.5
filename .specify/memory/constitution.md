<!--
Sync Impact Report
Version change: 0.0.0 → 1.0.0
Modified principles: none (initial release)
Added sections: Core Principles; Experience & Quality Standards; Delivery Workflow; Governance
Removed sections: none
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
- ✅ .specify/templates/agent-file-template.md
Follow-up TODOs: none
-->

# Trivia Party Constitution

## Core Principles

### Architecture: Static Client-Side React Application

**Deployment Model:**
- All applications are static web apps deployed to Cloudflare Pages
- No server-side execution or Node.js runtime APIs
- All application logic runs in the browser

**Frontend Stack:**
- React with TypeScript (strict mode, no `any` types)
- shadcn/ui components with Tailwind CSS for all UI
- Modular component architecture with clear separation of concerns
- Target: ≤250 lines per file for maintainability

### Backend: Supabase Exclusive

**Service Layer:**
- Supabase client library (`supabase-js`) is the only backend interface
- All data operations through Supabase PostgreSQL with Row-Level Security (RLS)
- Authentication via Supabase Auth
- Realtime subscriptions, Storage, and Edge Functions as needed

**Logic Placement:**
- Prefer Postgres functions (via `supabase.rpc()`) for data operations
- Use Edge Functions only for external API integrations or complex orchestrations

### Code Quality

**Standards:**
- Favor simplicity over cleverness
- Small, focused, readable functions and components
- Inline documentation for non-obvious logic
- Zero linter errors, zero type errors

## Experience & Quality Standards

**Design Consistency:**
- Use shadcn/ui components exclusively; maintain consistent Tailwind design tokens
- Follow accessibility best practices (semantic HTML, ARIA labels, keyboard navigation)

**Testing & Validation:**
- All code must pass TypeScript compilation with strict mode
- All code must pass ESLint with zero warnings
- Unit tests for complex business logic and data transformations
- Integration tests for critical user flows

**Performance Targets:**
- First Contentful Paint (FCP) < 1.5s
- Time to Interactive (TTI) < 3.5s
- Lighthouse Performance score ≥ 90

## Delivery Workflow

**Spec-Kit Integration:**
- Use `/specify`, `/plan`, and `/tasks` commands to ensure alignment with these principles
- All specifications and plans should explicitly address architectural constraints
- Task breakdowns should reference relevant constitution sections

**Quality Gates:**
- Code reviews must verify adherence to architecture and quality standards
- Pull requests must include test coverage for new functionality
- Deployments must pass all automated checks (types, lints, tests)

## Governance

**Amendment Process:**
- Propose changes via discussion with documented rationale
- Update version following semantic versioning (MAJOR.MINOR.PATCH)
- Use `/constitution` command to apply changes and sync dependent templates
- Document impact on existing specifications and tasks

**Version Semantics:**
- MAJOR: Breaking changes to core architectural principles
- MINOR: New principles or significant clarifications
- PATCH: Editorial improvements or minor clarifications

**Version**: 1.0.0 | **Ratified**: 2025-09-28 | **Last Amended**: 2025-09-28
