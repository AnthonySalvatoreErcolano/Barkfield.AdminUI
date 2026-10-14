# Barkfield Road Autoship Admin — Operator Manual (V1)

This is a guide to the autoship admin: what each page is for, and how the pages fit together to get
the right food to the right dog on the right day.

---

## The big picture in one minute

Customers sign up for **standing orders** — "every 4 weeks, 2 bags of venison and a salmon oil." The
admin turns those standing orders into **deliveries** on the right day, helps you **order and receive
the stock**, **pack the boxes**, **charge the cards** through Square, and **send the day's stops to
Routific** so a driver gets a route. When a box is delivered, the customer's next delivery date is set
automatically.

Two outside services do part of the work:

- **Square** holds the product prices and the customers' cards. Prices are changed in Square, never
  here. Cards are added or changed in Square, never here.
- **Routific** builds the driving routes. You send it the day's packed boxes; a dispatcher plans the
  route there; the finished route comes back here as a load list.

---

## The day, in order

Most days follow the same path. Each step has its own page.

| Step | What happens | Page |
|---|---|---|
| 1. Make the day's deliveries | Every customer due that day gets a delivery with the right products in it | Deliveries → Generate |
| 2. Order the stock | See how much of each product is needed, order it from suppliers | Procurement |
| 3. Receive the stock | Tick off what arrived, decide what to do about anything that didn't | Procurement, or the delivery itself |
| 4. Pack the boxes | Once everything for a box is sorted, mark it packed | Deliveries |
| 5. Charge the cards | Charge the day through Square; follow up on any refused cards | Billing |
| 6. Send for routing | Send the packed boxes to Routific | Dispatch |
| 7. Load the van | Load from the load list, ticking each box in | Dispatch → Load list |
| 8. Delivered | Routific reports each drop; the customer's next date is set | (automatic) |

The **Dashboard** shows where today stands across all of these at a glance.

---

## Who can do what

What you see depends on your role. Buttons you can't use are simply hidden.

- **Administrator** — everything, including managing staff accounts.
- **Manager** — runs the whole operation day to day, but doesn't manage staff accounts.
- **Staff** — customers, subscriptions, packing, and charging the day's cards. Can see dispatch but
  not send to Routific.
- **Driver** — can see deliveries, the dispatch board and the load list. Can't change anything.

If you need something you can't see, ask an administrator to change your role.

---

## The pages

### Dashboard

Your morning view. It shows:

- **A red alert at the top** if any cards were refused or any customer is owed a refund, with a
  button to go straight to Billing.
- **Four tiles:** today's deliveries (and how many are ready to pack), anything still to generate
  for today, how many units still need ordering this week, and how many deliveries are stuck waiting
  on out-of-stock items. Click a tile to open the page behind it.
- **Today's deliveries** with where each box is and whether it's paid.
- **Today's dispatch** — one line saying where the day is with Routific.
- **To order this week** — the products you most need to order.

---

### Customers

Everyone on the autoship program.

**The list** — search by name, email or phone. Filters show customers not linked to Square, or
include archived customers.

**A customer's page** shows:

- **Contact details and address.** Deliveries go to this address. A customer with no address can
  still have pickup or shipped orders, but not local delivery.
- **Delivery details, for the driver** — door notes (gate codes, the dog, where to leave the box),
  how long the driver usually spends at the door, and a preferred delivery window. These are read
  fresh every night, so a gate code changed this morning reaches tonight's driver.
- **Card on file** — kept in Square. To add or change a card, open the customer in Square.
- **Square link** — every customer should be linked to their Square profile, or their card can't be
  charged. If the link is missing, the page says so and offers to try again.
- **Tabs** for their pets, subscriptions and past deliveries.

**Adding a customer** — the page first checks Square for someone with the same email or phone, so
you link to the existing Square profile instead of making a duplicate.

**Archiving** hides a customer from lists without deleting anything. It does **not** stop their
subscriptions — pause or cancel those first if deliveries should stop. Archived customers can be
restored.

#### Pets (on the customer's page)

Each pet has a name, type, breed, birthday, notes and **allergies**. Allergies are shown in red on
each pet — they're what you check before a protein goes in a box.

- Pick allergies from the shared list. If one is missing, type it and add it to the list — it's then
  available for every pet.
- A pet that has passed away or been rehomed can be **taken off the list**. The record is kept, and
  you can find it again under "Show past pets."

---

### Subscriptions

