# UI kickoff brief

Paste the section below into Claude Code in the UI workspace, once `contracts/` has been copied in.
Everything after the rule is addressed to that session.

---

We are building the admin UI for **Barkfield Road**, a pet store on Long Island running an auto-ship
and delivery program. Staff use this daily: they manage standing orders, buy stock, pack boxes, charge
cards and load a van. It is an internal tool behind a login — no public pages, no SEO.

The API is a separate .NET 10 service, already built and working. **Do not change it or assume it can
change.** Its contract is in `contracts/`.

## Read first

1. **`contracts/API-CONTEXT.md`** — the auth model, what each error status means here, and the
   conventions every endpoint follows. Read it fully before writing code.
2. **`contracts/PAGES.md`** — every screen, the endpoints feeding it, and the domain vocabulary.
3. **`contracts/openapi.json`** — the machine contract, 91 paths. Read it through a generator, not
   by eye.
4. **`design/ui-kit/`** — the visual reference. Read it before building any component, and read
   step 7 below before deciding what to do with it.

## Stack

- **Vite + React + TypeScript.** Deploying to Vercel as a static SPA.
- **Not Next.js.** The access token lives in browser memory, so server components and server-side
  fetching cannot see it. Using Next properly would mean re-architecting auth for no benefit on a
  screen behind a login that needs no SEO.
- Dev server on **port 5173** — the API's development CORS config already allows that exact origin.
- Routing and state are your call. Prefer boring and few dependencies.
- **Styling comes from `design/ui-kit/`** — see step 7. Do not invent a visual language.

## Build in this order

Do not start on screens until steps 1–3 are done and tested.

### 1. Types, generated

Generate TypeScript types from `contracts/openapi.json`. **Never hand-write a request or response
interface.** When the API changes we replace that file and regenerate; a hand-written shape would
silently disagree.

### 2. `src/api/http.ts` — one fetch wrapper

Every cross-cutting concern lives here and nowhere else. If any of this ends up duplicated in a
service, the copies will diverge.

It must:

- send `Authorization: Bearer <accessToken>` from the in-memory token
- send **`credentials: 'include'` on every request**, not only the refresh call
- map the API's `{ message, status }` envelope to typed errors: `ConflictError` (409),
  `CredentialError` and `OutageError` (both 502, different meanings — see `API-CONTEXT.md`),
  `ValidationError` (400), `NotFoundError` (404)
- **never surface a 500's `message`** — the API replaces unexpected messages with a generic one
  precisely because an exception's text can leak connection strings. Use your own wording.
  400/404/409 messages *are* written for staff and can be shown as-is.
- handle the 401 refresh flow below

### 3. 🚩 The refresh rule — get this exactly right

```
any request → 401
  → POST /api/auth/refresh-token      (no bearer header; the httpOnly cookie is the credential)
      → 200 { accessToken, … }  → store it, retry the original request ONCE
      → anything else            → clear state, go to the login screen
```

**The refresh must be single-flight.** If several requests 401 at the same moment they must all await
**one shared promise**, not each fire their own refresh.

This is not a tidiness point. The API rotates the refresh token on every use and marks the old one
revoked. Presenting an already-rotated token is treated as **token theft** and revokes *every session
for that user* — so two concurrent refreshes do not merely fail, they log the person out everywhere,
intermittently, in a way that looks like a random bug.

Implement it as a module-level `Promise | null`: the first 401 creates it, everyone else awaits it, and
it is cleared when it settles. Then **retry once, never in a loop** — a second 401 after a fresh token
means something other than expiry.

Write a test that fires five concurrent requests against a stub returning 401 and asserts the refresh
endpoint was called **exactly once**.

### 4. Session bootstrap

Keep the access token **in memory only** — not `localStorage`, not `sessionStorage`. To survive a page
reload, call `POST /api/auth/refresh-token` on app start: the httpOnly cookie is still there, so a
successful call returns a new access token and the user stays signed in without the token ever touching
disk. A failure there just means "show the login screen".

### 5. Permissions

