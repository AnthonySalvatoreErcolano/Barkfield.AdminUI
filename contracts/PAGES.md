# Barkfield Road Admin — screen map

Every screen, what it is for, and which endpoints feed it. Read `API-CONTEXT.md` first — it covers
authentication, error handling and the conventions these endpoints all follow.

Endpoint paths are exact. Shapes are in `openapi.json`; the permission each one needs is on the
operation as `x-required-permission`, so the gating column below is a summary, not the source.

**Terminology**, because the same word means different things in a pet shop and in software:

- **Subscription** — a customer's standing order. Recurring, has a frequency and a next date.
- **Delivery** — one dispatch of one subscription on one day. Where the contents and the money live.
- **Line** — one product on a delivery. Carries its own procurement state.
- **Rotation group** — products a customer cycles through across deliveries, not all at once.
- **Route** — a day's driving plan, built in Routific and received by webhook. We never build one.
- **Stop** — one doorstep on a route. May carry more than one delivery.

---

## 0. Shell and session

### Login
`POST /api/auth/login` · anonymous

Email and password. On success hold `accessToken` in memory and fetch `/api/users/me`. Also links to
forgot-password. A **429** here means the IP rate limit, not bad credentials.

### Forgot password / reset password
`POST /api/auth/forgot-password` · `POST /api/auth/reset-password` · both anonymous

⚠️ **The email is not actually sent yet** — the token is logged server-side. Build both screens; the
flow works end to end except for delivery. The reset page's route is yours to choose, and the API
needs to be told what it is so the link can be built.

### App shell
`GET /api/users/me` · signed-in only

Fetch once after login. Drives the user menu **and all navigation gating** — hide a nav item when the
permission for its screen is absent. `isAdmin` users hold every permission, so no special case.

### My account
`GET /api/users/me` · `POST /api/users/me/change-password` · signed-in only

---

## 1. Dashboard

**There is no dashboard endpoint.** Compose it, or tell the API side what you want and it can be added
as one read. The pieces that exist:

| Tile | Endpoint |
|---|---|
| Today's dispatch state | `GET /api/dispatch?date=` — has a ready-made `statusLine` |
| Cards needing attention | `GET /api/deliveries/needs-attention` |
| Subscriptions due | `GET /api/deliveries/due?date=` |
| Still to order this week | `GET /api/procurement/products?from=&to=` — sum `pendingQuantity`, or count the rows |
| Deliveries blocked on stock | `GET /api/deliveries?procurementStatus=3` (Blocked) |

If the dashboard turns into five calls on every page load, that is the signal to ask for a real
endpoint rather than to cache aggressively.

---

## 2. Customers

### List — `GET /api/customers`
`customer:view`. Paged, searchable. Supports include-inactive.

### Detail — `GET /api/customers/{customerId}`
`customer:view`. Tabs, each its own call:

| Tab | Endpoint |
|---|---|
| Pets | `GET /api/customers/{customerId}/pets` |
| Subscriptions | `GET /api/customers/{customerId}/subscriptions` |
| Deliveries | `GET /api/customers/{customerId}/deliveries` |

### Create / edit
`POST /api/customers` (`customer:create`) · `PUT /api/customers/{customerId}` (`customer:edit`)

### Delivery details — `PUT /api/customers/{customerId}/delivery-details`
`customer:edit`. **Its own screen or panel, not part of the main edit form.** This is the routing
information: access notes, the default service duration at the door, the preferred window. Access
notes reach the driver through Routific as instructions, and are read **live** at dispatch time — a
gate code changed this morning applies to tonight's run. Worth saying so on the form.

### Square link — `POST /api/customers/search-square` · `POST /api/customers/{customerId}/sync-square`
`customer:view` / `customer:edit`. Search Square's customer directory and attach one. Square holds the
card on file; **no card data ever enters this system**, and there is deliberately no endpoint to add or
edit a card — that is done in Square. Say that on the screen or someone will look for the button.