The standing orders.

Each subscription has:

- **How often** — every so many days, weeks or months.
- **Standing items** — what goes in every box.
- **Rotations** — products the customer takes turns through, one per delivery (say, venison, then
  beef, then lamb). You can reorder a rotation, pause it, or send a particular one next "out of turn."
- **Add-ons** — one-time extras for the **next box only** (a birthday cake, a treat). They're used up
  once that box is delivered.
- **The next delivery date**, and a preview of the next few boxes.

**Statuses:**

- **New sign-up** — set up but not delivering yet. **Activate** it once it has something in it.
- **Active** — delivering on schedule.
- **Paused** — no deliveries. Pause with a date to resume automatically, or without one to resume by
  hand.
- **Canceled** — permanent. A customer who comes back gets a new subscription.

You can also **skip** the next delivery or **move** it to a different date.

**Discontinued products** on a subscription are flagged, because they'll still go in the box until
someone swaps them out.

---

### Deliveries

One delivery is one box for one customer on one day. This is where packing happens.

**The list** opens on the coming week. Each row shows how much is left to sort out on the box. Filter
to **Blocked** (waiting on an out-of-stock decision) or **Ready to pack**.

**A delivery's page** shows every product in the box and where each one stands:

- **Pending** — not ordered yet.
- **Ordered** — on its way from the supplier.
- **Arrived** — all of it, or **part** of it (part stays on the to-do list).
- **Out of stock** — needs a decision: **send something else instead**, **send without it**, or wait.

When every product is sorted, **Mark packed** becomes available.

**Once a box has been charged, its contents are fixed.** You can't add products or change quantities.
You can still mark something as not going — the page then flags that the customer is owed a refund,
which you make in Square.

**Managers can also:**

- Edit the delivery's notes, its delivery window, and the time at the door — for this delivery only.
- **Mark delivered by hand** — only for pickups, shipped orders, or if Routific never confirmed.
  Normally Routific confirms each drop.
- **Mark failed**, with a reason.
- **Cancel** a delivery.

#### Generate deliveries

Turns the subscriptions due on a day into deliveries.

- Shows a **preview first**: who will get a delivery, and anyone being passed over and why (paused,
  no address, nothing in their subscription, and so on).
- **Warning — second boxes.** A customer stays "due" until their current box is actually delivered.
  So if you generate tomorrow before today's boxes have gone out, today's customers would get a
  **second box**. The page warns you in red and asks before doing it.

#### One-off delivery

A delivery that isn't part of any subscription — a one-time order. Pick the customer and the products.

#### Prep sheet

A printable pick list for a range of days, one entry per box. Products that aren't going are shown
crossed out.

---

### Procurement

Ordering and receiving stock, for a range of days.

**By product** — one row per product: how many to order, how many are on order, how many are in hand.
From a product's menu:

- **Mark ordered** — when you've placed the supplier order.
- **Receive all** — when that product's delivery has arrived and you have it all in hand.
- **Out of stock** — the supplier can't supply. Each affected box is then blocked until someone
  decides what to send instead.

**By line** — one row per product per box, for the details. Tick several and update them together —
for example, mark a batch as ordered.

**Receiving is never done for a mixed selection** — only per product ("I'm standing at the pallet") or
one box at a time. Marking something as arrived when it hasn't means a customer misses out.

---

### Billing

Charging the cards, through Square.

- **Charge the day** — charges every delivery that's ready and unpaid. You see a confirmation first,
  then one result list: paid, refused, couldn't be charged, and skipped, each with the customer's
  name.
- **Discounts** — pick from Square's discount list for a delivery before it's charged. Square works out
  the amount.
- **Needs attention:**
  - **Card refused** — ring the customer to fix their card in Square, then charge again.
  - **Not linked to Square** — link the customer first (on their customer page).
  - **Refund owed** — a paid box went out short. Make the refund in Square.

Charging can take a little while for a full day. Let it finish — closing the page won't stop a charge
that's already under way.

---

### Dispatch

Getting the day's boxes onto a route. Pick the day at the top (it opens on today).

**The banner at the top tells you where the day is:**

- **Waiting for boxes to be packed** — nothing is ready to send yet.
- **Ready to send** — packed boxes are ready. Press **Send for routing**. You'll see what's going
  and what isn't first. Unpaid boxes still go (cards often get fixed before the van leaves);
  unpacked ones don't.