Fetch `GET /api/users/me` after sign-in and hold it in app state. It returns a flat `permissions`
array. **Gate every control and nav item on that array, never on role names** — an `isAdmin` user comes
back holding every permission, so the flat check covers them with no special case.

Which permission guards which endpoint is in the spec as **`x-required-permission`** on each
operation. Build your lookup from that; do not retype it. If a control is gated correctly you should
never see a 403, so treat one as a bug to log rather than a message to show.

### 6. `src/api/ports.ts` and the two implementations

```
src/api/
  generated/   types from openapi.json — never hand-edited
  http.ts      the one fetch wrapper
  ports.ts     the interfaces screens depend on
  live/        implementations over http.ts
  fake/        in-memory implementations
  index.ts     picks live | fake from an env var
```

Start the interfaces close to the endpoints and let the screens push their shape. Do not invent an
abstraction layer before you know what it is abstracting. Use the generated types for data shapes —
do not re-declare them in the ports.

**The fake has to reproduce the API's awkwardness or it is worse than nothing.** Specifically:

- return a **409** on some writes, so the reload-and-reapply path gets built
- return **partial-success payloads** for `POST /api/deliveries/charge-all` and
  `POST /api/procurement/lines/status` — those are 200 with a per-item result list, not all-or-nothing
- use **integer** enum values, as the wire does
- seed realistic volume: a day with ~25 deliveries, a customer with two subscriptions, a stop with two
  deliveries at one address

Note the tradeoff and account for it: a port-level fake **bypasses `http.ts`**, so the auth and error
mapping never run against it. Test that separately — MSW at the fetch level is the right tool if you
want the wrapper itself covered.

### 7. The design system, from `design/ui-kit/`

`design/ui-kit/` holds HTML components and styling generated with Claude Design. **It is a visual
reference, not the component library.** Two ways to get this wrong, and both are expensive:

- ❌ Copying its markup into components. You inherit duplicated styles and markup with no reuse, and
  changing a colour later means editing forty files.
- ❌ Ignoring it and inventing your own look. Then the app does not match what was designed, and
  reconciling it afterwards is a rewrite.

Do this instead, **before the first screen**:

1. **Read the kit and work out what it actually uses** — Tailwind utility classes, plain CSS, CSS
   custom properties, something else. Adopt that approach and stay with it; do not mix two.
2. **Extract the tokens to one place.** Colours, fonts and type scale, spacing, radii, shadows,
   borders. One file. Every component reads from it, nothing hard-codes a hex value.
3. **Build real React primitives** from the kit's components: Button, Input, Select, Checkbox, Table,
   Badge, Card, Dialog, Toast, Spinner, EmptyState — whatever the kit covers. Typed props, no inline
   styles.
4. **Support both light and dark** if the kit does, through the tokens rather than per component.

Then every screen composes primitives. A screen should never contain a raw hex colour, a font stack,
or markup lifted from the kit.

**The kit will not cover everything.** This app needs things a component kit usually omits: a dense
paginated data table with an inline status selector per row (the procurement board), a printable
layout (the prep sheet and the load list), and a stale-data banner (a pulled-back route). Build those
**as new primitives using the kit's tokens**, so they look like they belong — not ad hoc inside a page.

If something in the kit genuinely conflicts with what a screen needs, follow the kit's tokens and say
so in your summary rather than quietly diverging.

### 8. Screens

From `PAGES.md`, in its order. §0 shell and login first.

## Three things most likely to be got wrong

1. **The refresh race** above. It is the only one whose failure mode is silent and intermittent.
2. **409 is a workflow, not an error toast.** Writes carry a `revision`; a 409 means someone else
   edited the record while this user was working. Reload it, let them reapply, and never auto-retry —
   the whole point is that the data underneath changed and they need to see it. A reload-and-retry
   affordance on every edit form is the right pattern.
3. **Enums are integers.** Names are in `x-enum-names` in the spec. Many read DTOs also carry a
   `…Name` string for display, which is fine to show — but anything you **send** must be the number.

