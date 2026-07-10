<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# CLAUDE.md

This file provides guidelines for Claude Code when working in this project.

## Project Overview

A shift notification automation tool for a car wash in Canada. It streamlines the manager's daily task of entering the next day's shifts and sending an individual SMS text message to each employee.

### Problem Being Solved

- The manager texts 15–20 employees individually every day to communicate their shifts
- Each employee has a different shift start time (e.g. 9:00, 10:00, 11:00, 13:00)
- The next day's shifts are decided after close of business that day (weekly/monthly batch scheduling is not possible)

### Primary Users

- 1 store manager
- 1 assistant manager (covers scheduling when the manager is off)

### Key Design Principles

- Maintain **$0 running cost**. No paid services.
- SMS is sent from the manager's personal phone plan (no SMS API)
- The tool coexists with the existing whiteboard workflow rather than fully replacing it
- Only 2 managers use the app, so complex permission management is unnecessary

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + React + TypeScript
- **Styling**: Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password)
- **Hosting**: Vercel
- **SMS sending**: iOS Shortcuts + the manager's phone plan
- **Source control**: GitHub

### Important Constraints

- **Operate within free tiers.** Do not exceed Supabase Free Tier or Vercel Hobby limits.
- **Maximum of 2 users** (manager, assistant manager). Prefer simplicity over scalability.

## Directory Structure

```
/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Pages behind authentication
│   ├── api/               # API endpoints
│   └── layout.tsx
├── components/            # Reusable components
│   ├── ui/               # Generic UI components
│   └── features/         # Feature-specific components
├── lib/                  # Utilities and clients
│   ├── supabase/        # Supabase clients
│   ├── utils/           # Generic helpers
│   └── validations/     # Zod schemas, etc.
├── types/               # TypeScript type definitions
├── supabase/           # Migrations
│   └── migrations/
└── public/             # Static assets
```

Follow this structure when creating new files. Before adding a new directory, consider whether an existing one already fits.

## Data Model

Main tables:

- `managers`: manager accounts (id, email, name, role)
- `employees`: employee info (id, name, phone, visa_type, weekly_hour_limit, notes, is_active)
- `recurring_days_off`: fixed weekly days off (id, employee_id, day_of_week)
- `requested_days_off`: requested time off (id, employee_id, start_date, end_date, reason)
- `shifts`: shift data (id, employee_id, shift_date, start_time, is_off, status)
- `message_logs`: send history (id, shift_id, sent_at, message_body)

See `docs/project_plan.md` in the repository for details.

## Coding Conventions

### TypeScript

- `any` is prohibited in principle. If unavoidable, document the reason in a comment.
- Use Supabase's auto-generated types for data fetched from the database.
- Write explicit types for function parameters and return values (don't over-rely on inference).

### React/Next.js

- Use the App Router. Do not use the Pages Router.
- Default to Server Components; use Client Components (`"use client"`) only when necessary.
- Prefer fetching data in Server Components.
- Use Server Actions for form handling.

### Styling

- Use Tailwind CSS utility classes.
- Avoid custom CSS in principle.
- Responsive support is required (managers may operate from their phones).
- Use Tailwind's default tokens for colors and spacing.

### Naming Conventions

- File names: kebab-case (e.g. `employee-form.tsx`)
- Component names: PascalCase (e.g. `EmployeeForm`)
- Functions/variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/interfaces: PascalCase

### Language

- Comments: English
- Variable and function names: English
- UI text: English (see the localization work in PR #46; historical note: the UI was originally Japanese for the initial Japanese-speaking manager)
- Avoid hardcoding UI strings where practical; prefer extracting them to constants

## Collaboration Rules

### Branching Strategy

- `main`: production deploys only, no direct commits
- Create a branch per Issue (auto-generated from the GitHub Issue)
- Naming: `[issue number]-[short-description]` (the format GitHub generates)

### Commit Conventions

Follow Conventional Commits:

- `feat:` new feature
- `fix:` bug fix
- `refactor:` refactoring
- `docs:` documentation
- `style:` formatting changes
- `chore:` configuration, etc.

Example: `feat: implement login page (#6)`

Include the related Issue number in the commit message.

### Pull Requests

- All changes are merged to main via PR
- Include `Closes #[issue number]` in the PR body so the Issue closes automatically on merge
- At least 1 review approval is required
- Self-review before requesting review (read through the entire diff)

## Guidelines for Working with Claude Code

### Key Points

#### Allowed

- Implementations that match the existing code style
- Adding or fixing type definitions
- Adding tests
- Extending documentation
- Removing dead code

#### Requires confirmation first

- Adding new dependencies (verify they are lightweight and stay within free tiers)
- Database schema changes
- Adding environment variables
- Changing the authentication flow
- Changing how API endpoints authenticate

#### Never do

- **Commit `.env.local`**
- Commit or push directly to `main`
- Edit existing migration files (add a new migration instead)
- Add external API usage that could exceed free tiers
- Log employee phone numbers or personal information
- Use real phone numbers in test data

### Before Starting a Task

When picking up a new task:

1. Read the related Issue and understand the requirements
2. Confirm the branch is based on the latest main
3. Reference similar existing code and match its style
4. Consider whether data model or API changes are needed

### When Unsure

- Read the existing code
- Refer to `docs/project_plan.md`
- If still unclear, ask the user instead of guessing

## iOS Shortcut Integration

A distinctive part of this project is the iOS Shortcut integration.

### Design Notes

- The API endpoints accessed by the Shortcut live under `/api/shifts/messages`
- Auth is a simple fixed token known only to the managers
- Responses are always JSON, structured for easy parsing in the Shortcut
- Phone numbers are returned in E.164 format (`+1XXXXXXXXXX`)

### Example API Response

```json
{
  "date": "2026-04-25",
  "messages": [
    { "phone": "+1XXXXXXXXXX", "body": "明日 4/25 (土) は 9:00 からです。" },
    { "phone": "+1XXXXXXXXXX", "body": "明日 4/25 (土) はお休みです。" }
  ]
}
```

(Message bodies come from the templates stored in the database; the examples above show the original Japanese seed templates.)

### Avoid Group SMS

The Shortcut sends to each recipient individually in a loop, so the API only needs to return an array. Do not return a single combined broadcast text.

## Security & Privacy

- Treat employee phone numbers as sensitive personal information
- Never hardcode phone numbers in the frontend
- Never include phone numbers or real names in logs or error output
- Always configure Supabase RLS so only authenticated managers can access data

## Testing Policy

- Do not write exhaustive tests at the MVP stage (prioritize effort-to-value)
- However, write unit tests for:
  - Shift time aggregation logic
  - Weekly working-hours calculation
  - Message template variable substitution
  - Phone number validation and normalization
- E2E tests are not needed at this time

## Environment Variables

Set the following in `.env.local` (copy from `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-side only
SHORTCUT_API_TOKEN=                # iOS Shortcut auth
```

When adding a new environment variable, update `.env.example` at the same time.

## Deployment

- Merging to main deploys automatically to Vercel
- Preview deploys: generated automatically when a PR is opened
- Environment variables are managed in the Vercel project settings

## Reference Documents

Refer to these documents in the repository as needed:

- `docs/project_plan.md`: detailed project plan
- `docs/github_issues.md`: Issue list and suggested order
- `README.md`: setup and basics

## Troubleshooting

- Build errors: check for type errors and import errors
- Supabase connection errors: re-check environment variables
- Shortcut not working: verify the API endpoint passes authentication
- Styles not applied: check Tailwind purge settings and `content` in `tailwind.config.ts`