- **Some deliveries haven't gone yet** — part of the day was sent. Send the rest once they're packed.
  Anything already sent is never sent twice.
- **Sent — waiting for a route** — everything has gone to Routific and a dispatcher is planning the
  route there. **Don't send the day again.** The route appears here by itself.
- **Route published** — the route is back. Open the load list.
- **Stop loading — a route was pulled back** (red). A dispatcher is re-planning. The plan on screen is
  out of date; wait for the new one before loading more.

**Each row** shows the box, whether it's paid, and whether it's gone to Routific.

- **Withdraw** takes a delivery back out of Routific — for a card that couldn't be fixed, or a
  cancellation. It can be sent again later. If it was already on a published route, take the box
  off the van.

**If Routific refuses our login** a red notice appears and stays. Trying again won't help — an
administrator has to renew the Routific connection.

#### Load list

The sheet you load the van from. It's printable.

- **In loading order.** Number 1 goes in first, at the back. The last one is nearest the doors — it's
  the first drop. Load in the order shown.
- **One card per door.** Two boxes for the same address are one stop with two boxes. Tick **each box**
  into the van; the door only counts as loaded when every box is in.
- **What's actually going.** Quantities are what's really in the box. Anything not going is crossed
  out; a substitute is named by what's in the box.
- **Door notes and phone numbers** for everyone at that address.
- **Stops added in Routific** — the dispatcher sometimes adds a stop of their own (collect returns, for
  example). Nothing to load, but the driver still goes; tick it as "Ready to go."
- **Unpaid stops** are listed at the top — fix the card before the van leaves, or withdraw the box.

---

### Products

The products available for subscriptions. **Square is in charge of names and prices** — this page
mirrors it.

- **Add from Square** — search Square's catalog (it matches the start of words: "salm" finds salmon)
  and add the size or flavour you want. Products priced at the counter can't be added — give them a
  fixed price in Square first.
- **Sync with Square** — updates every product's name and price from Square. **Run it before a
  charging day** so customers pay today's prices. Anything Square no longer has is listed, not
  removed.
- **Discontinue** — stops a product appearing when building subscriptions and deliveries. Subscriptions
  that already have it keep sending it until someone swaps it out. You can restore it.

---

### Users

Staff accounts (administrators only, for changes).

- **Add a user** — name, email, a starting password (or press "Suggest one"), and their roles. **No
  email is sent** — give them the password yourself; they can change it under My account.
- **Roles** are a fixed set: Administrator, Manager, Staff, Driver. A user needs at least one.
- **Administrator switch** — full access to everything, whatever their roles. Give it sparingly.
- **Deactivate** — locks someone out straight away. Nothing is deleted, and you can restore them. You
  can't deactivate your own account.
- Each user's page shows exactly what they're allowed to do.

### My account

Your own details, and where you change your password.

---

## Messages you might see

- **"This delivery just changed" / "This customer changed while you were editing."** Someone else
  saved a change while you had the page open. Their change is shown — check it, then make yours
  again. Nothing of theirs was overwritten.
- **"Couldn't load…" with a Try again button.** The connection dropped or a service was busy. Try
  again in a moment.
- **"Square is unavailable" / "Routific is unavailable."** That service is down for now. Try again
  shortly.
- **"…rejected our credentials…"** The connection to Square or Routific needs renewing by an
  administrator. Trying again won't help.
- **Signed out unexpectedly.** Your session ended. Sign in again and you'll be taken back to where
  you were.

---

## Golden rules

1. **Change prices and cards in Square**, not here.
2. **Don't generate tomorrow before today's boxes have gone out** — unless you mean to send second
   boxes.
3. **Only mark stock as arrived when it's in your hands.**
4. **Sync products with Square before a charging day.**
5. **Send the day to Routific once.** If the banner says "waiting for a route," it's already gone.
6. **If a route is pulled back, stop loading** until the new plan arrives.
7. **Load in the order on the load list.**

---

## Words used in the admin

- **Subscription** — a customer's standing order.
- **Delivery** — one box for one customer on one day.
- **Line** — one product in a box.
- **Rotation** — products a customer takes turns through, one per delivery.
- **Add-on** — a one-time extra for the next box only.
- **Route** — the driver's plan for the day, built in Routific.
- **Stop** — one doorstep on a route; it can have more than one box.
- **Blocked** — a box waiting on a decision about an out-of-stock product.
- **Archived / Deactivated / Discontinued** — hidden and set aside, but kept and restorable.
