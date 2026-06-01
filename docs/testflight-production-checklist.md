# TestFlight And Production Checklist

Use this when the MVP interaction is ready enough to send to TestFlight or App Store review.

## Before Build

- Confirm `git status` is clean.
- Confirm Calm Tap final copy and interaction are acceptable.
- Confirm no development-only copy appears in the shipped app.
- Confirm Privacy Policy and Terms URLs are live:
  - `https://hold10-chi.vercel.app/privacy.html`
  - `https://hold10-chi.vercel.app/terms.html`
- Confirm public support email is chosen.

## Local Verification

Run from the project root:

```powershell
npm run build
```

Run from `native`:

```powershell
npx tsc --noEmit
```

Manual iPhone smoke test:

- Home loads.
- Start Calm Tap.
- Calm Tap haptics work.
- Calm Tap inhale/exhale guidance is understandable.
- Recovery Garden renders.
- Recovery Tally renders.
- Return Mode records a slip.
- Protection Wall checkboxes work.
- Help Now links open.
- Settings export/reset work.
- Quit and reopen app; local data persists.
- No red screen, blank screen, or development server dependency in production/TestFlight.

## Production Build

Run from `native`:

```powershell
npx eas-cli build --platform ios --profile production
```

Then submit after the build finishes:

```powershell
npx eas-cli submit --platform ios --profile production
```

## App Store Connect

- Create app record for `com.winstonwu.hold10`.
- Add app metadata from `docs/app-store-prep.md`.
- Add Privacy Policy URL.
- Complete App Privacy labels.
- Complete age rating questionnaire.
- Upload screenshots.
- Add review notes.
- Select the production build.
- Submit for review.

## Do Not Forget

- Development builds are for local testing only.
- App Store/TestFlight users should never need `exp.direct`, `localhost`, LAN IP, or a development server.
- Re-run this checklist after any code change that affects native dependencies, data handling, support links, or Calm Tap.
