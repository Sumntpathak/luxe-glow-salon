# UI/UX Audit — Luxe Glow Salon
> Reviewed 38 files across the admin shell, consumer + staff portals, public surfaces, and shared/domain components.
> Date: 2026-05-02.

This audit looks at consistency only — alignment, hierarchy, scrolling, cards, buttons, icons, and overall view density. TypeScript / a11y / performance are out of scope.

---

## Executive summary

- **Overall coherence score: 6.5 / 10.** The shell, calendar, clients table, slide-overs, and settings hub are tight and on-system. Older surfaces (`BookingsPage`, `StaffPage`, `ServicesPage`, `InventoryPage`, the consumer flow, and both legacy auth pages) still ship the pre-Mangomint conventions and pull the average down.
- The system has *clear* canonical values (Card = `rounded-2xl`, Button = `h-9 / h-8 / h-7`, icons = `size-3 / size-3.5 / size-4`) — the problem is uneven adoption, not absence of a system.

### Top 3 cross-cutting issues
1. **Two parallel button-icon conventions.** New code uses `size-3.5 / size-4` lucide classes; older code uses `h-4 w-4 mr-2`. Both ship side-by-side in the same shell. (Themes #2 and #6 below.)
2. **Card padding & radius drift.** Canonical `Card` ships `rounded-2xl` + `p-4` (or `p-3` via `size="sm"`), but pages override with `p-3`, `p-5`, `p-6`, `pt-6`, `pb-3`, and even raw `<div className="rounded-lg ...">`. KPICard alone overrides to `p-5`, which conflicts with every other card on the dashboard. (Theme #3.)
3. **Inconsistent slide-over scroll/footer scaffolding.** `appointment-detail-sheet` and `checkout-sheet` use `flex flex-col p-0 gap-0` + sticky footer + `overflow-y-auto` body — the modern pattern. `staff/CalendarPage` reuses the same `<Sheet>` primitive but with `overflow-y-auto` on the *content* and no sticky footer, producing a different scroll behaviour for the same kind of detail panel. (Theme #4.)

### Top 5 quick wins
1. **Rewrite `PageHeader` once** so every page that already imports it inherits the new heading scale + sticky behaviour. Today: `src/components/shared/page-header.tsx:9-19` is a 19-line component with no sticky support and no breadcrumb slot.
2. **Delete the inline page wrapper on `staff/SchedulePage.tsx:121` (`<div className="p-6 space-y-6">`)** — `PortalLayout` already supplies `p-6`, so this page sits inside a doubled `48px` gutter on every breakpoint vs the rest of the staff portal.
3. **Replace `<textarea>` (`src/pages/admin/StaffPage.tsx:263-269`) with `<Textarea>`** — the page imports neither and inlines the entire shadcn textarea class string, which has already drifted from the canonical primitive.
4. **Standardize button-icon spacing** via a pass that converts `<Plus className="h-4 w-4 mr-2" />` to `<Plus className="size-4 mr-1.5" />`. Today both forms ship in the same `PageHeader` action slot (`ClientsPage:172` is `mr-1.5`, `BookingsPage:217` is `mr-2`, `StaffPage:352` is `mr-2`, `FlowsPage:86` is `mr-1.5`).
5. **Drop the legacy "Bookings" page (`src/pages/admin/BookingsPage.tsx`) from the nav** or merge it into `CalendarPage`. It duplicates the calendar with a worse layout, ships its own `COLOR_PALETTE` (line 48-53), and uses `rounded-md` in a codebase that otherwise standardises on `rounded-xl/2xl`.

---

## Cross-cutting findings

### 1. PageHeader usage — three flavours of "page top"

The shared `PageHeader` component (`src/components/shared/page-header.tsx:9`) renders `flex … mb-6` with an `h1.text-2xl` and an optional action node. It is the de-facto standard, used on ~17 admin/consumer/staff pages.

**Drift cases:**
- **CalendarPage** (`src/pages/admin/CalendarPage.tsx:135`): no `PageHeader` at all — it breaks out with `-mt-6 -mx-4 md:-mx-8` to fill the shell. *Intentional* (full-bleed calendar). Don't flag.
- **InboxPage** (`src/pages/admin/InboxPage.tsx:132`): same trick, no `PageHeader`. *Intentional* (mailbox layout). Don't flag.
- **ClientProfilePage** (`src/pages/admin/ClientProfilePage.tsx:371`): no `PageHeader` — the left aside doubles as the page header. Acceptable, but the `-mt-2` offset leaks through to neighbouring routes if anyone forgets to wrap.
- **SettingsHubPage** (`src/pages/admin/SettingsHubPage.tsx:88`): uses `PageHeader` with `-mt-2` outer offset, fighting the `PortalLayout` `py-6`. Either move the offset into `PageHeader` or drop it.
- **FlowEditorPage** (`src/pages/admin/FlowEditorPage.tsx:97-115`): builds its own header from a `Link` + Switch + Save button, never imports `PageHeader`. The breadcrumb-style "← All flows" link reads as a header; please codify a `BreadcrumbHeader` slot inside `PageHeader` instead.
- **MarketingPage** (`src/pages/admin/MarketingPage.tsx:163`): standard `PageHeader`, but the in-page "Automated Flows" promo card (`MarketingPage.tsx:169-188`) is bigger than the header — visual hierarchy gets inverted.
- **staff/SchedulePage** (`src/pages/staff/SchedulePage.tsx:121-125`): wraps `PageHeader` inside a `p-6 space-y-6` div even though the layout already provides padding. Page sits in a doubled gutter.

**Recommendation:** Promote `PageHeader` into a "page chrome" component that owns optional breadcrumb, sticky behaviour, and a stable `mb-6 / py-6` rhythm. Ban inline `<h1>` page titles outside it.

---

### 2. Headings & visual hierarchy

There are at least four "h1" sizes in the admin shell:

| Page | Heading tag | Size |
| --- | --- | --- |
| PageHeader (canonical) | `<h1>` | `text-2xl font-bold tracking-tight` |
| ClientProfilePage `:384` | `<h1>` | `text-lg font-semibold` (because it's inside an aside card) |
| LoginPage `:54` | `<h1>` | `text-2xl font-bold` |
| RegisterPage `:40` | `<h1>` | `text-3xl font-bold` (gradient) |
| VendorSignupPage `:128`, `:159`, `:180`, `:211` | `<h2>` | `text-2xl font-bold` (h2 because page wraps in step) |
| MyBookingsPage `:62` | `<h2>` | `text-2xl font-bold` (no h1 on page) |

Auth pages use bigger headings + gradient text than the admin shell — *intentional* marketing tone. But MyBookingsPage skipping h1 entirely is a real defect (no `<h1>` on the route).

In-page section titles drift too:
- `FlowsPage.tsx:101`: `<h2 className="font-semibold">` — no size.
- `FlowsPage.tsx:167`: same.
- `BillingPage.tsx:91`: `<h3 className="font-semibold text-lg mb-4">`.
- `LocationsPage.tsx`: no section heading at all between PageHeader and the grid.

**Recommendation:** introduce a `SectionTitle` primitive (`text-sm font-semibold uppercase tracking-wide text-muted-foreground` for tertiary, `text-base font-semibold` for primary). Replace ~10 ad-hoc `<h2>`/`<h3>` calls.

---

### 3. Card radius & padding drift

Canonical `Card` (`src/components/ui/card.tsx:15`) ships `rounded-2xl`, `py-4`, and `px-5` via `CardHeader`/`CardContent`. There are at least 5 contradictions:

| Surface | Override | Note |
| --- | --- | --- |
| `KPICard` (`src/components/shared/kpi-card.tsx:17`) | `<CardContent className="p-5">` | Always `p-5`, ignores Card's `size="sm"`. Conflicts with every other dashboard card that sits at `p-4`. |
| `BookingsPage` day cells (`src/pages/admin/BookingsPage.tsx:295,311`) | `CardHeader p-3 pb-1`, `CardContent p-2 pt-0` | Tight grid view but `rounded-lg` would be more honest at this density. |
| `StaffPage` cards (`src/pages/admin/StaffPage.tsx:382, 410`) | `CardHeader pb-3` + `CardContent space-y-3` (no padding override → keeps default `px-5`) | Mixes default + override. |
| `RewardsPage` summary cards (`src/pages/consumer/RewardsPage.tsx:84-118`) | `<CardContent className="p-4 …">` | Three sibling cards, three different intents. |
| `Marketing → Loyalty tier cards` (`src/pages/admin/MarketingPage.tsx:369-403`) | `CardHeader pb-2`, default `CardContent` | Three cards each with different colour token sets (`bg-amber-50/50`, `bg-gray-50/50`, `bg-yellow-50/50`). |
| `LocationsPage` grid items (`src/pages/admin/LocationsPage.tsx:140`) | Raw `<div className="p-5 rounded-2xl border bg-card …">` | Bypasses `<Card>` entirely; loses hover shadow. |
| `BillingPage` plan cards (`src/pages/admin/BillingPage.tsx:96-128`) | Raw `<div className="p-6 rounded-2xl border bg-card …">` | Same issue — bypasses `<Card>`. |
| `FlowsPage MetricCard` (`src/pages/admin/FlowsPage.tsx:191-201`) | `<Card className="p-4">` (whole card) | Sets padding on the root, fighting Card's internal `py-4`. |
| `FlowsPage FlowRow` (`src/pages/admin/FlowsPage.tsx:212`) | Raw `<div className="… rounded-lg border …">` | Should be a `<Card size="sm">`. |

**Recommendation:** Forbid raw `<div className="rounded-2xl border bg-card …">`. Every "card" must use `<Card>` (or `<Card size="sm">` for tight density). KPICard's `p-5` should drop to `p-4` to match its peers.

---

### 4. Slide-over (Sheet) scroll behaviour

The shell's slide-overs do not scroll the same way:

| Sheet | Body pattern | Footer | Scroll lock |
| --- | --- | --- | --- |
| `AppointmentDetailSheet` (`src/components/calendar/appointment-detail-sheet.tsx:343`) | `flex flex-col p-0 gap-0` + tabs with `flex-1 overflow-y-auto` per tab | Sticky footer (`sticky bottom-0`, `:455`) | OK |
| `CheckoutSheet` (`src/components/checkout/checkout-sheet.tsx:47`) | `flex flex-col p-0 gap-0` + body `flex-1 overflow-y-auto` | Inline non-sticky footer (`px-6 py-4 border-t`, `:295`) | OK but footer scrolls with body in some phases |
| `staff/CalendarPage` Sheet (`src/pages/staff/CalendarPage.tsx:329`) | `<SheetContent side="right" className="overflow-y-auto">` then `<div className="space-y-6 p-4 pt-0">` | None (action button just sits in flow) | Body scrolls but no sticky footer |
| `MobileNav Sheet` from TopBar (`src/components/shared/top-bar.tsx:95`) | `<SheetContent side="left" className="p-0">` + `<SheetHeader>` + `<div className="px-3 pb-4 space-y-3">` | None (wraps full nav) | OK |

**Issues:**
- `staff/CalendarPage` puts `overflow-y-auto` on `SheetContent`, but the canonical `SheetContent` is already `flex flex-col gap-4`. Adding scroll to the *outer* container instead of an inner body means the sheet header scrolls away with the content. Fix: switch to `flex flex-col p-0 gap-0` + an inner scroll region, matching `AppointmentDetailSheet`.
- `appointment-detail-sheet` ships `w-[480px] sm:max-w-md` (`:343`) — `SheetContent` already supplies `data-[side=right]:sm:max-w-sm`. The override widens the sheet by ~96px on `sm` only. It's fine but should be a consistent constant (`SHEET_W = 'sm:max-w-md'`) shared with `CheckoutSheet`.
- `Dialog` content for `BookingsPage` (`:362,481`) and `StaffPage` (`:505,518`) hard-code `sm:max-w-[500px]` / `sm:max-w-md` — three different widths for the same kind of form dialog.

**Recommendation:** Pull the slide-over recipe into a `<DetailSheet>` wrapper that owns: header / scrollable body / sticky footer / consistent width. Migrate `staff/CalendarPage` to it first.

---

### 5. Buttons — variant mismatch in destructive flows

The canonical destructive variant is `variant="destructive"` (`button.tsx:19-20`). Cancel/delete actions actually use:

| File:Line | Pattern | Issue |
| --- | --- | --- |
| `BookingsPage.tsx:561-569` | `<Button variant="destructive">Cancel Booking</Button>` | Correct |
| `appointment-detail-sheet.tsx:471` | `<Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">Cancel</Button>` | Manual destructive ghost — drift |
| `ServicesPage.tsx:241-247` | Trash icon button is `variant="ghost"` with `text-destructive` only on the icon | Tap target hides destructive intent |
| `flows-row` (`FlowsPage.tsx:240`) | Raw `<button>` with `hover:text-destructive` | Bypasses Button entirely |
| `staff/CalendarPage` cancel | No cancel button — only "Mark Complete" | Inconsistent with admin sheet |
| `consumer/AppointmentsPage:371` | `<Button variant="destructive" size="sm">` | Correct |

Confirmation dialogs are also a mix:
- `ServicesPage.tsx:127` uses `window.confirm`.
- `FlowsPage.tsx:74` uses `confirm`.
- `LocationsPage.tsx:107-114` uses a toast as a *blocker*, not a dialog.
- `BookingsPage.tsx:561` opens the cancel inline (no confirm).

**Recommendation:** ban `window.confirm()` in admin pages. Provide a `<ConfirmDialog>` primitive. Standardize destructive ghost as `<Button variant="ghost" className="text-destructive">`.

---

### 6. Icon size drift

`button.tsx:7` already injects `[&_svg:not([class*='size-'])]:size-4`, which means **inside a `<Button>` you don't need to size the icon at all**. Half the codebase respects this; the other half passes `h-4 w-4`:

| Pattern | Files using new convention | Files using old convention |
| --- | --- | --- |
| Inside `<Button>` | `FlowsPage:86`, `FlowEditorPage:113`, `SettingsHubPage:168`, `appointment-detail-sheet:425` (`size-4`) | `BookingsPage:217`, `ClientsPage:172`, `StaffPage:352`, `ServicesPage:148`, `MarketingPage:201`, `Dashboard*`, `Inventory*`, `auth/*`, `consumer/*`, `staff/EarningsPage`, etc. (`h-4 w-4`) |
| Inline icon (no Button) | most new code | most old code |

By raw count: `h-X w-X` appears 188 times across 27 page files, vs `size-X` ~120 times across 40 files. Both will keep growing if not standardised.

**Specific drift inside the same file:**
- `appointment-detail-sheet.tsx` mixes `size-3.5`, `size-4`, `h-3 w-3` — at least 6 distinct icon sizes in one slide-over.
- `LandingPage.tsx`, `PublicBookPage.tsx` ship 24 raw `h-X w-X` calls each.

**Recommendation:** one-shot codemod to convert `className="h-(\d+(?:\.\d+)?) w-\1"` → `className="size-$1"` and run prettier. Inside `<Button>`, drop the size class entirely.

---

### 7. Tabs — three different `TabsList` shapes

`Tabs` is used on at least 5 surfaces with 5 different visual shapes:

| Page | TabsList class | Width |
| --- | --- | --- |
| `ClientProfilePage:434` | default | shrinks to content |
| `MarketingPage:191` | `w-full sm:w-auto` | full on mobile |
| `SettingsPage:107` | `w-full flex-wrap h-auto gap-1` | wraps! |
| `consumer/AppointmentsPage:121` | default | content width |
| `staff/ClientsPage:215` | `w-full` | full |
| `staff/CalendarPage:184` | default | content width |

The `flex-wrap` `TabsList` on SettingsPage (`SettingsPage.tsx:107-124`) is unique — it's the only place that lets tabs wrap to a second row. With four tab triggers and lucide icons it produces a visibly different chrome from every other tabbed page.

**Recommendation:** the canonical Tabs surface should own its own width pattern (`w-full sm:w-auto` or pure `auto`). SettingsHubPage already replaced this with a left rail, so the tabs flavour can be chosen per page-type rather than per page.

---

### 8. Filter / search bars — no shared layout

Every page that lists records ships its own filter row:

| Page | Search position | Filter chip style | Spacing |
| --- | --- | --- | --- |
| `ClientsPage` (`ClientsFilterSidebar`) | left rail | `bg-primary/15 text-primary border-primary/40` chips | `gap-6` |
| `ServicesPage:155` | inline `<Input>` + `Select` | none — uses Select | `gap-3` |
| `InventoryPage:148` | inline + icon-prefixed `<Input>` | toggle Button | `gap-3` |
| `BookingsPage:224` | none — only Selects | none | `gap-3` |
| `InboxPage:142` | full-width search inside aside | rounded-pill chip row | `space-y-3` |
| `Calendar toolbar` | none — has `Filters` Popover with checklist | checkbox-style | inside Popover |
| `MyBookingsPage:67` | full email search (CTA-style) | none | center |

There are at least three different search-input affordances:
1. `<Input placeholder="Search …">` plain (BookingsPage doesn't even have one).
2. `<Input>` with absolute-positioned `<Search>` icon at `left-3 top-1/2 -translate-y-1/2 h-4 w-4` (ServicesPage, InventoryPage, BookPage, ClientsFilterSidebar, InboxPage, staff/ClientsPage).
3. Pill-style search inside a card (MyBookingsPage).

**Recommendation:** lift the icon-prefixed search input into `<SearchInput>` in `components/ui/`. Standardise list-page filter rows on a shared `<FilterBar>` (search left, selects right, toggle/clear right-most).

---

### 9. Color tokens for status, tier, and category — six parallel systems

There is no single source of truth for "category color" or "tier color":

| File | What it colors | Map name |
| --- | --- | --- |
| `status-badge.tsx:5` | Booking status | `statusConfig` |
| `STATUS_STYLES` (`lib/calendar/utils`) | Booking status (calendar pills) | duplicate of above |
| `ServicesPage.tsx:34-44` | Service category | `categoryColors` + `categoryGradients` |
| `BookPage.tsx` (consumer) | Service category | inline (uses Badge default) |
| `service-catalog.tsx:18-22` | Service category | `categoryClasses` (purple/rose/emerald — different from Services!) |
| `tierConfig` (`ProfilePage.tsx:30-34`) | Loyalty tier | `tierConfig` |
| `tierColors` (`staff/ClientsPage.tsx:33-37`) | Loyalty tier | `tierColors` (different palette) |
| `tierBadgeClass` (`clients-table.tsx:27-31`) | Loyalty tier | `tierBadgeClass` (third palette) |
| `KIND_BG` (`ClientProfilePage.tsx:54`) | Timeline event | `KIND_BG` |
| `BookingsPage.tsx:48-53` | Day-cell appointment color (5th!) | `COLOR_PALETTE` |

Tier alone has three palettes (purple/pink for ProfilePage, amber/gray/orange for staff/ClientsPage, amber/slate/orange for the admin clients table).

**Recommendation:** centralise tier/status/category palettes in `src/lib/ui/palettes.ts`. Status already has `STATUS_STYLES` — extend that pattern.

---

### 10. Spacing & gutters

`PortalLayout` (`portal-layout.tsx:19`) wraps admin pages in `pt-14 px-4 md:px-8 py-6` (admin) or `p-4 md:p-8 pt-16 md:pt-8` (staff/consumer). `PageHeader` adds its own `mb-6`. So the canonical first row of any page sits at `py-6` from the top.

Drift:
- `staff/SchedulePage.tsx:121` adds `p-6 space-y-6` *inside* PortalLayout. Doubled padding.
- `SettingsHubPage.tsx:87` adds `-mt-2`. Negative offset that cancels half of `py-6`.
- `ClientProfilePage.tsx:371` adds `-mt-2`. Same issue.
- `CalendarPage.tsx:135`, `InboxPage.tsx:132` use `-mt-6 -mx-4 md:-mx-8`. Both *intentional* full-bleed; should be a shared `<FullBleed>` wrapper not magic numbers.

`space-y-*` between blocks varies: the standard is `space-y-6`. Drift cases: `BillingPage.tsx:50` (`space-y-8`), `SettingsHubPage.tsx:87` (`space-y-4`), `FlowEditorPage.tsx:97` (`space-y-5`), `AnalyticsPage.tsx:217` (`space-y-6` ✓), `Marketing.tsx:162` (`space-y-6` ✓ but tabs add `space-y-4`).

**Recommendation:** codify `PortalLayout` gutters as `--page-px` / `--page-py` CSS vars; use a single `<FullBleed>` component for break-out pages.

---

## Per-surface review

### CalendarPage (admin/CalendarPage.tsx)
- **Alignment:** Toolbar (`calendar-toolbar.tsx`) aligns icons inside `size="sm"` and `size="icon-sm"` — clean. `Today` button is `variant="ghost"` `size="sm"`, prev/next are `icon-sm` — works.
- **Hierarchy:** No `PageHeader` (intentional, full-bleed). The negative-margin trick on `:135` is correct for this page only.
- **Scrolling:** Right `TodayQueue` aside has a sticky header (`:56`) and inner scroll. The center grid uses `flex-1 overflow-hidden`. Body scroll is correctly locked to internal regions. `TodayQueue` has a collapsed mode at `:46-52` — nice detail.
- **Cards:** Quick-create dialog (`:254`) uses `sm:max-w-md` — consistent.
- **Buttons:** `Today` button at `:153` is `size="sm"` ghost — fine. `icon-sm` prev/next render lucide icons correctly via `[&_svg:not([class*='size-'])]:size-3.5`.
- **Icons:** Uses `size-X` consistently. The new convention.
- **Top fix:** none critical. The page is the gold standard.

### DashboardPage (admin/DashboardPage.tsx)
- **Alignment:** KPI grid uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4` — consistent with rest of admin grids.
- **Hierarchy:** Standard `PageHeader`. `<CardTitle>` is consistent (`text-base` from card.tsx).
- **Scrolling:** "Upcoming Appointments" uses inner scroll `max-h-[420px] overflow-y-auto pr-1` (`:290`). One-off — every other dashboard card lets content flow naturally.
- **Cards:** KPICard padding `p-5` (`shared/kpi-card.tsx:17`) is heavier than peers. Charts cards use default `<CardContent>` (`px-5`).
- **Buttons:** No buttons in the dashboard layout proper.
- **Icons:** `<TrendingUp className="h-5 w-5" />` (`:223`), `<Calendar className="h-5 w-5" />` (`:285`) — should be `size-5`.
- **Top fix:** drop the `max-h-[420px]` scroll on the upcoming list and let the card grow, OR convert it to a paginated `<Table>`. Inner scroll inside an outer scroll is the worst of both.

### BookingsPage (admin/BookingsPage.tsx) — legacy
- **Alignment:** Filter bar at `:224` uses `gap-3` while every other admin page uses `gap-3` or `gap-6`. OK. Week-grid header at `:255` aligns `prev/next/Today` left and the date label right.
- **Hierarchy:** Page heading via `PageHeader`. In-grid `CardTitle` (`:296`) re-implements an EEE/d stack — duplicates BookingsPage's own `:282-309` AND `staff/CalendarPage.tsx:256-272`. Two implementations of the same widget.
- **Scrolling:** Page scrolls naturally; no inner regions.
- **Cards:** `min-h-[180px]` on day cells (`:291`); colored buttons inside use `rounded-md` (line 326) — **drift** vs `rounded-lg` standard for tap targets.
- **Buttons:** `<Plus className="h-4 w-4 mr-2" />` (`:217`, `:567`) — old convention.
- **Icons:** `h-4 w-4`, `h-3.5 w-3.5`, `h-3 w-3` mixed. `h-3 w-3` Badge avatars.
- **Top fix:** retire the page or merge it into the calendar. It's the largest single source of drift in the admin shell. If kept, normalize day-cell tile to `rounded-xl`, drop `COLOR_PALETTE` (use `STATUS_STYLES`), and switch the Booking-create dialog to use the same one as `CalendarPage`'s quick-create.

### ClientsPage (admin/ClientsPage.tsx)
- **Alignment:** Two-column `flex flex-col lg:flex-row gap-6` with sidebar + table. `ClientsFilterSidebar` is `lg:sticky lg:top-20 lg:self-start`. Clean.
- **Hierarchy:** `PageHeader` with description showing live stats (`:163`). Strong.
- **Scrolling:** No inner scroll — page-level. Table grows.
- **Cards:** Empty state wraps `<EmptyState>` in a `rounded-lg border bg-card` (`:197`) — should just use a `<Card size="sm">`.
- **Buttons:** `<Plus className="h-4 w-4 mr-1.5" />` (`:172`) — uses `mr-1.5`. Compare with `BookingsPage.tsx:217` which uses `mr-2`. **Drift.**
- **Icons:** `h-4` and `h-3.5` mix.
- **Top fix:** swap the manual empty-state wrapper for `<Card>`.

### ClientProfilePage (admin/ClientProfilePage.tsx)
- **Alignment:** Two-column profile with sticky aside. The `:371` `-mt-2` shouldn't exist (cancels `PortalLayout` `py-6`). Tab triggers (`:434-440`) use `mr-1.5` for icons — consistent.
- **Hierarchy:** Aside `h1` is `text-lg` — *not* `text-2xl` — because it's inside a card. Acceptable, but means the `<h1>` on this route is smaller than every other route's `<h1>`.
- **Scrolling:** Page-level scroll. Aside is sticky. Tab content lives inside one big `<Card className="p-5">`.
- **Cards:** `<Card className="p-5">` (`:441`) — drift again from canonical `p-4` Card. KPICard is `p-5`, this is `p-5`, the booking sheet detail card is `p-4`. Pick one.
- **Buttons:** Action stack at `:418-427` uses three different sizes (default, default, `size="sm"`). Looks deliberate — primary > secondary > tertiary — but the `Edit` button being `size="sm"` while the rest are `default` makes the button column look unstable.
- **Icons:** `size-3.5` and `h-3 w-3` mixed in the contact chips.
- **Top fix:** unify the action stack — three `size="default"` buttons in the same width column read better than 2+1.

### StaffPage (admin/StaffPage.tsx) — legacy
- **Alignment:** Wraps in plain `<div>` (no `space-y-6`!) at line 346, then `PageHeader` then grid. Every other admin page uses `space-y-6` outer. **Drift.**
- **Hierarchy:** OK headers. Avatar circle (`:386`) reinvents the Avatar primitive (40 → 40 colored circle with initials).
- **Scrolling:** None.
- **Cards:** Default `Card` + `CardHeader pb-3` + manual `space-y-3` inside `CardContent`. Mixed.
- **Buttons:** "Mark complete" trigger at the form (`:339`) is plain text, while every other modal uses `Button`. Cancel/Submit footer uses `flex justify-end gap-2` — matches BookingsPage. Good.
- **Icons:** `h-4 w-4`, `h-3.5 w-3.5` mixed. `<Star>` rating uses `h-3.5 w-3.5` — fine.
- **Top fix:** **replace the inline `<textarea className="…">` (`:263-269`) with `<Textarea>` from `@/components/ui/textarea`**. The class string has already drifted from canonical (no `placeholder:text-muted-foreground` color in dark mode). Also wrap the page body in `space-y-6`.

### ServicesPage (admin/ServicesPage.tsx) — legacy
- **Alignment:** Cards in a `grid` with consistent gaps. Photo / placeholder image at `h-40` — fine. Action icons stacked top-right (`:233-247`) with `size="icon"` — should be `icon-sm` to match the surrounding density.
- **Hierarchy:** `<CardTitle className="text-lg">` (`:220`) overrides Card's default `text-base`. **Drift.**
- **Scrolling:** Dialog uses `max-w-lg max-h-[90vh] overflow-y-auto` (`:289`) — internal scroll is fine.
- **Cards:** Standard.
- **Buttons:** `<Plus className="h-4 w-4 mr-2" />` everywhere — old convention. Trash icon button is destructive but uses `variant="ghost"` with `text-destructive` only on the icon — easy to miss.
- **Icons:** mostly `h-3.5 w-3.5` and `h-4 w-4`.
- **Top fix:** Convert the trash button to `variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10"`. Drop `text-lg` override on `CardTitle`.

### InventoryPage (admin/InventoryPage.tsx) — legacy
- **Alignment:** Standard PageHeader + filter row + low-stock alert banner + table inside Card.
- **Hierarchy:** Banner is `rounded-lg border-amber-300 bg-amber-50 …` (`:139`) — done by hand instead of via a shared `<Alert>` component. Compare with `BillingPage.tsx:54-87` (different status banner pattern) and `TrialBanner` (third pattern).
- **Scrolling:** Table is in a card with `<CardContent className="p-0">` so the table flows correctly.
- **Cards:** OK.
- **Buttons:** Add 5 / Use 1 actions are `variant="outline" size="icon" className="h-8 w-8"` (`:247-262`). The new way: `size="icon-sm"` (already h-8). **Three places** in the file override the default 9×9 to 8×8 with arbitrary classes.
- **Icons:** `h-4 w-4` everywhere.
- **Top fix:** swap the `<Button … className="h-8 w-8">` pairs for `<Button size="icon-sm">`. Then build a shared `<AlertBanner kind="warning">`.

### AnalyticsPage (admin/AnalyticsPage.tsx)
- **Alignment:** Date-range card at top (`:224-247`), then 2-col grid of charts.
- **Hierarchy:** All `<CardTitle>` instances use `flex items-center gap-2` with a lucide icon. **Consistent across this page** — strong.
- **Scrolling:** Page-level only.
- **Cards:** All canonical `<Card>` + `<CardHeader>` + `<CardContent>`. Heatmap card has `overflow-x-auto` inner — fine.
- **Buttons:** None.
- **Icons:** `h-5 w-5` for card title icons. Should be `size-5`.
- **Top fix:** none load-bearing. Convert title icons to `size-5`.

### MarketingPage (admin/MarketingPage.tsx)
- **Alignment:** PageHeader + Promo card + Tabs. Promo card (`:170-188`) is bigger than the page header — visual hierarchy inverted.
- **Hierarchy:** TabsList `w-full sm:w-auto` — clean. Inner tab content uses Card grids.
- **Scrolling:** Page-level.
- **Cards:** Loyalty tier cards (`:369-403`) — three sibling cards with three different border + bg color sets that don't match the StatusBadge palette. `bg-amber-50/50`, `bg-gray-50/50`, `bg-yellow-50/50` are bespoke.
- **Buttons:** Most actions are `default`. The "Send Campaign" button at `:281` uses `w-full` — fine. Coupon "copy code" uses `variant="ghost" size="sm"` — fine.
- **Icons:** `h-4 w-4 mr-2` — old convention. Drop `mr-2` and let Button supply spacing.
- **Top fix:** retitle the Promo card or shrink it (it should be sub-header sized, not 2x the header). Replace the bespoke loyalty palette with the shared `tierColors`.

### FlowsPage (admin/FlowsPage.tsx)
- **Alignment:** Three metric cards + flows list + templates. Metric card is `<Card className="p-4">` (`:193`) which sets padding *on Card root*, fighting Card's internal `py-4`. Should be `<Card size="sm">`.
- **Hierarchy:** Strong — `font-semibold` h2, `:101`.
- **Scrolling:** Page-level.
- **Cards:** `FlowRow` (`:212`) is a raw `<div>` with `rounded-lg border …` — should be a Card.
- **Buttons:** `<Plus className="size-4 mr-1.5" />` — **new convention**. ✓
- **Icons:** `size-X` everywhere. ✓
- **Top fix:** convert `MetricCard` and `FlowRow` to use `<Card size="sm">`.

### FlowEditorPage (admin/FlowEditorPage.tsx)
- **Alignment:** Top header is built ad-hoc (`:97-115`) — no `PageHeader`. Save button on right, Active switch + label, breadcrumb-style "← All flows" on left.
- **Hierarchy:** No `<h1>`. Section labels are `<h2>` at `:147`. Trigger picker label is `<Label>`.
- **Scrolling:** Page-level. The popover for trigger picker is `max-h-72 overflow-y-auto` (`:201`) — sensible.
- **Cards:** Header card is **raw `<div className="rounded-2xl border border-border bg-card p-5 space-y-4">`** (`:118`). Step cards (`:251`) are also raw `<div>`. **Two raw card-like surfaces.**
- **Buttons:** `<Save className="size-4 mr-1.5" />` — new convention. ✓
- **Icons:** `size-X` consistently.
- **Top fix:** wrap the header `<div>` and step cards in `<Card>`. Either ship a real PageHeader breadcrumb slot or codify a `BreadcrumbBar` so this page reads like the rest.

### InboxPage (admin/InboxPage.tsx)
- **Alignment:** Three-column layout (thread list aside + conversation panel) with own borders. Sticky thread-list header at `:135`. Strong.
- **Hierarchy:** No `PageHeader` (intentional, full-bleed).
- **Scrolling:** `flex h-[calc(100vh-3.5rem)]` (`:132`) — calculates exactly the shell height. Inner aside has `flex-1 overflow-y-auto`. Conversation body has `flex-1 overflow-y-auto`. Composer has its own `border-t` row. **Best-in-class scroll behaviour in the codebase.**
- **Cards:** Inbox is card-less by design.
- **Buttons:** Send button at `:272` uses `<Send className="size-3.5 mr-1.5" />` — new convention. ✓
- **Icons:** `size-X`. ✓
- **Top fix:** none load-bearing. Could share the `flex h-[calc(100vh-3.5rem)] -mt-6 -mx-4 md:-mx-8` recipe with `CalendarPage` via a `<FullBleed>` wrapper.

### LocationsPage (admin/LocationsPage.tsx)
- **Alignment:** Standard `PageHeader` + grid. The "add card" tile at the end (`:181-188`) is a button styled as a dashed card — nice pattern.
- **Hierarchy:** OK.
- **Scrolling:** Page-level.
- **Cards:** **Raw `<div className="p-5 rounded-2xl border bg-card …">`** (`:140`). Should be `<Card>`. Same drift as Billing.
- **Buttons:** Mostly `variant="ghost" size="sm"`. Edit/Power buttons sit in the same row — Power has no label, just an icon with `aria-label` — looks unfinished compared to the Edit button.
- **Icons:** Mixed `h-X w-X`.
- **Top fix:** convert raw card div to `<Card>`. Add a label to the Power button or wrap in tooltip.

### BillingPage (admin/BillingPage.tsx)
- **Alignment:** Status card (`:54-87`) + plan grid.
- **Hierarchy:** Section uses raw `<h3 className="font-semibold text-lg mb-4">` (`:91`). `<h2>` at `:67`. Headings are inconsistent — every page introduces its own `<h2>`/`<h3>` styles. Use `SectionTitle`.
- **Scrolling:** Page-level.
- **Cards:** **Raw `<div className="p-6 rounded-2xl border bg-card …">`** (`:97`). Should be `<Card>` with `p-6` content override.
- **Buttons:** Plan CTAs use `variant={isCurrent ? 'outline' : 'default'}` and `disabled={isCurrent}` — clean.
- **Icons:** `h-4 w-4`, `h-5 w-5` mix.
- **Top fix:** raw plan card → `<Card>`. Section title → shared component.

### SettingsPage (admin/SettingsPage.tsx) — legacy
- **Alignment:** TabsList wraps to second row on smaller screens (`w-full flex-wrap h-auto gap-1`, `:107`) — only page in the codebase that does this.
- **Hierarchy:** Each tab body is a single `<Card>` with `<CardHeader>` and `<CardContent>` — consistent at the section level.
- **Scrolling:** Page-level. Reminder cadence card embeds chips that wrap.
- **Cards:** OK.
- **Buttons:** "Save Changes" buttons inside each tab use `<Save className="h-4 w-4" />` and the description is `flex items-center gap-2` — old icon-with-label pattern. Same button repeats 4× in the same component.
- **Icons:** `h-4 w-4`, `h-5 w-5`. Old convention.
- **Top fix:** SettingsHubPage already replaces this — remove SettingsPage from the nav once parity is reached, or hide behind `?legacy=1`.

### SettingsHubPage (admin/SettingsHubPage.tsx)
- **Alignment:** macOS-style left rail + content. Rail uses `lg:sticky lg:top-20`. Strong.
- **Hierarchy:** PageHeader at top + per-panel `<CardTitle>` with icon.
- **Scrolling:** Page-level. Each panel is a single Card, no inner scroll.
- **Cards:** Canonical `<Card>` + `<CardHeader>` + `<CardContent>`.
- **Buttons:** Save buttons consistently `<Save className="size-4 mr-1.5" />`. **New convention** ✓
- **Icons:** `size-X`. ✓
- **Top fix:** drop the `-mt-2` outer offset.

### consumer/BookPage (consumer/BookPage.tsx)
- **Alignment:** 4-step indicator at the top (`:131-150`). Step circles are `w-8 h-8 rounded-full` — should be `size-8 rounded-full`.
- **Hierarchy:** PageHeader present. Step labels are `text-sm`.
- **Scrolling:** Page-level.
- **Cards:** Service cards use `aspect-video` photo + content — same shape as admin ServicesPage but with different padding (`p-4` vs `p-0+CardContent p-4`). Inconsistent.
- **Buttons:** "Continue" uses `<Button disabled={…}>`, no size. "Confirm Booking" uses `<CalendarDays className="h-4 w-4 mr-2" />` (`:413`) — old convention.
- **Icons:** old `h-X w-X` everywhere.
- **Top fix:** replace `mr-2` icon-with-label with the canonical pattern. Standardise the service card to use the *same* shape as ServicesPage's display card.

### consumer/AppointmentsPage
- **Alignment:** `BookingCard` (`:210-382`) lays out avatar, title, dates, status, and 3-button action row. The action row uses `gap-2 shrink-0` — clean.
- **Hierarchy:** PageHeader + Tabs(`upcoming|past`).
- **Scrolling:** Page-level.
- **Cards:** Bookings list uses `<Card>` with `<CardContent className="p-4">` — canonical.
- **Buttons:** Reschedule + cancel + .ics download all `variant="outline" size="sm"` — clean.
- **Icons:** `h-3.5 w-3.5 mr-1` — old convention.
- **Top fix:** none critical.

### consumer/ProfilePage, RewardsPage
- Both use canonical `<Card>` and `<PageHeader>`. ProfilePage wraps form fields in `space-y-2` `Label`+`Input` pairs — same pattern as everywhere else.
- RewardsPage's three top summary cards (`:84-118`) ship an icon-circle + label + value pattern that is almost identical to `KPICard` but doesn't reuse it. **Should reuse KPICard.**
- "Available Rewards" cards at `:138-171` ship `<Card className={!canAfford ? 'opacity-60' : ''}>` then `<CardContent className="p-4 space-y-3">` — fine.

### staff/CalendarPage
- **Alignment:** Day view uses a custom 1hr-slot list with `min-h-[72px]` rows (`:218-232`). Week view uses 7-column card grid. Slot card uses `border-l-4 border-l-primary` — the only place in the app with that pattern. Acceptable as a personal-calendar accent.
- **Hierarchy:** PageHeader + Tabs.
- **Scrolling:** Body scrolls; sheet has `overflow-y-auto` on the SheetContent itself (incorrect — see Theme #4).
- **Cards:** Week-view cards use `<CardHeader p-3 pb-1>` + `<CardContent p-3 pt-1>` — fine. The day-cell EEE/d header (`:256-272`) is its own implementation.
- **Buttons:** Standard.
- **Icons:** `h-4 w-4`, `h-3.5 w-3.5`. Old convention.
- **Top fix:** rebuild the sheet body to `flex flex-col p-0 gap-0` + inner scroll region (Theme #4).

### staff/ClientsPage
- **Alignment:** Search at top (`max-w-sm`), grid of cards (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`).
- **Hierarchy:** PageHeader + Card-per-client. Detail Dialog wraps a Tabs.
- **Scrolling:** Dialog has `max-h-[85vh] overflow-y-auto` — fine.
- **Cards:** Default `<Card>` `<CardContent className="p-5">` — drift (`p-5` vs canonical `p-4`).
- **Buttons:** None inside the card itself.
- **Icons:** `h-3.5 w-3.5` shrink-0.
- **Top fix:** padding to `p-4`.

### staff/EarningsPage
- **Alignment:** KPI grid + 2-column charts/target + commission table. Standard.
- **Hierarchy:** PageHeader + KPICard.
- **Scrolling:** Page-level.
- **Cards:** KPICard (heavy `p-5`), chart cards default. Table card default.
- **Buttons:** None.
- **Icons:** lucide via KPICard.
- **Top fix:** none.

### staff/SchedulePage
- **Alignment:** Wraps page in `<div className="p-6 space-y-6">` (`:121`) — **doubled padding** since PortalLayout already provides it.
- **Hierarchy:** PageHeader + 3 cards. Each card has its own `<CardTitle>` with icon.
- **Scrolling:** Page-level.
- **Cards:** `<Card>` with `<CardContent>` defaults. Time inputs are `w-32` ✓.
- **Buttons:** "Save Hours", "Save Blocked Dates" use `<Save className="h-4 w-4 mr-2" />` — old convention, repeats 2×.
- **Icons:** `h-4 w-4`, `h-3 w-3`.
- **Top fix:** **drop the outer `<div className="p-6 …">`** wrapper. Replace with `space-y-6` only.

### auth/LoginPage, RegisterPage
- LoginPage uses a fixed top bar (`:37-47`) that re-implements the admin top bar at smaller scale. Inputs are `rounded-lg h-10`, button is `rounded-full h-10` — pill-style for marketing. *Intentional.*
- Quick Demo Login buttons are `h-12 rounded-xl` outline buttons with custom child layout — the pattern is reused 3×, would be a good `<RoleQuickLoginCard>` primitive.
- RegisterPage uses `bg-gradient-to-br from-purple-50 to-pink-50` and a 16×16 gradient circle — different gradient from LoginPage's primary→accent. **Drift.** Use one auth chrome.

### auth/VendorSignupPage
- 4-step indicator (`:100-122`) is a *third* implementation of step indicator (BookPage and Login also have variants).
- Form fields use `space-y-2` `Label`+`Input` consistently.
- Step preview row is its own ad-hoc `<div className="flex justify-between gap-4">` definition list at `:253-258`.
- **Top fix:** factor a shared `<Stepper steps={STEPS} current={step} />`. Reuse on BookPage step 1-4.

### LandingPage, ForBusinessPage, ExpressBookingPage, MyBookingsPage, PublicBookPage
- All five are public marketing/express surfaces with their own top bars and gradient backgrounds. They are intentionally outside the admin shell, but they all reach for `h-X w-X` icon sizing instead of `size-X`. ExpressBookingPage uses the *new* shared `BookingCart`/`SlotPicker` components and is closer to the admin look.
- **MyBookingsPage** has no `<h1>` on the route — the heading is `<h2>` at `:84`. Needs a real `<h1>`.

---

## Recommended fix sequence

| Priority | Fix | Effort | Files touched |
| --- | --- | --- | --- |
| P0 | Drop `<div className="p-6 space-y-6">` wrapper on staff/SchedulePage; add `space-y-6` to StaffPage outer; remove `-mt-2` on SettingsHubPage and ClientProfilePage | 15min | `staff/SchedulePage.tsx`, `admin/StaffPage.tsx`, `admin/SettingsHubPage.tsx`, `admin/ClientProfilePage.tsx` |
| P0 | Convert raw `<textarea>` to `<Textarea>` in admin/StaffPage.tsx | 5min | `admin/StaffPage.tsx` |
| P0 | Convert raw `<div className="rounded-2xl border bg-card p-X">` blocks to `<Card>` (Billing plans, Locations grid, FlowsPage MetricCard/FlowRow, FlowEditorPage step cards) | 1hr | `admin/BillingPage.tsx`, `admin/LocationsPage.tsx`, `admin/FlowsPage.tsx`, `admin/FlowEditorPage.tsx` |
| P0 | Standardize KPICard padding to `p-4` (drop the `p-5` override) | 5min | `shared/kpi-card.tsx` |
| P1 | Codemod icons inside `<Button>`: drop `h-X w-X` and `mr-2` → use `mr-1.5` only when paired with text | 1hr | ~25 files |
| P1 | Replace bespoke confirm dialogs (`window.confirm` in ServicesPage, FlowsPage) with a shared `<ConfirmDialog>` | 30min | `admin/ServicesPage.tsx`, `admin/FlowsPage.tsx`, plus new `components/ui/confirm-dialog.tsx` |
| P1 | Add a `<FullBleed>` wrapper for break-out pages, replace `-mt-6 -mx-4 md:-mx-8` magic strings | 30min | `admin/CalendarPage.tsx`, `admin/InboxPage.tsx` |
| P1 | Fix staff/CalendarPage Sheet body: switch from `SheetContent overflow-y-auto` to `flex flex-col p-0 gap-0` + inner scroll region; mirror AppointmentDetailSheet | 30min | `staff/CalendarPage.tsx` |
| P1 | Add `<SearchInput>` primitive (icon-prefixed) and migrate ServicesPage, InventoryPage, BookPage, InboxPage, staff/ClientsPage | 45min | 5 files + new primitive |
| P2 | Promote `PageHeader` to support sticky behaviour, breadcrumb slot, and consistent `mb-6 / py-6` rhythm | 1hr | `shared/page-header.tsx` + ~17 callers |
| P2 | Centralise tier/category/status palettes into `lib/ui/palettes.ts`; migrate the 3 tier color maps and 2 category color maps | 1hr | `staff/ClientsPage.tsx`, `clients-table.tsx`, `consumer/ProfilePage.tsx`, `admin/ServicesPage.tsx`, `consumer/BookPage.tsx`, `booking/service-catalog.tsx` |
| P2 | Add `<Stepper>` primitive; reuse on consumer/BookPage and auth/VendorSignupPage | 30min | `consumer/BookPage.tsx`, `auth/VendorSignupPage.tsx`, plus new `components/ui/stepper.tsx` |
| P2 | Retire `admin/BookingsPage.tsx` from the nav (or merge into CalendarPage); drop `COLOR_PALETTE` and reuse `STATUS_STYLES` | 1hr | `admin/BookingsPage.tsx`, nav registry |
| P2 | Retire `admin/SettingsPage.tsx` once SettingsHubPage parity is verified | 30min | nav registry |
| P3 | Add `<AlertBanner kind="warning|destructive|info">` and migrate InventoryPage banner, BillingPage trial banner area, TrialBanner | 1hr | new primitive + 3 callers |
| P3 | Add `<h1>` to MyBookingsPage; demote in-card heading on ClientProfilePage to `text-base` (h2) so the route h1 lives in the URL crumb | 15min | `MyBookingsPage.tsx`, `admin/ClientProfilePage.tsx` |

Total P0+P1: ~5 hours of focused work. P2 ~3 hours. P3 ~1.5 hours.

---

## Appendix — Canonical values to enforce

These are the values that already win by frequency / by living in the primitive. Treat anything else as drift.

- **Card radius:** `rounded-2xl` (root). `rounded-xl` for nested tile-like buttons (slot pills, day cells). `rounded-lg` for inline list rows. **No** `rounded-md` on cards.
- **Card padding:** `<Card>` (default) → `py-4`, `<CardHeader px-5>`, `<CardContent px-5>`. `<Card size="sm">` → `py-3`, headers/content `px-4`. Don't override on individual pages.
- **Dialog content:** `rounded-2xl` `p-5` (from primitive). Width: `sm:max-w-md` for forms, `sm:max-w-lg` for richer flows. Don't hardcode `sm:max-w-[500px]`.
- **Sheet content for detail panels:** `flex flex-col p-0 gap-0 w-[480px] sm:max-w-md`. Header in own `border-b` row. Body in `flex-1 overflow-y-auto`. Sticky footer at `sticky bottom-0 mt-auto border-t bg-background`.
- **Button heights:** `default = h-9`, `sm = h-8`, `xs = h-7`, `lg = h-11`. Pill / icon variants follow. Don't ship `h-10`/`h-12` outside auth chrome.
- **Button radius:** `default/icon = rounded-xl`, `sm/xs = rounded-lg`, `lg = rounded-2xl`. Pill buttons (`rounded-full`) only on landing/auth.
- **Icon sizes inside Button:** **omit** — the primitive injects `size-4` automatically. For `size="sm"` it's `size-3.5`, for `size="xs"` it's `size-3`.
- **Icon sizes inline (lucide):** `size-3` micro, `size-3.5` small, `size-4` default, `size-5` heading, `size-8` empty-state. No `h-X w-X`.
- **Icon-with-label gap inside Button:** `gap-2` (default). Don't use `mr-2`.
- **Icon-with-label gap outside Button:** `gap-1.5` for chips, `gap-2` for headings.
- **PageHeader:** `<h1 className="text-2xl font-bold tracking-tight">` + optional `<p className="text-muted-foreground mt-1">`, wrapped in `flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6`.
- **Section title (in-page):** `text-base font-semibold` for primary, `text-xs font-semibold uppercase tracking-wider text-muted-foreground` for tertiary. Don't invent `text-lg font-semibold mb-4`.
- **Page outer wrapper:** `<div className="space-y-6">` — period. PortalLayout owns the gutters.
- **Filter bar:** `flex flex-col sm:flex-row gap-3`, search left, selects right, toggle/clear far-right.
- **Status / tier / category color:** import from `STATUS_STYLES` (status), `tierBadgeClass` (tier — to be promoted to shared), `categoryClasses` (category — to be promoted to shared). No more `bg-amber-100/50` ad-hoc.
- **Empty state:** `<EmptyState>` from `components/shared/empty-state.tsx`. Don't roll your own `flex flex-col items-center py-12`.
- **Modal/dialog cancel button:** `variant="ghost"` (matches Sheet close pattern). Save: `default`. Destructive: `variant="destructive"`. Don't use `variant="outline"` Cancel buttons except in confirm dialogs.
- **Avatar sizes:** `size="sm"` (24), default (32), `size="lg"` (40). Hand-sized avatars (`h-12 w-12`, `h-16 w-16`) only in profile heroes — and even there prefer `<Avatar className="size-12">`.
- **Confirm dialog:** never `window.confirm()` in admin code. Use a shared component.

---

*End of audit.*
