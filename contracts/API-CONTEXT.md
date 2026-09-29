# Barkfield Road Admin API — context for the UI project

**Read this before writing any code that calls the API.** It covers what `openapi.json` cannot
express: how authentication actually works, what the error statuses mean *in this application*, and
the handful of conventions every endpoint follows. The generated spec covers shapes; this covers
behaviour.

Companion file: `PAGES.md` — the screen-by-screen map of which endpoints feed what.

---

## 1. The contract file

`contracts/openapi.json` in the API repo.

<!-- BEGIN GENERATED contract-stats — written by contracts/regenerate.ps1; do not edit by hand -->
| | |
|---|---|
| Version | OpenAPI 3.1.1 |
| Paths | 91 |
| Operations | 110 |
| Schemas | 116 |
| Permission-gated operations | 102 |
| Anonymous operations | 5 |
| Signed-in, no permission | 3 |
| Enums with named values | 13 |
<!-- END GENERATED contract-stats -->

**Generate your client types from it. Do not hand-write request or response interfaces.** The API
repo regenerates the file with `./contracts/regenerate.ps1`, so a DTO change shows up as a diff in
the spec rather than as a runtime surprise here.

Three things in it are custom extensions, added because the default document left them out:

| Extension | Meaning |
|---|---|
| `x-required-permission` | The permission string the caller must hold |
| `x-anonymous` | No token needed — do not wait for sign-in |
| `x-enum-names` / `x-enum-varnames` | Names for the integer enum values |

If your generator drops unknown `x-` keys, read them out of the JSON directly. The permission map in
particular should come from here rather than being retyped — that is the whole reason it is in the
document.

---

## 2. Authentication

A split model. Get this right once, in the API client, and nothing else has to think about it.

```
POST /api/auth/login   { email, password }
  → 200 { accessToken, email, userId }
  → also sets an httpOnly cookie named "refreshToken"
```

- **The access token is in the response body.** Keep it in memory. It is a short-lived JWT and goes
  on every other call as `Authorization: Bearer <token>`.
- **The refresh token is an httpOnly cookie.** JavaScript cannot read it, and does not need to.
- **Every request must send `credentials: 'include'`**, not only the refresh call — the cookie is
  scoped to the API origin and the browser will not attach it otherwise.

### The refresh rule

```
any call → 401
  → POST /api/auth/refresh-token      (no bearer header; the cookie is the credential)
      → 200 { accessToken, ... }  → retry the original request ONCE
      → anything else              → clear state, go to the login screen
```

**Three hard rules, all of which will bite if ignored:**

1. **Retry once, never in a loop.** A second 401 after a fresh token means something other than
   expiry.
2. **Serialise refreshes.** If five requests 401 at the same time they must await *one* shared
   refresh promise, not fire five. The API rotates the refresh token on every use and treats a
   token that has already been rotated away as theft — **it revokes every session for that user.**
   A refresh race will log the user out and look like a random bug.
3. **Never abort the refresh.** `POST /api/auth/refresh-token` rotates the token and revokes the old
   one **before the response is written**. A client that aborts it — an `AbortController`, a timeout,
   an unmount — can be left holding a revoked cookie; its next refresh is then treated as token reuse
   and every session for that user is revoked. Send it with no abort signal. A caller that cannot
   wait should stop waiting, not cancel the request, and must not start another refresh while one is
   still running.

⚠️ **Some aborts cannot be prevented from the client.** If a user reloads or closes the tab while a
refresh is in flight, the browser cancels it and no client code can stop that. Today that leaves the
session dead. Whether the API should tolerate it — by letting a just-rotated token be presented again
for a few seconds and returning the same new token rather than treating it as theft — is an open
question with the API side. Until it changes, treat an unexplained sign-out after a reload as this.

`POST /api/auth/logout` clears the cookie server-side. Call it; do not just drop the token.

### Storing the access token

In memory, in the client module. Not `localStorage`. If you want a refresh to survive a page reload,
call `refresh-token` on app start — the cookie is still there, so a successful call gives you a new
access token and the user stays signed in without the token ever being written to disk.

---

## 3. Permissions

`GET /api/users/me` returns the signed-in user, including:

```jsonc
{
  "id": "…", "name": "…", "email": "…",
  "isAdmin": false,
  "roles": [ { "id": "…", "name": "Staff", … } ],
  "permissions": ["billing:charge", "billing:view", "customer:create", …]
}
```

