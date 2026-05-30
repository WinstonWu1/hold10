# Hold10

Hold10 is a small, mobile-first app that helps someone hold 10 minutes before the next bet.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Deploy

This is a static Vite app. Build output is written to `dist/`.

Recommended settings for static hosts:

- Build command: `npm run build`
- Output directory: `dist`
- Node version: 20 or newer

## Data

User progress is stored in `localStorage` on the current device. No backend is required for the current MVP.