### Deactivate / restore
`DELETE /api/customers/{customerId}` (`customer:delete`) · `POST …/reactivate` (`customer:edit`)
Soft. Present as archive/restore.

---

## 3. Pets

Nested under a customer; no standalone list.

`POST /api/customers/{customerId}/pets` (`customer:edit`) · `GET /api/pets/{petId}` (`customer:view`) ·
`PUT /api/pets/{petId}` · `DELETE /api/pets/{petId}` · `POST /api/pets/{petId}/reactivate`

Allergies are a shared reference list: `GET /api/allergies` (`customer:view`),
`POST /api/allergies` (`customer:edit`) to add a new one. Let staff pick from the list and add to it
inline rather than typing free text.

---

## 4. Products

The catalog **mirrors Square, which is the source of truth for price.** Products are imported, not
created here — there is no create endpoint, by design.

| Screen | Endpoint | Permission |
|---|---|---|
| List | `GET /api/products` | `product:view` |
| Detail | `GET /api/products/{productId}` | `product:view` |
| Search Square's catalog | `GET /api/products/search?q=&limit=` | `product:view` |
| Import a variation | `POST /api/products/import` | `product:manage` |
| Re-sync one | `POST /api/products/{productId}/sync` | `product:manage` |
| Re-sync all | `POST /api/products/sync` | `product:manage` |
| Deactivate / restore | `DELETE` · `POST …/reactivate` | `product:manage` |

The import flow is two steps: search Square, then import the chosen **variation**. One Square item has
many variations (sizes, proteins) and a product here is one variation. Re-importing the same variation
is idempotent — it returns the existing product rather than duplicating, so the UI need not guard it.

---

## 5. Subscriptions

The most endpoint-heavy area — 30 operations, almost all `subscription:manage`. Reads are
`subscription:view`.

### List — `GET /api/subscriptions` · Detail — `GET /api/subscriptions/{subscriptionId}`

### Schedule panel
| Action | Endpoint |
|---|---|
| Change frequency | `PUT …/frequency` |
| Reschedule next date | `PUT …/schedule` |
| Skip the next one | `POST …/skip` |
| Pause (with or without an end date) | `POST …/pause` |
| Resume | `POST …/resume` |
| Activate a new sign-up | `POST …/activate` |
| Cancel | `DELETE …` |
| Next date preview | `GET …/next-delivery` |
| Upcoming dates | `GET …/upcoming` |

Notes that affect the design:

- **Frequency is a number plus a unit** (every N days/weeks/months), not a fixed dropdown. Two inputs.
- **A pause can have an end date or be indefinite.** On resume, a pause that had an end date resumes
  on that date; an indefinite one rolls forward from today. Show which kind is in effect.
- **Cancel is permanent.** A customer who comes back gets a new subscription. Confirm destructively.
- A customer can hold several subscriptions on different cycles, so **always show the subscription
  name** — it falls back to a composed label when staff have not named it.

### Items — `POST …/items` · `PUT …/items/{productId}` · `DELETE …/items/{productId}`

### Rotation groups
`POST …/rotation-groups` · `PUT`/`DELETE …/rotation-groups/{groupId}` ·
`POST …/rotation-groups/{groupId}/items` · `PUT`/`DELETE …/items/{itemId}` ·
`PUT …/rotation-groups/{groupId}/order` · `POST …/jump-to/{itemId}` · `POST …/pause` · `POST …/resume`

A group is an ordered ring the customer cycles through — this delivery gets venison, next gets beef.
Needs a reorderable list, a visible "next up" marker, and a jump-to for when a customer asks for
something out of turn. A group can be paused independently of the subscription.

### Add-ons — `POST …/add-ons` · `PUT`/`DELETE …/add-ons/{addOnId}`

One-off extras for the next delivery, consumed when it is generated. Make it clear they are not
permanent, or staff will use them for standing items.

