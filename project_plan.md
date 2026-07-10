# Shift Notification Automation Tool — Project Plan

**Version 1.0 | April 2026**

---

## 1. Project Overview

### 1.1 Background

At a car wash in Canada, the next day's shifts are communicated to every employee via individual SMS text messages. Because customer traffic varies heavily with the weather, the next day's shifts are decided after close of business each day. Staffing also ramps up through the day — a small crew at opening, growing toward the afternoon — so each employee must be told a different start time.

Currently, after closing, the manager writes the shifts on the staff room whiteboard and then manually texts each employee one by one. This project builds a tool to streamline that work.

### 1.2 Goals

- Significantly reduce the time managers spend on shift notifications
- Centralize shift data, requested time off, working-hour limits, and related information
- Coexist with the existing whiteboard workflow rather than fully replacing it
- Achieve a setup that runs at $0 ongoing cost

### 1.3 Team

- 2 developers working collaboratively
- Users: 1 store manager, 1 assistant manager
- Employees covered: currently 15–16 (up to ~20)

---

## 2. Business Constraints and Requirements

### 2.1 Characteristics of Shift Management

- Shifts are decided after close of business the day before (no weekly/monthly batch scheduling)
- Each employee has a different start time (e.g. 9:00, 10:00, 11:00, 13:00)
- Which employees are off also changes daily
- The manager's own shift is fixed at 9:00 in principle, but varies when they are off
- The assistant manager covers scheduling when the manager is off

### 2.2 Employee Circumstances

- Many staff are on working-holiday or co-op visas, so turnover is frequent
- Some visa types impose weekly working-hour limits
- Some employees cannot work on fixed days of the week (e.g. second jobs)
- Employees request specific days or ranges off
- Employee phones are a mix of iOS and Android

### 2.3 Existing Workflow

- The staff room whiteboard is the master source of information
- Whiteboard layout: employee names down the left, dates/days across the top, shifts in each cell
- A contact/notes column sits between the names and the dates
- Employees photograph the whiteboard to check their shifts
- The manager texts each employee individually

---

## 3. Functional Requirements

### 3.1 Must-Have Features (MVP)

#### 3.1.1 Authentication

- Login for 2 accounts: manager and assistant manager
- Both have equal permissions

#### 3.1.2 Employee Management

- Add, edit, and remove employees
- Fields: name, phone number, visa type, weekly hour limit, recurring days off (weekday), notes
- Archive feature for departed employees

#### 3.1.3 Shift Entry Screen

- Whiteboard-style grid UI (rows: employees, columns: dates)
- Enter a shift in each cell (time picker or day off)
- Auto-fill the manager's fixed 9:00 start
- Auto-apply recurring weekday days off
- Auto-apply and visually indicate requested time-off ranges

#### 3.1.4 Requested Time Off Management

- Register time-off requests per employee with a date range
- Highlight off ranges on the shift entry screen

#### 3.1.5 Shift Notification Sending

