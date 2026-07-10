# Senshaya Shift Manager

A shift notification automation tool for a car wash in Canada. Managers enter the next day's shifts, and the tool streamlines the process of sending individual SMS messages to each employee via an iOS Shortcut.

See [project_plan.md](./project_plan.md) for detailed background and requirements.

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (PostgreSQL + Auth)
- **Vercel** (hosting)
- iOS Shortcuts (SMS sending)

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm
- A Supabase account and project
- A Vercel account (for deploy verification; not required for local-only development)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/Tomoya300/senshaya-shiftmanager.git
cd senshaya-shiftmanager

# 2. Install dependencies
npm install

# 3. Create the environment variables file
cp .env.example .env.local
# Open .env.local and set the Supabase URL and Anon Key
# (found in Supabase Dashboard → Project Settings → API)

# 4. Start the dev server
npm run dev
```

Open `http://localhost:3000` — if the app renders, you're good.
Visit `http://localhost:3000/test-connection` to verify the Supabase connection (Status: OK means it's reachable).

### Applying the Supabase Schema

When setting up a fresh environment:

1. Create a Supabase project
2. In Dashboard → SQL Editor, run the SQL files in [supabase/migrations/](./supabase/migrations/) in chronological order
3. In Dashboard → Authentication → Users, create your own user
4. In the SQL Editor, insert your row into `public.managers`:
   ```sql
   insert into public.managers (id, email, name, role)
   values ('<auth.users.id>', '<email>', '<your name>', 'manager');
   ```

## Environment Variables

| Variable                        | Purpose                                             | Required when                    |
| ------------------------------- | --------------------------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                                | Always                           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key                                   | Always                           |
| `NEXT_PUBLIC_SITE_URL`          | Absolute redirect URL used in password-reset emails | Always                           |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase Service Role Key (server-side only)        | After admin features are enabled |
| `SHORTCUT_API_TOKEN`            | Auth token for the iOS Shortcut                     | After Shortcut integration       |

Value for `NEXT_PUBLIC_SITE_URL`: `http://localhost:3000` in development, `https://<project>.vercel.app` in production.

When adding a new variable, update `.env.example` as well.

## Directory Structure

```
/
├── app/                  # Next.js App Router (pages, layouts, API routes)
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Pages behind authentication
│   └── api/             # API endpoints
├── components/          # Reusable components
│   ├── ui/             # Generic UI components
│   └── features/       # Feature-specific components
├── lib/                # Utilities and clients
│   ├── supabase/      # Supabase clients (browser/server)
│   ├── utils/         # Generic helpers
│   └── validations/   # Zod schemas, etc.
├── types/             # TypeScript type definitions
├── supabase/          # Migrations
│   └── migrations/    # SQL migrations
└── public/            # Static assets
```

See [CLAUDE.md](./CLAUDE.md) for detailed naming and coding conventions.

## Common Commands

| Command                | Purpose                        |
| ---------------------- | ------------------------------ |
| `npm run dev`          | Start the dev server           |
| `npm run build`        | Production build               |
| `npm run start`        | Serve the production build     |
| `npm run lint`         | Run ESLint                     |
| `npm run format`       | Format all files with Prettier |
| `npm run format:check` | Prettier check (for CI)        |

## Development Workflow

### Branching Strategy

- `main` is for production deploys. Direct pushes are prohibited
- Create a branch per Issue (named `<issue#>-<short-description>`)
- The easiest way is "Create a branch" on the GitHub Issue page

### Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `refactor:` refactoring
- `docs:` documentation
- `style:` formatting changes
- `chore:` configuration, etc.

Example: `feat: implement login page (#6)`

### Pull Requests

1. Work on a branch → commit → push
2. Open a PR on GitHub (the template is inserted automatically)
3. Include `Closes #<issue number>` in the PR body so the Issue closes automatically on merge
4. Review → merge
5. Merging to main triggers an automatic Vercel deploy

### Migration Workflow

- Never edit existing migration files
- For schema changes, add a new migration file as `supabase/migrations/<timestamp>_<description>.sql`
- Verify the SQL locally, then apply it to production via the Supabase Dashboard SQL Editor

## Deployment

Merging to `main` deploys automatically to Vercel. A preview deploy is generated for each PR, so behavior can be verified before merging.

Environment variables are managed in the Vercel dashboard (set separately for Production and Preview).

## Documentation

- [project_plan.md](./project_plan.md) — Overall project plan and requirements
- [CLAUDE.md](./CLAUDE.md) — Working guide and coding conventions for Claude Code

## License

Private project. No plans to open-source.
