---
name: Build on existing code, don't reinvent
description: User explicitly wants to build on top of existing NestJS+Next.js monorepo, not start fresh
type: feedback
---

Build on top of the existing monorepo at /Users/prat/Documents/sudo/kalacube/. Do NOT create new repos or start from scratch.

**Why:** User said "I want to use this and build on top of this now — not reinventing the wheel." The existing backend (auth, user profiles, S3, email) and frontend (auth flows, dashboard, profile pages) are working.

**How to apply:** When adding features or redesigning, modify existing files in backend/ and frontend/. Add new modules incrementally. Preserve existing API contracts and database schemas.
