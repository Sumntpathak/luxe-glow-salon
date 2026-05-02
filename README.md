# 💅 Luxe Glow Salon — Premium Salon Booking Platform

> Modern, mobile-first salon and beauty-parlor booking system. Real-time availability, multi-staff scheduling, service catalogue, and a dashboard for the owner.

[![Live](https://img.shields.io/badge/live-luxe--glow--salon-0a7e3a?style=flat-square)](https://sumntpathak.github.io/luxe-glow-salon/)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](./LICENSE)
[![Stack](https://img.shields.io/badge/stack-React%20%C2%B7%20Vite%20%C2%B7%20Tailwind-orange?style=flat-square)](#-tech-stack)

**🌐 Live:** https://sumntpathak.github.io/luxe-glow-salon/

---

## 🎯 What It Is

A complete salon & beauty parlor management front-end: customers browse services, pick a stylist, book a slot, and pay; owners manage staff schedules, services, prices, and revenue from one dashboard. Built mobile-first for the Indian salon market.

---

## ✨ Features

### For Customers

- Browse services with photos and prices
- Pick a stylist from staff roster
- See real-time availability across the week
- Book appointments with date / time picker
- Get booking confirmation + reminders
- View booking history

### For Salon Owner

- Service catalogue management (add / edit / archive)
- Staff roster with individual schedules
- Calendar view (day / week / month) of all bookings
- Revenue dashboard with charts (recharts)
- Customer database
- Booking status workflow (pending / confirmed / done / cancelled)

### Tech Differentiators

- **TypeScript end-to-end** — strict types, fewer runtime surprises
- **shadcn/ui** components — accessible, beautiful out of the box
- **react-big-calendar** for the schedule grid
- **react-hook-form + Zod** validation throughout
- **Vitest** test suite

---

## 🛠️ Tech Stack

**Frontend** — React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui · @base-ui/react

**Forms / Validation** — react-hook-form · Zod resolvers

**Calendar** — react-big-calendar · react-day-picker · date-fns

**Charts** — recharts

**UX** — react-hot-toast · cmdk (command menu) · lucide-react

**Testing** — Vitest

---

## 🚀 Quick Start

```bash
git clone https://github.com/Sumntpathak/luxe-glow-salon.git
cd luxe-glow-salon
npm install
npm run dev
```

Opens at `http://localhost:5173`.

### Type Check

```bash
npm run type-check
```

### Run Tests

```bash
npm test
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📦 Deployment

### GitHub Pages (current)

```bash
npm run build
# Push /dist via gh-pages branch
```

Auto-deploys to https://sumntpathak.github.io/luxe-glow-salon/

---

## 📂 Project Structure

```
luxe-glow-salon/
├── src/
│   ├── components/    # shadcn/ui + custom components
│   ├── pages/         # Routes
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities, schemas
│   └── styles/        # Tailwind config + globals
├── public/            # Static assets
├── tests/             # Vitest test suite
└── tailwind.config.ts
```

---

## 🤝 Contributing

PRs welcome. Open an issue first for major features.

---

## 📄 License

MIT — see [LICENSE](./LICENSE)

---

## 👤 Author

**Sumant Pathak** — [@Sumntpathak](https://github.com/Sumntpathak)

Built with [Claude Code](https://www.anthropic.com/claude-code) using a multi-agent ticketing workflow.