**Gate every control on `permissions`, never on `roles` or role names.** Roles are a grouping that
the shop can re-cut in the database; the permission list is the thing the API itself enforces. An
`isAdmin` user comes back holding *every* permission, so the flat check works for them too with no
special case.

Fetch it once after login, hold it in app state, and refetch after sign-in only.

There are exactly **19** permissions. Which endpoint needs which is in the spec —
`x-required-permission` — so build the lookup from the document.

```
user:view      user:create      user:edit       user:delete
customer:view  customer:create  customer:edit   customer:delete
product:view   product:manage
subscription:view   subscription:manage
delivery:view  delivery:manage  delivery:pack
dispatch:view  dispatch:send
billing:view   billing:charge
```

Worth knowing while designing screens:

- **`delivery:pack` and `delivery:manage` are different jobs.** Packing is the shop-floor work
  (mark a line received, substituted, shorted, pack the box). Managing is scheduling and outcomes
  (cancel, change the window, mark delivered by hand). A packer may well have one and not the other.
- **`dispatch:view` is not `dispatch:send`.** A driver can see the dispatch screen and load list and
  cannot push the day to Routific.
- **Staff hold `billing:charge` deliberately** — they are the ones who run the day's charges. Do not
  design the charge button as manager-only.
- Three endpoints need only a signed-in user and carry no permission at all: `POST /api/auth/logout`,
  `GET /api/users/me`, `POST /api/users/me/change-password`.

---

## 4. Errors

**There are two error shapes, and you have to handle both.**

Anything thrown inside the app is caught by one middleware and returned as:

```json
{ "message": "…", "status": 409 }
```

But **model-validation failures never reach that middleware.** `[ApiController]` short-circuits them
before the action runs and returns standard `ProblemDetails`:

```json
{ "type": "…", "title": "One or more validation errors occurred.",
  "status": 400, "errors": { "password": ["…"] } }
```

So: a 400 may be either shape depending on whether it came from a data-annotation attribute or from a
domain rule. The spec types most error responses as `ProblemDetails`, which is what ASP.NET fills in by
default and is **not** what the middleware actually returns — trust this section over the spec for
error bodies. Read `message` first, fall back to `title` plus `errors`.

Only deliberately-raised errors carry a real message; anything unexpected is replaced with a generic
one, because an exception's text can contain connection strings or SQL. So **a 500's message is never
worth showing** — show your own wording. A 400/404/409's message *is* written for a person and can be
surfaced as-is.

| Status | What it means here | What the UI should do |
|---|---|---|
| **400** | Validation, or a domain rule refused the action | Show `message` on the form. It is written for staff |
| **401** | Access token missing or expired | The refresh dance in §2. Never show this to the user |
| **403** | Signed in, lacks the permission | Should not happen if you gated on `permissions`. Treat as a bug to log |
| **404** | Unknown id | Show `message` |
| **409** | **Someone else changed this record while you were editing it** | See below — this is a workflow, not an error |
| **429** | Login rate limit (30/min per IP) | "Too many attempts, wait a moment." Only reachable on login |
| **499** | Request cancelled | Ignore. It is usually your own aborted fetch |
| **501** | Endpoint deliberately not implemented | Should not appear in the UI |
| **502** | Square or Routific | See below |
| **503** | Database unavailable | Full-page retry state |

### 409, and what it does and does not protect

⚠️ **Corrected.** An earlier version of this file said a 409 means someone else changed the record
while you had the form open. **It does not, and cannot as the API stands.**

No write endpoint accepts a revision from the client — there is no `revision` field in any request body
and no `If-Match` header. The server reads the record, applies the change and saves it against the
revision it read microseconds earlier. So a 409 means **two writes overlapped on the server**: two
clicks at once, a staff action landing at the same moment as a Routific webhook, a batch endpoint
racing something else.

What this leaves uncovered: load a record, wait ten minutes while somebody else edits it, then save —
**your save wins and their change is lost, with no 409.** Last write wins on stale data.

Two consequences for the UI:

- **Still build reload-and-reapply on a 409.** It is rarer than implied, but it is real and the
  `message` is already written for staff. Never auto-retry, and never show "Error 409".
- **Do not rely on the API to protect a long-lived form.** Re-read before save on anything a user may
  have sat on, and keep edit forms short-lived where you can.

Whether writes should carry the revision back is an open question with the API side. If that changes,
this section changes with it.

### 502 has two distinct causes

Both are upstream, but they need opposite reactions:

- `"An upstream service is currently unavailable."` — Square or Routific is down or unreachable.
  Retrying later is reasonable.
- `"… rejected our credentials: … A new API token has to be issued."` — an API token has **expired**.
  Retrying will never work. This needs an administrator, and the message says so. Surface it
  prominently rather than as a transient toast; Routific tokens do expire in normal operation.

### Charges and pushes do not use error statuses for business outcomes

A refused card is **200** with the outcome in the body, not a 4xx. Same for a Routific push that some
orders failed. A batch of thirty charges returns one list of results — successes, declines and
failures together — and the screen should show that list rather than a single success/failure state.
Read the response body, not just the status.

---

## 5. Conventions across every endpoint

**Paging.** List endpoints return:

```jsonc
{ "items": [...], "totalCount": 0, "pageNumber": 1, "pageSize": 25,
  "totalPages": 0, "hasNextPage": false, "hasPreviousPage": false }
```

Query parameters are `pageNumber`, `pageSize` (clamped server-side to 1–200), `sortBy`,
`sortDescending`. `sortBy` only accepts a fixed set of keys per endpoint — anything else silently
falls back to the default, so it will not error, it will just ignore you.

⚠️ **Corrected.** An earlier version said the accepted keys are in the spec. **They are not** — the
parameter is typed only as a string. Until that changes, the keys live in the filter records in the API
repo (`AllowedSortKeys` on `CustomerFilter`, `UserFilter`, `DeliveryFilter`,
`SubscriptionFilter`, `ProductFilter`, and `AllowedLineSortKeys` / `AllowedProductSortKeys` on
`ProcurementFilter`). Ask for the list rather than guessing, and do not offer a column sort you have
not confirmed — it will look broken rather than error.

**Dates and times are UTC, always.** `DateTime` fields serialize as ISO-8601. Convert to local for
display, convert back to UTC before sending. Date-only concepts (a delivery day, a schedule date)
still arrive as a full timestamp at midnight — read the date part and ignore the time, and never
apply a timezone shift to them or a Tuesday delivery becomes Monday.

Times of day (a delivery window) are `TimeOnly`, serialized `"HH:mm:ss"`. No date, no zone — they are
wall-clock times at the customer's door.

**Money is `decimal`, serialized as a JSON number.** Do not round it for redisplay. Note that
`amountCharged` (what Square actually took) can differ from `total` (our estimate at snapshotted
prices) — Square prices from its own live catalog and is the source of truth. Show both where they
differ; that difference is meaningful, not a bug.

**Enums are integers.** Names are in the spec's `x-enum-names`. Most read DTOs also carry a
`…Name` string beside the value (`statusName` next to `status`) which is fine for display — but
anything you **send** must be the number.

**`revision` round-trips.** If a write endpoint's request body has a revision field, send back the one
you read. Do not invent or increment it.

**Soft delete.** `DELETE` almost never destroys anything; it deactivates, and there is a matching
`POST …/reactivate`. So "deleted" rows can come back, and list endpoints take an include-inactive
flag. Design the UI as archive/restore, not delete.

---

## 6. Things that are not finished yet

Do not design around these as though they work:

- **Password reset does not send email.** `POST /api/auth/forgot-password` succeeds and logs the token
  instead of mailing it. Build the screens — the flow and endpoints are real — but it cannot complete
  for a real user until a transport is chosen. The reset link format is *your* route, so the API needs
  a base-URL setting once you pick one. Tell the API side what that route is.
- **No per-account lockout.** Login is rate-limited by IP only, and the whole shop is behind one
  office IP. Nothing for the UI to do; just do not add a "your account is locked" state yet.
- **Delivery confirmation email** is also a logging placeholder.
- **Monday.com migration** is unbuilt; there are no endpoints for it.

---

## 7. Running against it locally

The API must be in `Development` for the spec and the Scalar reference (`/scalar`) to be served.
Config it needs, all environment variables:

| Variable | Why |
|---|---|
| `JwtSettings__Secret` | The app refuses to start without it |
| `ConnectionStrings__ConnectionString` | Azure SQL, or LocalDB |
| `SQ_TOKEN` equivalent → `Square__AccessToken` | Only for product and billing screens |
| `Routific__ApiToken` etc. | Only for dispatch |

**CORS is already configured** for a credentialed browser client. The allowed origins come from the
`Cors:AllowedOrigins` config array — add your dev server's origin there (e.g.
`http://localhost:5173`) or every request fails preflight. It must be an exact origin; a wildcard
cannot be used with credentials.