- Pre-send preview screen (review every employee's message at once)
- Message generation from a template plus shift-time variables
- One-tap individual looped sending via iOS Shortcut integration
- Fallback SMS-link buttons (`sms:` scheme)
- Send history storage

### 3.2 Phase 2 Features (after MVP stabilizes)

- Shift acknowledgment tracking (manual, by the manager)
- Alerts for employees unconfirmed by a set time
- Automatic weekly-hours totals compared against visa limits

### 3.3 Phase 3 Features (future)

- Automatic shift reading from whiteboard photos (Claude Vision API)
- Automatic capture of employee replies (if Twilio is adopted)
- Long-term shift history analysis and working-hours reports

---

## 4. Tech Stack

| Category       | Technology                   | Rationale                                    |
| -------------- | ---------------------------- | -------------------------------------------- |
| Frontend       | Next.js + React + TypeScript | App Router, mature ecosystem                 |
| Styling        | Tailwind CSS                 | Utility-first, development speed             |
| Backend/DB     | Supabase (PostgreSQL)        | Auth, DB, and API in one platform            |
| Auth           | Supabase Auth                | Email/password auth is sufficient            |
| Hosting        | Vercel                       | Next.js integration, free tier is sufficient |
| SMS sending    | iOS Shortcuts + phone plan   | $0 cost, uses the existing phone plan        |
| Source control | GitHub                       | PR-based collaborative workflow              |
| Dev tooling    | Claude Code                  | Available to both developers                 |

### 4.1 Running Costs

The MVP phase runs entirely free. The free tiers of each service comfortably cover 15–20 employees.

- Vercel Hobby: sufficient within the free tier (personal use)
- Supabase Free Tier: 500 MB DB, up to 50,000 monthly auth users free
- GitHub: private repositories are free
- SMS sending: the manager's personal phone plan
- Domain: the Vercel-provided subdomain (`.vercel.app`)

---

## 5. System Architecture

### 5.1 Overall Flow

The system operates as follows:

```
[1] Manager logs into the web app in a browser
[2] Initial employee data is set up on the employee management screen
[3] The next day's shifts are entered on the shift entry screen (whiteboard-style)
[4] Entered data is stored in Supabase PostgreSQL
[5] The manager visually reviews every message on the send preview screen
[6] The manager launches the iOS Shortcut on their iPhone
[7] The Shortcut fetches the send data from the web app's API endpoint
[8] The Shortcut loops through the list, sending an individual SMS to each employee
[9] SMS goes out via the manager's phone plan ($0 cost)
```

### 5.2 Data Model (main tables)

| Table                | Purpose / key columns                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------- |
| `managers`           | Manager accounts / `id`, `email`, `name`, `role(manager\|assistant)`                          |
| `employees`          | Employee info / `id`, `name`, `phone`, `visa_type`, `weekly_hour_limit`, `notes`, `is_active` |
| `recurring_days_off` | Fixed weekly days off / `id`, `employee_id`, `day_of_week (0-6)`                              |
| `requested_days_off` | Requested time off / `id`, `employee_id`, `start_date`, `end_date`, `reason`                  |
| `shifts`             | Shift data / `id`, `employee_id`, `shift_date`, `start_time`, `is_off`, `status`              |
| `message_logs`       | Send history / `id`, `shift_id`, `sent_at`, `message_body`                                    |

### 5.3 Main API Design

- `GET /api/employees` - list employees
- `POST /api/employees` - add an employee
- `PATCH /api/employees/:id` - update an employee
- `GET /api/shifts?date=YYYY-MM-DD` - fetch shifts for a date
- `POST /api/shifts/bulk` - bulk-register multiple shifts
- `GET /api/shifts/messages?date=YYYY-MM-DD` - fetch send data for the Shortcut
- `POST /api/shifts/messages/sent` - record send completion

---

## 6. Screen Design

### 6.1 Main Screens

#### 6.1.1 Login

- Email and password authentication
- Two accounts expected: manager and assistant

#### 6.1.2 Dashboard

- Entry point into next-day shift entry
- Summary of unacknowledged shifts (Phase 2)
- Navigation to employee management and time-off management

#### 6.1.3 Shift Entry (main screen)

- Grid UI reproducing the whiteboard
- Rows: employee names (pinned left)
- Columns: dates and weekdays (pinned top, horizontally scrollable)
- Each cell: time picker or day-off button
- Requested time-off ranges visualized with color (e.g. grayed out)
- Recurring weekday days off applied automatically

#### 6.1.4 Employee Management

- List, add, edit, and archive employees
- Edit each employee's notes, visa info, and recurring days off

#### 6.1.5 Requested Time Off Management

- Register off ranges per employee
- Calendar-style overview

#### 6.1.6 Send Preview

- List of every employee's message based on the next day's shifts
- Per-employee SMS-link buttons (fallback when the iOS Shortcut is unavailable)
- "Launch Shortcut" button (iOS)

---

## 7. iOS Shortcut Integration

### 7.1 Shortcut Behavior

1. Send a request to the web app's send-data API endpoint
2. Parse the recipient list from the JSON response
3. Loop over each employee
4. Send an individual SMS with the Send Message action (Show When Run = OFF)
5. After all sends complete, call the completion API to record the log

### 7.2 Example API Response

```json
{
  "date": "2026-04-25",
  "messages": [
    { "phone": "+1...", "body": "明日 4/25 (土) は 9:00 からです。" },
    { "phone": "+1...", "body": "明日 4/25 (土) はお休みです。" }
  ]
}
```

(Message bodies come from the templates stored in the database; the examples show the original Japanese seed templates.)

### 7.3 Caveats

- Specifying multiple phone numbers at once creates a group SMS, exposing replies to all recipients
- Always send individually inside a loop
- Implement lightweight token auth on the API to prevent unauthorized access
- Install the Shortcut on both the manager's and assistant manager's iPhones

---

## 8. Development Plan

### 8.1 Phases

| Phase     | Rough duration | Scope                                                       |
| --------- | -------------- | ----------------------------------------------------------- |
| Phase 0   | 1 week         | Environment setup, design decisions, GitHub setup           |
| Phase 1   | 3–4 weeks      | MVP build (auth, employee management, shift entry, sending) |
| Phase 1.5 | 1–2 weeks      | Real-world testing, bug fixes, UI polish                    |
| Phase 2   | 2–3 weeks      | Acknowledgment tracking, working-hours totals               |
| Phase 3   | As needed      | Photo reading, Twilio integration, etc.                     |

### 8.2 Phase 0 Task Details

1. Create the GitHub organization or repository
2. Initial Next.js + TypeScript + Tailwind setup
3. Create the Supabase project and design the initial schema
4. Configure the Vercel integration
5. Organize environment variable management (create `.env.example`)
6. Document setup steps in the README
7. Decide on branching strategy and PR workflow
8. Minimal implementation of the auth flow

### 8.3 Phase 1 Task Details

- Employee CRUD (screens + API)
- Requested time off registration
- Shift entry grid UI
- Auto-apply logic for recurring days off and requested time off
- Auto-fill logic for the manager's fixed 9:00 start
- Send preview screen
- SMS link generation
- Send-data API endpoint
- Build and test the iOS Shortcut
- Send logging

---

## 9. Collaboration Workflow

### 9.1 Branching Strategy

- `main`: production deploys only, no direct commits
- `develop`: integration branch for development
- `feature/xxx`: per-feature working branches
- PR from each feature branch into `develop`, merge after review
- Merge `develop` into `main` after verifying stability

### 9.2 Commit Rules

- Follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, etc.)
- Commit messages in one consistent language (English or Japanese)
- 1 commit = 1 logical change

