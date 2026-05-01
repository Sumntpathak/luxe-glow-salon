# Mangomint UX Parity — Complete Requirements & Ticket Plan

> **Goal:** Clone the Mangomint UX exactly across our existing feature set. This is a ground-up redesign of *how the product feels*, not new features. Every existing capability must be re-mapped onto Mangomint's interaction patterns.
>
> **Reference benchmark:** [mangomint.com](https://www.mangomint.com/) — 4.9/5 on G2 + Capterra, cited industry-wide as "the cleanest, most intuitive design in mid-market salon software."
>
> **Output of this doc:** 9 epics, 47 tickets, sized S/M/L. Read top-to-bottom for the architectural shift; jump to "Mapping" at the end to see where current code dies.

---

## Mangomint's UX Principles (the rules everything below derives from)

1. **One screen does many jobs.** Calendar is the home of the app — it's where you book, check-in, mark complete, take payment, see the client timeline. No tab-switching for routine ops.
2. **Color-coded everything.** Appointment color = status at a glance. Staff color = column identity. No reading required for routine recognition.
3. **Cmd+K is everywhere.** Power users never touch the sidebar — they jump apps via command palette.
4. **Calendar-first, not list-first.** Bookings live as time blocks, not table rows. The default admin landing is calendar week-view.
5. **Drag-to-create, drag-to-reschedule.** No "Add Booking" buttons in the primary flow. You drag in empty space.
6. **Side-panel detail, never full-page modal.** Clicking an appointment opens a right-side slide-over with all actions inline. Page navigation stays put.
7. **Auto-progress over manual status changes.** Time-of-day + check-in events advance status automatically. Front desk taps "Check In" once, the rest happens.
8. **Express Booking = single-screen flow.** Multi-service, smart staff defaults, combined slot picker. 3 clicks max for the consumer.
9. **Client timeline is sacred.** Every interaction (booking, sale, note, photo, form, SMS, email) lands chronologically on one feed.

---

# Epic Index

| # | Epic | Tickets | Total Effort |
|---|---|---|---|
| 1 | [Navigation Architecture](#epic-1--navigation-architecture) | 5 | M+M+S+M+S |
| 2 | [Calendar (the centerpiece)](#epic-2--calendar-the-centerpiece) | 9 | L+L+M+M+M+M+M+S+S |
| 3 | [Express Booking — consumer + public](#epic-3--express-booking) | 6 | L+M+M+S+S+M |
| 4 | [Appointment Detail Side-Panel](#epic-4--appointment-detail-side-panel) | 5 | M+M+M+S+S |
| 5 | [Client Profile + Timeline](#epic-5--client-profile-timeline) | 6 | L+M+M+M+S+S |
| 6 | [Checkout / POS](#epic-6--checkout-pos) | 4 | L+M+M+S |
| 7 | [Communications (Connect)](#epic-7--communications-connect) | 4 | M+M+S+S |
| 8 | [Automated Flows](#epic-8--automated-flows) | 4 | L+M+M+S |
| 9 | [Settings & Resources](#epic-9--settings-resources) | 4 | M+M+S+S |

**Effort legend:** S = ≤4 hrs · M = 1 day · L = 2–3 days. Total: ~28 dev-days for full parity.

---

## EPIC 1 — Navigation Architecture

> **Why first:** Everything else lives inside this shell. Get the navigation pattern right or every other ticket renders inside the wrong frame.

### MGN-101 · Top app bar (replaces sidebar as primary nav) — `M`
**Spec:**
- Fixed top bar, height 56px. Left → right: logo · location switcher · primary nav tabs · spacer · search · notifications · user menu.
- Primary tabs (admin role): **Calendar · Sales · Clients · Marketing · Reports · Inventory**.
- Active tab gets primary-color underline (not background fill — Mangomint pattern).
- Sidebar disappears on admin role. Settings/Billing move into user menu.

**Acceptance:**
- New `<TopBar />` in `src/components/shared/top-bar.tsx`.
- `<PortalLayout>` for admin role renders TopBar instead of Sidebar.
- All admin routes still reachable via top tabs OR user menu.

**Files touched:** `portal-layout.tsx` (rewrite admin branch), new `top-bar.tsx`, archive `sidebar.tsx` for staff/consumer use.

---

### MGN-102 · Cmd+K command palette — `M`
**Spec:**
- Global keyboard shortcut Cmd+K (Mac) / Ctrl+K (Win) opens centered overlay.
- Search box + sectioned results: **Apps · Clients · Bookings · Services · Staff · Recent**.
- Each result is one-row: icon + label + subtext + jump-to URL.
- Type "GC" → "Gift Cards" (initials matching, mirrors Mangomint's pattern).
- Esc closes. Enter navigates.

**Acceptance:**
- Uses existing `cmdk` lib (already in deps).
- Palette wraps `<Command>` from `command.tsx` with global hotkey listener.
- Recent items persisted in zustand store (last 10 navigations).

**Files touched:** new `src/components/shared/command-palette.tsx`, hook into App.tsx as portal.

---

### MGN-103 · Location switcher (refine existing) — `S`
**Spec:**
- Existing component moves into top bar (left, after logo).
- Dropdown shows location pills with active dot.
- "All locations" option for org-wide reports view (when user has multi-location plan).

**Acceptance:** existing `LocationSwitcher` styled to fit 32px height in top bar; "All locations" option added to dropdown.

---

### MGN-104 · User menu (top right) — `M`
**Spec:**
- Avatar circle. Click → dropdown panel.
- Sections: profile name + role · **My Profile · Settings · Billing · Help · Sign Out**.
- Notification bell sits *next to* the avatar — separate icon + count badge.
- Notifications dropdown shows: appointment reminders, low stock, missed calls (all org-wide events).

**Acceptance:** new `<UserMenu />` and `<NotificationCenter />` components, both in `top-bar.tsx`.

---

### MGN-105 · Apps grid (in user menu, alternative entry) — `S`
**Spec:**
- "Apps" link in user menu → opens 4×3 icon grid overlay similar to Cmd+K but visual.
- Each app icon: rounded square with icon + label. Mirrors Google Workspace launcher pattern.

**Acceptance:** clickable grid as a modal; useful on touch/iPad where Cmd+K is awkward.

---

## EPIC 2 — Calendar (the centerpiece)

> **Why high priority:** Calendar IS the admin app for Mangomint. Currently we have a thin BookingsPage table. This epic replaces it.

### MGN-201 · Week-view calendar with staff columns — `L`
**Spec:**
- Default admin landing for `/admin/calendar` (replaces `/admin/dashboard` as the home).
- **Layout:** date navigation top (prev/today/next + date picker), view toggle (Day · Week · Month · Schedule).
- **Week view:** 7 columns (days), each column subdivided by staff (e.g. Monday → 4 staff sub-columns). Time on Y-axis, 15-min granularity, 8am–8pm default.
- **Day view:** single date, staff as columns, hours as rows.
- **Appointment block:** rounded rectangle, color = status, label = client name + service icon. Min height = 30min, scales with duration.
- Current-time horizontal red line (Mangomint signature).

**Acceptance:**
- Replaces existing `react-big-calendar` usage with custom CSS-grid based renderer (smaller bundle, full control).
- Grid resolution: 15-min slots.
- Renders 100+ appointments without lag (virtualize day-view if needed).

**Files touched:** new `src/pages/admin/CalendarPage.tsx`, new `src/components/calendar/*`, App.tsx route `/admin/calendar`.

---

### MGN-202 · Appointment color coding by status — `M`
**Spec:**
- Status → color map (use design tokens):
  - `pending` → amber 100 / amber 600 border
  - `confirmed` → blue 100 / blue 600 border
  - `checked_in` → purple 100 / purple 600 border
  - `in_service` → green 100 / green 600 border
  - `completed` → gray 100 / gray 500 border
  - `cancelled` → red 100 + diagonal stripe pattern
- Add small status icon top-right of each appointment block.

**Acceptance:** consistent across calendar, booking list, client timeline, today's queue widget.

---

### MGN-203 · Drag-to-create appointment — `M`
**Spec:**
- Click-and-drag on empty calendar grid → ghost rectangle shows duration in real time.
- Release → opens **inline composer** anchored to drag start, NOT a modal.
- Composer shows: client search (autocomplete), service multi-select chips, staff (auto-filled from column), notes, [Save] / [Cancel].
- ESC cancels.

**Acceptance:** no modal dialog. Inline popover. Pre-fills time + staff from drag location.

---

### MGN-204 · Drag-to-reschedule appointment — `M`
**Spec:**
- Click an existing appointment block + drag → moves it.
- Snap to 15-min grid.
- If conflict → red shake animation, revert.
- Resize handle on bottom edge → adjusts duration.

**Acceptance:** uses native `draggable` + custom drop logic (no react-dnd, keep deps lean).

---

### MGN-205 · Calendar filters — `M`
**Spec:**
- Top-right filter chips: **Staff (multi-select), Service category, Status, Resources/Rooms**.
- "All staff" default. Click chip to refine.
- Filters URL-synced (`?staff=staff-1,staff-3&status=confirmed`).
- Save filter as preset (named, persisted to user prefs).

**Acceptance:** filters survive page reload via URL state.

---

### MGN-206 · Today's queue side panel — `M`
**Spec:**
- Collapsible right rail on calendar page (default open on desktop, hidden on mobile).
- Lists today's appointments grouped by **In Progress · Up Next · Waiting (checked-in)**.
- Each row: time · client avatar + name · service · staff · status pill.
- Click → opens MGN-401 detail panel.

**Acceptance:** independent scroll from main calendar; sticky header.

---

### MGN-207 · Day/Week/Month/Schedule view toggle — `M`
**Spec:**
- 4-way toggle. Persists last-used view in localStorage.
- Schedule view = list view (legacy mode for power users), grouped by date, table layout.

**Acceptance:** all four views render same data set, no view-specific bugs.

---

### MGN-208 · Auto-scroll to current time — `S`
**Spec:** on Day/Week view load, scroll Y-axis so current time is centered. Smooth scroll if user navigates to today from another day.

---

### MGN-209 · Empty-slot affordance — `S`
**Spec:** hovering empty grid cell shows subtle "+ New" icon and the time label. Click = same as MGN-203 drag-to-create with default 30-min duration.

---

## EPIC 3 — Express Booking

> **Why critical:** This is THE Mangomint signature. Single-screen multi-service flow. Currently we have a 4-step wizard.

### MGN-301 · Single-page Express Booking layout — `L`
**Spec:**
- Replace `/book` (public) and `/consumer/book` (logged-in) with single-page flow.
- **Desktop layout:** 2 columns. Left = service catalog (60% width), right = sticky cart + slot picker (40%).
- **Mobile layout:** services on top, cart drawer slides up on selection.
- No "step" navigation. Everything visible at once except final confirm.

**Data model dep:** requires `Appointment` parent + `BookingItem[]` (see DATA-MODEL section).

**Acceptance:**
- Loads with services pre-listed by category tabs.
- Cart starts empty, builds as user taps services.
- Confirm CTA disabled until ≥1 service + 1 slot selected.

**Files touched:** new `src/pages/ExpressBookingPage.tsx` (replaces `BookPage` + `PublicBookPage`).

---

### MGN-302 · Multi-service cart with running total — `M`
**Spec:**
- Each service tap adds a card to cart with: service name · duration · price · staff dropdown ("Any available" default) · remove button.
- Cart shows: total duration · total price · staff conflicts warning (if same staff double-booked).
- Reorder via drag handles (affects sequential timing).

**Acceptance:** services appear in cart in selection order; drag reorders.

---

### MGN-303 · "Any available" smart staff defaulting — `M`
**Spec:**
- Each cart item defaults staff to "Any available" (Mangomint default).
- On slot selection, system auto-assigns: cheapest qualified staff with availability, OR client's last-visit staff if available.
- User can override per service via dropdown.

**Acceptance:** algorithm documented in `src/lib/booking/auto-assign.ts`. Tested for: empty preference, last-visit preference, conflicts.

---

### MGN-304 · Combined slot picker — `S`
**Spec:**
- Calendar + time strip below cart.
- Time strip shows 15-min slots.
- A slot is **available** only if:
  - Sequential staff availability for total cart duration, OR
  - Parallel-eligible services (e.g. haircut + manicure) can run concurrently.
- Greyed slots = no fit; primary slots = available.

**Acceptance:** O(n*m) calculation cached per date change.

---

### MGN-305 · Sticky confirm + price breakdown — `S`
**Spec:**
- Sticky bottom bar (mobile) or sticky right card (desktop) showing breakdown:
  - Per-service line items
  - Subtotal
  - Estimated tax (if configured)
  - Total
  - "Confirm booking" CTA

**Acceptance:** persists during scroll; updates instantly on cart change.

---

### MGN-306 · Express Booking link via SMS (vendor side) — `M`
**Spec:**
- Admin can generate a one-time booking link from a client's phone call.
- Click "Express Booking" on Calendar → modal "Send to client":
  - Phone number input (pre-filled if client selected)
  - Optional preselected services
  - Send → toast confirms SMS sent (mock for now)
- Client receives SMS with link → opens Express Booking pre-loaded with selections.

**Acceptance:** route `/eb/:token` accepts a one-time signed token. Token resolves to pre-selected state.

---

## EPIC 4 — Appointment Detail Side-Panel

> Replaces page navigation with sliding right panel. Mangomint never makes you "leave" the calendar to act on an appointment.

### MGN-401 · Slide-over detail panel — `M`
**Spec:**
- Click any appointment block → 480px-wide right slide-over.
- **Header:** client avatar + name + clickable to open MGN-501 client profile.
- **Tabs:** Details · Notes · Forms · Photos · Payments.
- **Footer (sticky):** action buttons row — `Check In` · `Mark Complete` · `Reschedule` · `Cancel` · `Checkout`.
- Esc or click-outside closes. URL deep-link `?appt=apt-123` preserves state.

**Acceptance:**
- Built on shadcn `Sheet` component.
- Re-uses existing types/data; no new model needed beyond `Appointment` from DATA-MODEL.

---

### MGN-402 · Inline status changes — `M`
**Spec:**
- Status pill in panel header is clickable → dropdown of valid next states.
- One-tap transitions: `confirmed` → `checked_in` → `in_service` → `completed`.
- Each transition instantly updates calendar block color via store.

**Acceptance:** status enum transitions enforced (can't skip from `pending` to `completed`).

---

### MGN-403 · Add service / change service inline — `M`
**Spec:**
- "Add another service" button inside Details tab.
- Opens compact service picker (same component as MGN-302 cart item).
- New service slots after existing services on the timeline.

**Acceptance:** updates appointment total + extends end time; UI reflects without modal.

---

### MGN-404 · Service-flow auto-progression — `S`
**Spec:**
- Background timer tick every minute (in zustand effect).
- For each `confirmed` appointment whose start time has passed by 5+ min and no `checked_in`, do not advance — flag "Late" badge.
- For `checked_in` whose start time arrived, auto-advance to `in_service`.
- For `in_service` whose end time arrived, prompt "Mark complete?" toast with action.

**Acceptance:** background tick, no manual status churn for routine cases.

---

### MGN-405 · Notes & private notes — `S`
**Spec:**
- Notes tab shows two columns: **Public note** (visible to client in confirmations) and **Private staff note** (internal only).
- Markdown-light formatting (bold, lists).
- Auto-save on blur.

---

## EPIC 5 — Client Profile + Timeline

> Mangomint's client profile is a chronological feed of EVERYTHING. Currently we have a flat `Profile` page.

### MGN-501 · Two-column client profile layout — `L`
**Spec:**
- Route: `/admin/clients/:clientId`.
- **Left rail (320px):** avatar · name · contact · tags · loyalty tier · membership status · stats (lifetime $ · visits · last visit).
- **Right (flex):** tabbed area — **Timeline · Appointments · Sales · Forms · Photos · Communications · Files · Memberships**.
- Header has action row: `Book Appointment` · `Send Message` · `Add Note` · `Edit`.

**Acceptance:** left rail sticky on scroll; tabs use shadcn `Tabs`.

---

### MGN-502 · Timeline feed — `M`
**Spec:**
- Chronological reverse-order feed merging: appointments · sales · notes · photos uploaded · forms submitted · messages sent/received.
- Each item: icon + timestamp + summary + click-to-detail.
- Filter chips at top: All · Appointments · Sales · Notes · Comms.

**Acceptance:** infinite scroll; loads 30 items at a time.

---

### MGN-503 · Client list table redesign — `M`
**Spec:**
- Mangomint client table columns: **Avatar · Name · Phone · Last Visit · Visits · Lifetime $ · Tags · Loyalty Tier**.
- Hover row → quick-action icons appear (book / message / archive).
- Header sorting on every numeric column.
- Search bar (Cmd+F focus shortcut).
- Filter sidebar: tags, loyalty tier, last-visit window, has-membership.

**Acceptance:** existing `clients` table replaced; uses shadcn `Table` with custom cells.

---

### MGN-504 · Client form intake — `M`
**Spec:**
- Forms tab shows: completed forms · pending forms (sent for them to fill).
- Admin sends form via Express-Booking-style SMS link.
- Forms render as conditional question flows.

**Acceptance:** form definitions stored as JSON; submissions saved on client.

---

### MGN-505 · Tags as filter atoms — `S`
**Spec:**
- Tags rendered as colored pills on profile + table.
- Click a tag → filter client list by it.
- Admin can edit tag taxonomy in Settings.

---

### MGN-506 · Quick-add client modal — `S`
**Spec:**
- Cmd+K → "New client" → 4-field modal (name, phone, email, optional tags).
- Saves and closes.

---

## EPIC 6 — Checkout / POS

> Mangomint's POS is launched from the appointment, not a separate app. Cart pulls in services + add-ons.

### MGN-601 · Appointment-to-checkout one-tap — `L`
**Spec:**
- "Checkout" button in appointment panel → opens MGN-602 cart with services pre-loaded.
- Add tip · add product · apply discount · apply gift card · apply loyalty redemption — all in same screen.
- Tax line auto-computed.
- Multi-tender (split between card + cash + gift card).

**Acceptance:** new `<CheckoutSheet />` slide-over, full-height.

---

### MGN-602 · Cart with line-item editing — `M`
**Spec:**
- Each line: name · qty · unit price · line subtotal · discount link · remove.
- Discount link → popover (% off, $ off, free).
- Promo code input (cross-references coupons).

**Acceptance:** running total recalculates instantly.

---

### MGN-603 · Save card on file — `M`
**Spec:**
- Mock Stripe element (production = real PaymentElement).
- "Save card" toggle in checkout.
- Saved cards visible on client profile · selectable for future checkouts in 1 click.

**Acceptance:** card metadata only (last4 · brand · expMonth · expYear); never raw PAN.

---

### MGN-604 · Receipt screen + email/SMS send — `S`
**Spec:**
- Post-checkout: receipt view with itemization + tip + payment method.
- Buttons: `Email receipt` · `Text receipt` · `Print` · `Done`.
- Receipt URL `/r/:receiptId` (short-link friendly).

---

## EPIC 7 — Communications (Connect)

> Mangomint's "Connect" suite — inbox for SMS + email + web chat. We can ship SMS-equivalent + email; calls are out of scope.

### MGN-701 · Unified inbox — `M`
**Spec:**
- Route: `/admin/inbox` (also accessible as a top-bar tab when Connect is on).
- Two-pane: left = thread list (sorted by recency, unread badge), right = active thread with reply input.
- Thread = client + channel (SMS or Email).
- Filter chips: All · Unread · SMS · Email.

**Acceptance:** thread list uses virtualized scroll; reply input supports template variables (`{first_name}`).

---

### MGN-702 · Send-from-anywhere SMS button — `M`
**Spec:**
- "Message" action in: appointment panel · client profile · client list quick-action.
- Opens compact composer overlaying current screen, default channel SMS.
- Templates dropdown: confirmation · reminder · custom.

---

### MGN-703 · Auto-reminders config — `S`
**Spec:**
- In Settings → Communications, configure reminder cadence (24hr before, 2hr before, etc.).
- Per-channel toggle (SMS, Email).

---

### MGN-704 · Two-way chat web widget — `S`
**Spec:** embeddable script for vendor's website. Out of scope for Sprint 4 — note in backlog.

---

## EPIC 8 — Automated Flows

> Mangomint's marketing automation. Triggered by appointment events, sales, dates.

### MGN-801 · Flow builder UI — `L`
**Spec:**
- Route: `/admin/marketing/flows`.
- List view: flow name · trigger · status · sent count · open rate · revenue attributed.
- Click → flow editor: trigger node → delay → channel (SMS/Email) → message → optional branch (if booked again).
- Drag-and-drop tree (start simple — linear sequence first).

**Acceptance:** stored as JSON `Flow { trigger, steps[] }`. Dry-run preview.

---

### MGN-802 · Trigger types — `M`
**Spec:** 8 starter triggers:
- New client created
- First appointment completed
- Lapsed (no visit in 60d)
- Birthday
- Membership expires soon
- Cart abandonment (Express Booking link expired)
- Post-service (1d after completion → review request)
- Pre-service (24h before → reminder)

---

### MGN-803 · Template library — `M`
**Spec:** 6 pre-built flows visible on first marketing visit. One-click activation.

---

### MGN-804 · A/B subject testing — `S`
**Spec:** for email triggers, optional 2-arm subject test. Tracks open rate per variant.

---

## EPIC 9 — Settings & Resources

> Cleanup epic. Most items currently exist but in wrong layout.

### MGN-901 · Settings hub redesign — `M`
**Spec:**
- Route: `/admin/settings`.
- Two-column: left = nav list (Business · Locations · Staff · Services · Resources · Forms · Communications · Loyalty · Online Booking · Payments · Tax · Permissions), right = section content.
- Mirrors macOS System Settings pattern.

---

### MGN-902 · Resources/Rooms model — `M`
**Spec:**
- New entity: `Resource { id, orgId, locationId, name, type: 'room' | 'chair' | 'equipment' }`.
- Services optionally require a resource.
- Calendar shows resource conflicts when booking.

**Acceptance:** schema added; UI in Settings → Resources; conflict logic in slot calculation.

---

### MGN-903 · Permissions matrix — `S`
**Spec:** matrix UI: roles (Owner, Admin, Manager, Front Desk, Stylist) × permissions (View Calendar, Edit Bookings, Process Refunds, etc.). Default templates.

---

### MGN-904 · Branding (white-label-lite) — `S`
**Spec:** primary color picker + logo upload in Business settings; applied to top bar, online booking page, emails.

---

# DATA-MODEL Migration

Required for Epics 3, 4, 6.

```ts
// NEW
interface Appointment {
  id: string;
  orgId: string;
  locationId: string;
  clientId: string;
  date: string;            // YYYY-MM-DD
  startTime: string;       // HH:mm
  endTime: string;         // computed across all items
  status: AppointmentStatus;
  items: BookingItem[];
  notes: string;
  privateNotes: string;
  totalAmount: number;
  createdAt: string;
}

type AppointmentStatus =
  | 'pending' | 'confirmed' | 'checked_in'
  | 'in_service' | 'completed' | 'cancelled' | 'no_show';

interface BookingItem {
  id: string;
  appointmentId: string;
  serviceId: string;
  staffId: string;         // resolved at slot-pick (no 'any')
  resourceId?: string;
  startTime: string;
  endTime: string;
  price: number;
}
```

**Migration strategy:**
- `Booking` becomes a back-compat alias resolving to `Appointment` with single-item array.
- New code reads/writes `Appointment` only.
- Old pages (Bookings table, Reports) get a wrapper that flattens `Appointment.items[0]` for legacy display until each gets migrated.

---

# Mapping current code → tickets (the "what dies" view)

| Current file | Status | Replaced by |
|---|---|---|
| `src/components/shared/sidebar.tsx` (admin links) | Replaced | MGN-101 top bar |
| `src/pages/admin/DashboardPage.tsx` | Demoted to widget tab | Calendar becomes home (MGN-201) |
| `src/pages/admin/BookingsPage.tsx` (table + modal form) | Replaced | MGN-201 calendar + MGN-203/401 |
| `src/pages/consumer/BookPage.tsx` (4-step wizard) | Replaced | MGN-301 Express Booking |
| `src/pages/PublicBookPage.tsx` | Replaced | MGN-301 (same page, public mode) |
| `src/pages/consumer/ProfilePage.tsx` | Restyled | MGN-501 (admin twin) |
| `src/pages/admin/ClientsPage.tsx` (table) | Restyled | MGN-503 |
| `src/pages/admin/MarketingPage.tsx` | Replaced | MGN-801 flow builder |
| `src/pages/admin/SettingsPage.tsx` | Replaced | MGN-901 settings hub |
| `src/types/index.ts` `Booking` | Augmented | DATA-MODEL: `Appointment` parent |

| New surfaces (no existing equivalent) |
|---|
| Cmd+K palette · Notification center · Today's queue rail · Inbox · Flow builder · Receipt page · Resource calendar · Permission matrix |

---

# Recommended execution order (dependency-aware)

```
Phase 1 — Shell        : MGN-101 → 104 → 102 → 103 → 105
Phase 2 — Data model   : DATA-MODEL Appointment+BookingItem migration
Phase 3 — Calendar     : MGN-201 → 202 → 207 → 208 → 209 → 203 → 204 → 205 → 206
Phase 4 — Detail panel : MGN-401 → 402 → 403 → 404 → 405
Phase 5 — Booking      : MGN-301 → 302 → 303 → 304 → 305 → 306
Phase 6 — Client       : MGN-503 → 501 → 502 → 505 → 506 → 504
Phase 7 — Checkout     : MGN-601 → 602 → 603 → 604
Phase 8 — Comms        : MGN-701 → 702 → 703 → 704
Phase 9 — Marketing    : MGN-801 → 802 → 803 → 804
Phase 10 — Settings    : MGN-901 → 902 → 903 → 904
```

Total scope: **47 tickets across 10 phases**. At 1 dev × 8hr days, ~28–32 days of focused work for full Mangomint parity.

**MVP cut (week 1 demo): Phase 1 + Phase 2 + MGN-201 + MGN-202 + MGN-401 + MGN-301 + MGN-302 + MGN-304 + MGN-305 = 10 tickets, ~8 days.** That's the smallest set that *visually feels* like Mangomint.

---

# Sources

- [Mangomint — Calendar & Scheduling](https://www.mangomint.com/features/scheduling/)
- [Mangomint — Express Booking™](https://www.mangomint.com/features/express-booking/)
- [Mangomint — Client Management](https://www.mangomint.com/features/client-management/)
- [Mangomint — Online Booking](https://www.mangomint.com/features/online-booking/)
- [Mangomint — Learning the Basics](https://www.mangomint.com/learn/learning-the-basics-in-mangomint/)
- [Mangomint Review 2026 — Glossy Stack](https://www.glossystack.com/software/mangomint)
- [The Ultimate Mangomint Review 2026 — Salon Business](https://thesalonbusiness.com/mangomint-review/)
- [Mangomint Reviews — Capterra](https://www.capterra.com/p/187593/Mangomint/reviews/)