---

## 6. Deliveries — procurement and packing

The shop-floor screens. `delivery:view` to read, `delivery:pack` for procurement, `delivery:manage`
for scheduling and outcomes.

**Three screens here, and choosing between them is the thing to get right:**

| Screen | Grain | For |
|---|---|---|
| **Worklist** | One row per **delivery** | "Which orders still need work?" Triage, and getting to a delivery |
| **Procurement board** | One row per **product** or per **line** | "What do I buy, and what arrived?" Across many deliveries at once |
| **Delivery detail** | One delivery, all its lines | Everything about one order, including contents and outcomes |

The worklist is not a smaller procurement board — it counts unresolved lines per delivery but never
shows a line. The board is where lines are actually worked.

### Worklist — `GET /api/deliveries`
Filter by date range, status, `procurementStatus`, fulfilment method, one-off only, paid state. The
default excludes closed deliveries — pass include-closed for history.

Each row carries `unresolvedLineCount` and `blockedLineCount`. **Those two numbers are the work**: a
delivery cannot be packed while anything is unresolved, and a blocked line needs a decision. Both are
counts — to act on the lines behind them, go to the procurement board or the delivery detail.

### Generate deliveries
`GET /api/deliveries/due?date=` then `POST /api/deliveries/generate` · `delivery:view`

The preview is the important half: it shows **what generation would create and every reason a
subscription would be passed over**, including anything overdue rather than only due that day. Show
the skip reasons — they are there so nothing is discovered afterwards. Partial success on generate is
normal (a customer with no address is reported and skipped), so render the result as a list.

### Procurement board

The screen for **buying stock**, separate from delivery detail: one table of **lines across many
deliveries** over a date range, so whoever is ordering inventory works down a list instead of opening
each delivery.

Two passes over the same data, two endpoints, because paging a grouped result is awkward and a response
whose shape changes with a query parameter is hostile to a typed client.

#### The ordering pass — `GET /api/procurement/products`
`delivery:view`. One row per product across the range, paged.

This is the screen's default. Auto-ship demand is folded into the general store's own inventory order,
so the useful unit is the product: **`pendingQuantity` is the figure that goes onto the supplier
order.** Sorted by it descending, so the view opens on the work.

| Field | |
|---|---|
| `pendingQuantity` | Still to order — the headline number |
| `orderedQuantity` | Placed with a supplier, not yet arrived |
| `receivedQuantity` | In hand. Counts a **partial** receipt by what actually arrived, not by the line quantity — four of six is four, and showing six would stop someone ordering the shortfall |
| `totalQuantity` | Everything needed across the range, whatever state |
| `blockedLineCount` | Out of stock, each one blocking a delivery from packing |
| `customerCount` · `deliveryCount` · `lineCount` | A shortage's blast radius |
| `earliestScheduledFor` | What makes a row urgent |

Customer-grouping this pass would make you visit the same product once per customer and decide
fourteen times what is really one phone call.

#### The receiving and allocating pass — `GET /api/procurement/lines`
`delivery:view`. Flat paged lines, sorted **customer → subscription → product** by default, so you can
read down one customer. This is also what a product row expands into: pass that row's `productId`.

Every row carries **`deliveryId` and `lineId`** — both are needed to act on it.

Substitution belongs on this view, not the product view, because it is specific to one customer: you
substitute for *this* dog.

#### Both take
`from` and `to` (**required** — the range is the screen), plus `orderStatus`, `procurementStatus`,
`fulfillmentMethod`, `productId`, `customerId`, `searchTerm`, `includeClosed`, and standard paging.

Two status filters, deliberately, answering different questions:

- **`orderStatus`** — the *line's* own state. The usual filter here.
- **`procurementStatus`** — the *delivery's* rolled-up state. "Lines belonging to deliveries that are
  still blocked" is a real query and not the same thing.