## Also worth knowing

- **Money**: `decimal` as a JSON number. Do not round for redisplay. `amountCharged` (what Square
  actually took) can legitimately differ from `total` (our estimate at snapshotted prices); show both
  where they differ, because that difference is meaningful.
- **Dates are UTC.** Date-only concepts (a delivery day) arrive as a timestamp at midnight — read the
  date part and never apply a timezone shift, or a Tuesday delivery becomes Monday.
- **Delete is soft** almost everywhere, with a matching `…/reactivate`. Design archive/restore, not
  delete.
- **Paging**: `{ items, totalCount, pageNumber, pageSize, totalPages, hasNextPage, hasPreviousPage }`.
  `sortBy` accepts a fixed set of keys per endpoint and silently falls back on anything else.
- **Password reset does not send email yet.** Build the screens — the flow is real — but it cannot
  complete for a real user. Tell the API side what route your reset page lives at; it needs that to
  build the link.

## Deployment

Static SPA on Vercel. Two things the API side must be told, so surface them when you get there:

1. **Your production origin**, to add to the API's `Cors:AllowedOrigins`. It must be an exact origin —
   a wildcard cannot be used with credentials.
2. **Whether preview deployments need to work signed-in.** Vercel previews get random `*.vercel.app`
   subdomains, which are both un-allowlisted and cross-site from the API. If previews need auth, the
   answer is a Vercel rewrite proxying `/api/*` to the API so it is same-origin.

Do not add auth workarounds for the cookie — the fix is domain layout on the deployment side, not code.

---

# Per-page prompt

After the plumbing is done, each screen is its own prompt. Template — fill the four bracketed parts:

```
Build the [SCREEN NAME] screen, from contracts/PAGES.md section [N].

Add only the port methods this screen needs. Do not build out other areas of the API.

1. Extend src/api/ports.ts with what this screen calls, using the generated types.
2. Implement it in src/api/live/ over http.ts.
3. Implement it in src/api/fake/ with realistic data, including [THE FAILURE CASE FOR THIS SCREEN].
4. Build the screen from the primitives in src/components, gating controls on [PERMISSION STRINGS].
   If you need a primitive that does not exist yet, add it there using the design tokens — not inline
   in the page.
5. Check it against the running API, not only the fake.

Watch out for: [THE SCREEN-SPECIFIC TRAP FROM PAGES.md]
```

The last line is the one that earns its keep — each screen has something that looks wrong if you do the
obvious thing. From `PAGES.md`:

| Screen | What to put in that line |
|---|---|
| Customers | Deactivate is soft, with a matching reactivate. Design archive/restore, not delete |
| Products | No create endpoint by design — products are imported from Square, which owns pricing |
| Delivery detail | Contents freeze once paid. Disable add/remove/quantity on `contentsAreLocked` rather than letting the user discover the 400 |
| Procurement board | Batch same-delivery rows into one request, or adjacent rows 409 against each other |
| Dispatch board | Build the header around `stage`; `PulledBack` must be the loudest thing on the page |
| Load list | Render stops in the order returned. Re-sorting by `sequenceOrder` buries the first drop at the front of the van |
| Billing | A decline is a 200 with the outcome in the body. Render `charge-all` as a worklist of people to ring |
| Subscriptions | Frequency is a number plus a unit, not a dropdown. Cancel is permanent |

## Suggested order

The design pass (step 7) comes before any screen — the login page is the first thing that needs
primitives, so there is no point deferring it.

Shell and login first — it proves the whole auth path end to end.

Then **Customers**, because it exercises everything the later screens reuse (paging, the fixed sort
keys, search, permission gating, archive/restore) on the simplest domain in the system. If the plumbing
is wrong, this is the cheapest place to find out.

Then **Deliveries** (worklist and detail), and after that the screens that depend on those patterns
being settled: procurement, dispatch, billing, subscriptions, users.

Leave **Dispatch** until late. It needs published routes, which arrive by Routific webhook, so it is the
hardest to exercise honestly against real data.
