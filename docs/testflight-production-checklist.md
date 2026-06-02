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

Current submitted production build to test:

- EAS build ID: `655baefd-380e-4d4a-bd90-4fac29bc3aa5`
- Version/build: `1.0.0 (4)`
- EAS build logs: `https://expo.dev/accounts/seafoodshop/projects/hold10/builds/655baefd-380e-4d4a-bd90-4fac29bc3aa5`
- App Store Connect app ID: `6775513981`
- TestFlight URL: `https://appstoreconnect.apple.com/apps/6775513981/testflight/ios`
- Submission ID: `0b7d08aa-37bd-4b98-8c84-b3da3114375b`
- Submission details: `https://expo.dev/accounts/seafoodshop/projects/hold10/submissions/0b7d08aa-37bd-4b98-8c84-b3da3114375b`

Previous TestFlight baseline:

- Version/build: `1.0.0 (3)`
- Git tag: `testflight-1.0.0-build3`
- EAS build ID: `cd15983a-b0b3-40d1-973d-6eb928353c2c`

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
