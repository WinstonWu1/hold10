# Hold10 App Store Prep

Status: draft for App Store Connect. Keep Calm Tap UI copy flexible until final design approval.

## App Information

- App name: Hold10
- Bundle ID: `com.winstonwu.hold10`
- App Store Connect app ID: `6775513981`
- Category: Health & Fitness
- Secondary category: Lifestyle
- Content positioning: gambling urge pause and recovery support
- Privacy Policy URL: `https://hold10-chi.vercel.app/privacy.html`
- Terms URL: `https://hold10-chi.vercel.app/terms.html`
- Support URL: `https://hold10-chi.vercel.app`
- Marketing URL: `https://hold10-chi.vercel.app`
- Public support email: TODO

## Metadata Draft

Subtitle options, 30 characters or fewer:

- Pause before the next bet
- A calm pause before betting
- Hold through gambling urges

Recommended subtitle:

```text
Pause before the next bet
```

Promotional text:

```text
Hold10 helps you create a short, grounded pause before a gambling urge becomes the next bet.
```

Description:

```text
Hold10 is a self-support pause tool for gambling urges.

When the next bet, deposit, chase, or late-night impulse shows up, Hold10 gives you a structured pause instead of another automatic click. Start a Hold10 session, name the trigger, breathe through the urge, and record the money you protected by waiting.

Core features:

- Calm Tap breathing timer with gentle haptic feedback
- Recovery Garden to make completed urges visible
- Recovery Tally for protected money, check-ins, and progress
- Return Mode for recording slips without shame
- Protection Wall for practical self-exclusion and blocking steps
- Help Now screen with official support resources
- Local data export and reset

Hold10 is a self-support product, not a medical, mental health, legal, financial, emergency, crisis, gambling treatment, or monitoring service. It does not diagnose, treat, prevent, mitigate, or cure any condition, and it cannot guarantee that gambling, self-harm, financial loss, debt, relapse, legal issues, or emergencies will be prevented. If you are in immediate danger, may harm yourself or someone else, cannot stay safe, or need urgent help, contact local emergency services now. If you need gambling, addiction, mental health, legal, debt, or financial support, contact a qualified professional or official support service.
```

Keywords, 100 characters or fewer:

```text
gambling,urge,impulse,recovery,self-exclusion,calm,breathing,habit,break,craving
```

What's New for first release:

```text
Initial Hold10 release.
```

## Safety Positioning

Use this positioning consistently across product copy, screenshots, review notes, website copy, and support text:

- Say: self-support pause tool, personal reflection, practical support steps, recovery tracking, breathing timer.
- Do not say: treatment, therapy, clinical care, medical care, cure, prevention, diagnosis, crisis response, emergency monitoring, guaranteed recovery, guaranteed prevention of gambling or financial loss.
- Include urgent-help wording wherever the app sends people to support resources.
- Keep the Help Now screen factual: it links out to external support resources and is not a live support or monitoring service.
- Be explicit for review that Hold10 does not offer betting, real-money gaming, lotteries, gambling account access, odds, tips, card counting, or gambling facilitation.

## App Privacy Labels Draft

For the current MVP, recommended App Store Connect answer:

```text
No, we do not collect data from this app.
```

Rationale:

- No account system.
- No backend profile storage.
- No cloud sync.
- No third-party analytics SDK in the app code.
- Progress, check-ins, urge/session counts, protection choices, and country setting are stored locally on the device.
- Exported data is user-initiated and stays under the user's control.
- Local-only recovery, urge, slip, and money-protected entries may be sensitive, but the current MVP does not transmit them off device.

Important update triggers:

- If Supabase, accounts, sync, analytics, crash reporting, payments, community presence, email collection, or server-side support messaging are added, this label must be reviewed and likely changed.
- External support links may lead to third-party services with their own privacy practices, but the current app does not collect that data.
- If any support, coaching, crisis, monitoring, notification-to-contact, bank-blocking, gambling-blocking, or server-side risk feature is added, update the Privacy Policy, Terms, review notes, and privacy labels before release.

Apple references:

- App privacy responses must represent the app and integrated third-party partners accurately.
- Apple requires a privacy policy URL for iOS apps.
- Apple treats on-device-only processing differently from data collected off device, but any transmitted or retained data must be reviewed carefully.

## Screenshots

Apple allows 1 to 10 screenshots per device size. If the UI is the same across device sizes and localizations, the highest resolution screenshots can scale down to smaller sizes.

Primary iPhone screenshot set:

1. Home: money protected, clean-time badge, primary Hold10 action.
2. Calm Tap: inhale/exhale breathing circle with haptic guidance.
3. Recovery Garden: progress stage and garden metrics.
4. Protection Wall: self-exclusion and blocking steps.
5. Help Now: official support resources.
6. Settings & Data: local data, export, reset, privacy posture.

Required capture targets to prepare:

- 6.9-inch iPhone portrait: accepted sizes include `1320 x 2868`, `1290 x 2796`, or `1260 x 2736`.
- 6.5-inch iPhone portrait if needed: accepted sizes include `1284 x 2778` or `1242 x 2688`.

Screenshot style rules:

- Show real app screens, not abstract marketing slides.
- Avoid fake live users or misleading community claims.
- Avoid real personal data.
- Keep captions short and factual if captions are added.
- Re-shoot Calm Tap after the interaction design is finalized.

## Review Notes Draft

```text
Hold10 is a self-support pause tool for gambling urges. It stores progress locally on the device and does not require an account. The Help Now screen opens official gambling support and self-exclusion resources.

Hold10 does not offer betting, real-money gaming, lotteries, odds, tips, card counting, gambling account access, or gambling facilitation.

Hold10 is not a medical, mental health, legal, financial, emergency, crisis, gambling treatment, or monitoring service. It does not diagnose, treat, prevent, mitigate, or cure any condition. It does not monitor the user, contact emergency services, notify another person, block gambling transactions, or guarantee prevention of gambling, self-harm, financial loss, debt, relapse, legal issues, or emergencies. These limits are disclosed in the app footer, Help Now screen, Privacy Policy, and Terms of Use.

No login is required for review.
```

If Apple asks about haptics:

```text
The Calm Tap exercise uses haptic feedback to mark breathing transitions during a self-regulation pause. Haptics are not required to use the app.
```

## Production Build Notes

Current tested iPhone build is an EAS development build. Before App Store submission:

- Run a production EAS build with the `production` profile.
- Install and test via TestFlight.
- Confirm the production app does not show the development launcher or require a development server.
- Re-test Calm Tap, Help Now links, data export/reset, Recovery Garden, Return Mode, and Protection Wall.

## Final TODOs

- Choose public support email.
- Strongly consider qualified legal review of the Privacy Policy, Terms of Use, in-app disclaimers, App Store metadata, support links, and launch-country wording before public release. If skipping legal review for MVP, complete the conservative self-review in `docs/legal-safety-review.md` before submission.
- Confirm final product positioning: gambling-specific first release vs broader impulse-control wording.
- Confirm product copy avoids treatment, cure, prevention, diagnosis, monitoring, crisis response, and guarantee claims unless reviewed by counsel and supported by the appropriate evidence/regulatory posture.
- Finalize Calm Tap interaction and re-shoot screenshots.
- Create App Store Connect app record.
- Enter metadata, privacy policy URL, privacy labels, age rating, and screenshots.
- Run production EAS build and submit to TestFlight.