⚠️ **The delivery's `procurementStatus` is derived and must never be sent.** It is recalculated from
the lines on every change: blocked if anything is out of stock, ready when everything is resolved.
Show it read-only and let it follow.

Delivered and failed deliveries are excluded unless `includeClosed=true`. Cancelled ones are always
excluded — they are not work.

#### Setting a status — `POST /api/procurement/lines/status`
`delivery:pack`.

```jsonc
{ "lines": [
  { "deliveryId": "…", "lineId": "…", "status": 2, "note": "PO 4471" },          // Ordered
  { "deliveryId": "…", "lineId": "…", "status": 4 },                             // Received in full
  { "deliveryId": "…", "lineId": "…", "status": 3, "quantityReceived": 4 },      // 4 of 6 arrived
  { "deliveryId": "…", "lineId": "…", "status": 6, "substituteProductId": "…" }, // venison → beef
  { "deliveryId": "…", "lineId": "…", "status": 1 }                              // reset a mis-click
] }
```

**This is a transport, not a different set of actions.** Every operation the per-line endpoints under
`/api/deliveries/{deliveryId}/lines/{lineId}/…` perform is expressible here, with identical behaviour —
and those endpoints remain the way to act on a single row. Use them for one row; use this for several.

Omit `quantityReceived` to receive the whole line. Send a number below the line quantity and the line
is left **partially** received, so it stays on the worklist — the status is derived from the count
rather than taken on trust, which is why `3` and `4` behave the same way here.

#### 🚩 Why the bulk endpoint has to exist

Not to save clicks. Calling the per-line endpoints in a loop **breaks on this screen.**

Each one loads the whole delivery aggregate, changes one line, and saves it with the revision bumped.
Nolan's delivery has four lines; sorted by customer, those are four **adjacent rows**:

| | |
|---|---|
| Request A | loads Nolan at revision 7, sets venison ordered, saves → **revision 8** |
| Request B | already loaded at revision 7, sets tripe ordered, saves expecting 7 → **409** |

The tripe click fails and nobody else touched anything. Batched, that cannot happen: one load, all four
changes, **one save and one revision bump.**

So either send a batch, or queue per `deliveryId` and keep one request in flight per delivery. Prefer
the batch.

#### Partial failure is normal

**200 with a per-line result list**, like the charge endpoints — a batch of thirty reports the two rows
that did not take rather than discarding the twenty-eight that did.

```jsonc
{ "appliedCount": 28, "failedCount": 2,
  "results":  [ { "deliveryId": "…", "lineId": "…", "applied": false,
                  "reason": "This delivery is already 'Delivered' and cannot be changed." } ],
  "deliveries": [ { "deliveryId": "…", "procurementStatus": 4, "isReadyToPack": true } ] }
```

`reasons` are written for staff and can be shown as-is. `deliveries` carries each touched delivery's
**recalculated** rollup, so the board repaints those rows without a refetch.

400 only for a malformed request: an empty batch, a line appearing twice (rejected rather than
last-one-wins, because silent dedupe hides a client bug), or more than **500** decisions.

#### What the screen should and should not offer

The API applies whatever you send. Whether a bulk control *should* exist is a design decision, and one
rule is worth keeping:

- ✅ **"Receive all of this product"** on the product view — you are standing at the pallet, you
  handled them.
- ❌ **A select-all-across-the-page → received.** That asserts somebody handled two hundred things they
  did not look at. Receiving is the one status that claims a physical fact, and a wrong claim surfaces
  as a customer missing food the system says arrived.

Ordering and out-of-stock carry no such claim — they are decisions, and bulk is exactly right for them.

#### Not the prep sheet

`GET /api/deliveries/sheet` looks close and cannot be used: **`DeliverySheetLineDto` has no `lineId`**,
so no action is reachable from it, and it is unpaginated and grouped for printing. Leave it as the paper
pick list it is.