### 9.3 Review Process

- PRs describe the change and include verification steps
- Merge after at least 1 review approval
- Confirm CI passes

### 9.4 Communication

- Track tasks with GitHub Issues
- Progress check roughly once a week (in person or online)
- Discuss and record open questions in Issues or PR comments

---

## 10. Risks and Mitigations

| Risk                                                | Impact                                             | Mitigation                                                         |
| --------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| Wrong shifts sent to everyone due to input mistakes | Direct business impact, loss of trust              | Mandatory visual review on the pre-send preview screen             |
| Messages go out as a group SMS                      | Privacy issue; replies visible to other recipients | Always send individually inside the Shortcut loop                  |
| Unauthorized access to the API endpoint             | Employee data leak                                 | Protect the API with an auth token                                 |
| Manager forgets to update the whiteboard            | App and reality drift apart                        | Keep the whiteboard as the source of truth in the operating policy |
| Exceeding the Supabase free tier                    | Service outage                                     | Monitor usage; clean up logs if exceeded                           |
| Manager turnover / handover                         | No one to operate the tool                         | Maintain README and ops manual; share with the assistant manager   |

---

## 11. Success Criteria

### 11.1 MVP Completion Criteria

- Both managers can log in and enter shifts
- Next-day shifts can be entered for 15+ employees
- Individual SMS goes out to everyone via the iOS Shortcut
- Requested time off and recurring days off are applied correctly
- Content can be reviewed on the pre-send preview

### 11.2 Measuring Operational Impact

- Reduction in shift notification time (vs. before)
- Fewer shift notification mistakes
- Manager and assistant manager satisfaction

---

## 12. Future Possibilities

Once MVP operation stabilizes, the following expansion directions are possible.

### 12.1 Feature Expansion

- Automatic reading of whiteboard photos (Claude Vision API)
- Automatically capturing and confirming employee replies (Twilio)
- Long-term shift history analysis and working-hours reports
- Employee-initiated time-off request submissions

### 12.2 Broader Rollout

Based on MVP results, offering the tool to other small businesses with similar problems (other car washes, restaurants, retail) is a future option. However, the initial goal of this project is strictly improving our own store's operations; any broader rollout is a separate consideration.
