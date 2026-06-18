# Credit Card Expense Tracker

Mobile-first PWA for tracking credit card purchases and installment commitments. Fully offline, no backend required.

## Tech Stack

- **Vite 8** + **React 19** + **TypeScript 6** — Frontend framework
- **Material UI 7** — Component library
- **Dexie 4** — IndexedDB wrapper (offline persistence)
- **React Router 7** — Client-side routing
- **vite-plugin-pwa** — PWA manifest + service worker generation
- **vitest** + **@testing-library/react** — Testing

## Architecture

Clean Architecture with 4 layers:

```
src/
  domain/          # Enterprise business rules (no framework imports)
  application/     # Use cases / application services
  infrastructure/  # Database, external adapters
  presentation/    # UI components
```

See [Architecture.md](./Architecture.md) for details.

## Scripts

```bash
npm run dev        # Start dev server
npm run build      # Type-check + production build
npm run preview    # Preview production build
npm run test       # Run all tests
npm run test:watch # Run tests in watch mode
npm run lint       # Run ESLint
```

## Quick Start

```bash
npm install
npm run dev        # Open http://localhost:5173
```

To test the PWA locally:

```bash
npm run build
npm run preview    # Open http://localhost:4173 (install prompt available)
```

## Usage

See [UserGuide.md](./UserGuide.md).

## Project Status

See [PROJECT_STATE.md](./PROJECT_STATE.md).