### Prep sheet — `GET /api/deliveries/sheet?from=&to=`
`delivery:view`. A **printable** pick list, one entry per delivery. A date *range*, because the prep
day covers more than one delivery day. Shorted lines are kept on it, struck through, so nothing looks
lost. Design for paper: this is carried around the stockroom.

### Delivery detail — `GET /api/deliveries/{deliveryId}`

Line actions, all `delivery:pack`:

| Action | Endpoint |
|---|---|
| Ordered | `POST …/lines/{lineId}/ordered` |
| Received (optionally a partial count) | `POST …/lines/{lineId}/received` |
| Out of stock | `POST …/lines/{lineId}/out-of-stock` |
| Substitute another product | `POST …/lines/{lineId}/substitute` |
| Short it knowingly | `POST …/lines/{lineId}/short` |
| Undo the decision | `POST …/lines/{lineId}/reset` |
| Mark every line ordered | `POST …/order-all` |
| Pack the box | `POST …/pack` |

Contents editing is `delivery:manage`: `POST …/lines`, `PUT …/lines/{lineId}/quantity`,
`DELETE …/lines/{lineId}`.

🚩 **Contents freeze once the delivery is paid for.** Add, remove and quantity changes are refused
after payment — a 400 with an explanatory message. Disable those controls when
`contentsAreLocked` is true rather than letting the user discover it. Shorting is *still allowed*
after payment and flags the delivery for a refund, which is deliberate.

Other actions: `PUT …/notes`, `PUT …/window`, `PUT …/service-duration`,
`POST …/delivered`, `POST …/failed`, `DELETE …` — all `delivery:manage`.

`POST …/delivered` is the **manual** path, for a pickup, a shipped order, or a local delivery whose
Routific webhook never arrived. Normally completion arrives from Routific on its own. Keep it as an
override, not the primary button.

### One-off delivery — `POST /api/deliveries`
`delivery:manage`. A delivery with no subscription behind it, for a customer in the system who is not
on that day's run.

---

## 7. Billing

`billing:view` to see, `billing:charge` to act. **Staff hold both** — they run the day's charges.

| Screen | Endpoint |
|---|---|
| Needs attention | `GET /api/deliveries/needs-attention` |
| Pick discounts | `PUT /api/deliveries/{deliveryId}/discounts` |
| Available discounts | `GET /api/discounts` |
| Charge one | `POST /api/deliveries/{deliveryId}/charge` |
| Charge the day | `POST /api/deliveries/charge-all` |

- **Square prices the order.** We send the chosen discount *ids*; Square applies them, adds tax and
  computes the total. The percentages from `GET /api/discounts` are for a staff member choosing from
  a list — **never do arithmetic with them.** Show Square's `amountCharged` as the real figure.
- **A decline is a 200**, with the outcome in the body. `charge-all` returns a list; render it as a
  worklist of customers to ring, not as success-or-failure.
- `paymentFailureCode` is Square's own code, verbatim. `PAYMENT_METHOD_ERROR` means the card needs
  fixing — ring the customer. Other codes are worth showing to staff as-is.
- **Refunds are manual, in Square.** There is no refund endpoint. A delivery that was shorted after
  payment shows as needing refund attention; the action happens in Square.
- Discounts are refused once the delivery is paid.

---

## 8. Dispatch

`dispatch:view` to read, `dispatch:send` to push and withdraw.

### Dispatch board — `GET /api/dispatch?date=`
Defaults to today; staff can change the date. Returns the day's local deliveries, any routes, and a
`stage` plus a ready-made `statusLine` such as *"3 orders sent at 07:42 — no route published yet."*

**Build the top of the screen around `stage`.** The six values are in the spec. Two matter most:

- `SentAwaitingRoutes` — everything is pushed and nobody has built a route yet. Without this state
  the screen looks identical to "nothing has happened" and somebody sends the day twice.
- `PulledBack` — a dispatcher withdrew the route in Routific for re-planning. **The plan on screen is
  stale and staff may be part-way through loading against it.** This has to be the loudest thing on
  the page.

