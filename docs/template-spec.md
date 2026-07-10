# Message Template Specification

> Issue: [#11 Message template feature](https://github.com/Tomoya300/senshaya-shiftmanager/issues/11)
> Stage 1 deliverable — Phase 1 (MVP)

> Note: format examples in this document (e.g. `4月26日(日)`) reflect the original Japanese-language templates this spec was written against. The substitution engine itself is language-agnostic. Day-of-week labels were later switched to English in PR #41.

## 1. Overview

Defines the placeholder and variable-substitution specification for the feature that manages the message templates used for shift notifications.

Managers edit templates on the settings screen; when shifts are sent, variables are replaced with actual values to produce the message.

## 2. Placeholder Syntax

**Single curly braces** `{variable_name}` are used.

| Form     | Example                             |
| -------- | ----------------------------------- |
| Template | `明日 {date} は {time} からです`    |
| Rendered | `明日 4月26日(日) は 9:00 からです` |

### Naming Rules

- Variable names may use **lowercase letters and underscores only** (regex: `[a-z][a-z0-9_]*`)
- No uppercase, non-ASCII characters, or hyphens
- Examples: `date` `time` `end_time` `name` (OK) / `Date` `日付` `end-time` (NG)

## 3. Available Variables (MVP)

| Variable | Description      | Example output | Data source       |
| -------- | ---------------- | -------------- | ----------------- |
| `{date}` | Shift date       | `4月26日(日)`  | shifts.date       |
| `{time}` | Shift start time | `9:00`         | shifts.start_time |

### Future candidates (not implemented in Stage 1)

- `{end_time}` — shift end time
- `{name}` — employee name
- `{date_short}` — short date form like `4/26`
- `{shop_name}` — store name

## 4. Formatting

**Fixed formats** are used. Format specifiers (syntax like `{date:M月D日}`) are not supported.

| Variable | Fixed format                      | Example        |
| -------- | --------------------------------- | -------------- |
| `{date}` | `M月D日(曜)`                      | `4月26日(日)`  |
| `{time}` | `H:mm` (24-hour, no zero padding) | `9:00` `18:30` |

> If a different format is ever needed, the policy is to add a new variable name (e.g. `{date_short}` = `4/26`).

### Timezone

All dates and times are rendered in **JST (Asia/Tokyo)**.

## 5. Escaping

**Backslash escaping** is used.

| Input      | Output                                 |
| ---------- | -------------------------------------- |
| `\{date\}` | `{date}` (left as-is, not substituted) |
| `\\`       | `\`                                    |
| `\n`       | `\n` (no special handling; literal)    |

### Line Breaks

Line breaks (LF) inside the template body are passed through to the output. `\n` is not processed as an escape sequence.

## 6. Undefined Variables

**Left as-is.**

| Template                      | Result                        |
| ----------------------------- | ----------------------------- |
| `今日は {undefined_var} です` | `今日は {undefined_var} です` |

Rationale: makes missing data and typos easy to notice; safer than substituting an empty string.

> The preview screen (Stage 5) highlights undefined variables in a **warning color** so the manager notices them.

## 7. Missing Data

For a defined variable whose value is `null` / `undefined`:

| Case                            | Result                                               |
| ------------------------------- | ---------------------------------------------------- |
| `{time}` but start_time is NULL | `{time}` (left as-is, same as an undefined variable) |

Rationale: there is no need to distinguish "data exists but is empty" from "undefined due to a typo" in the output. Both are surfaced as "could not be substituted."

## 8. Sample Templates

The two examples from the issue are provided as the initial seed.

### Attendance template (type: `attend`)

```
明日 {date} は {time} からです
```

Rendered: `明日 4月26日(日) は 9:00 からです`

### Day-off template (type: `off`)

```
明日 {date} はお休みです
```

Rendered: `明日 4月26日(日) はお休みです`

## 9. Function Signature (implemented in Stage 4)

```ts
type TemplateVars = {
  date?: string
  time?: string
  // add here when extending
}

/**
 * Substitutes variables into a template string.
 * - Undefined variables (absent from vars, or with null/undefined values) are left as-is.
 * - Handles the \{ \} \\ escapes.
 * @returns the rendered string
 */
function renderTemplate(template: string, vars: TemplateVars): string
```

## 10. Decision Summary

| Item           | Decision                        |
| -------------- | ------------------------------- |
| Syntax         | `{var}` single curly braces     |
| Variable names | lowercase letters + underscores |
| MVP variables  | `{date}` `{time}`               |
| Date format    | fixed (`M月D日(曜)`)            |
| Time format    | fixed (`H:mm`)                  |
| Timezone       | JST                             |
| Escaping       | backslash (`\{` `\}` `\\`)      |
| Undefined vars | left as-is                      |
| Missing data   | left as-is                      |

---

**Stage 1 completion checklist**

- [x] Placeholder syntax decided
- [x] MVP variable list defined
- [x] Format specification decided
- [x] Escape specification decided
- [x] Undefined-variable handling decided
- [x] Sample templates defined