The board carries `unpaidCount` and `paymentFailedCount`. Payment state belongs on every row: an
unpaid customer gets pulled *before* the van leaves.

### Send for routing — `POST /api/dispatch/send`
`dispatch:send`. Body takes a date and optionally specific `deliveryIds` — omit them to send the whole
day, list them to add deliveries packed after the first send.

Returns 200 with `sentCount`, `alreadySentCount`, `failures` and `skipped`, each named by customer.
**Show all four.** Already-sent deliveries are skipped, not resent: Routific has no idempotency key on
order creation, so a second push would put the customer on the route twice.

Only **packed** deliveries go. Unpaid ones *are* sent — billing and routing are separate days here and
a card is often fixed between them.

### Withdraw — `POST /api/dispatch/deliveries/{deliveryId}/withdraw`
`dispatch:send`. For a card that could not be fixed, or a cancellation. Works after the order has been
put on a route, and leaves the delivery sendable again.

### Load list — `GET /api/dispatch/routes/{routeId}/load-list`
`dispatch:view`. The sheet staff pack and load a van from.

- Stops come back **in loading order — the reverse of driving order** — with `loadingPosition`
  numbered from the van doors. Render in the order given. Do not re-sort by `sequenceOrder` or the
  first drop ends up buried at the front of the van.
- **A stop is a doorstep, not a delivery.** Two subscriptions lining up, or two customers at one
  address, arrive as one stop carrying two boxes. `deliveries[]` on the stop holds them.
- Quantities are **what is actually going** — `quantityToLoad`, not the ordered quantity. A shorted
  line is zero; a substituted line is named by what is really in the box (`displayName`).
- `accessNotes` on a stop combines the notes of *everyone* at that door. `phoneNumbers` likewise.
- `isStale` mirrors the pull-back. Show it on this screen too; it is the one staff are holding.
- Ad-hoc stops (`isAdHoc`) are stops the dispatcher added in Routific that match nothing here. They
  have nothing to pack and the driver still has to go. Keep them visible with their label and address.

### Tick a stop loaded — `PUT /api/dispatch/routes/{routeId}/stops/{routeStopId}/loaded`
`delivery:pack`. Body `{ "loaded": true }`; false undoes it.

Recorded per **route stop row**, so a doorstep with two boxes needs both ticked — and the stop only
reads as loaded when every box at it is in. This survives Routific republishing the route, which it
does on every dispatcher change and every ETA recalculation. Optimistic UI is fine here.

### Proof-of-delivery photo — `GET /api/dispatch/deliveries/{deliveryId}/photos/{photoUuid}`
`delivery:view`. Returns **image bytes**, not JSON and not a redirect — the upstream photo endpoint
needs our API token, so it is proxied. Use it directly as an `<img src>` (the request carries the
bearer token, so a plain `src` will not work unless you fetch it as a blob — fetch and object-URL it).
Photo ids come from the delivery detail's `photos[]`.

---

## 9. Users and roles

| Screen | Endpoint | Permission |
|---|---|---|
| List | `GET /api/users` | `user:view` |
| Detail | `GET /api/users/{userId}` | `user:view` |
| Create | `POST /api/users` | `user:create` |
| Edit and assign roles | `PUT /api/users/{userId}` | `user:edit` |
| Deactivate / restore | `DELETE` · `POST …/reactivate` | `user:delete` / `user:edit` |
| Role picker source | `GET /api/roles` | `user:view` |

`isSystemRole` on a role means the application relies on it — **do not offer to delete those.**
Permissions are granted to roles in the database, not through the UI; there is no endpoint to edit a
role's permissions, so present roles as a fixed set to assign from.

---

## 10. Not in the UI

`POST /api/webhooks/routific` is Routific's inbound endpoint. Anonymous, signature-verified, not for
the browser. Listed only so nobody wires a page to it.
