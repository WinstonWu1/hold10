# Hold10 Launch Checklist

This checklist tracks the minimum launch work for the web app and native app.

## Ready Now

- Web production deployment is live on Vercel.
- GitHub repository is connected.
- Help Now and support resources are included in the MVP.
- Local data export and reset are included.
- Privacy Policy is available at `/privacy.html`.
- Terms of Use are available at `/terms.html`.
- Native iOS project is linked to EAS as `@seafoodshop/hold10`.
- iOS production build `cd15983a-b0b3-40d1-973d-6eb928353c2c` was uploaded to App Store Connect for TestFlight processing.
- App Store metadata, privacy label, screenshot, and review note draft is in `docs/app-store-prep.md`.
- App Store Connect copy-and-paste entry pack is in `docs/app-store-connect-entry-pack.md`.
- TestFlight and production build checklist is in `docs/testflight-production-checklist.md`.
- Legal and safety disclaimer checklist is in `docs/legal-safety-review.md`.

## Before Public App Store Submission

- Confirm Apple Developer Program membership is active.
- Run an iOS development build with EAS.
- Install and test the development build on iPhone.
- Finalize Calm Tap interaction design.
- Choose a public support email for App Store Connect.
- Strongly consider qualified legal review of the Privacy Policy, Terms of Use, in-app disclaimers, App Store metadata, support links, and launch-country wording. If skipping legal review for MVP, complete the conservative self-review in `docs/legal-safety-review.md` before submission.
- Add the Privacy Policy URL in App Store Connect.
- Complete App Privacy labels based on the shipped build.
- Prepare App Store screenshots for required iPhone sizes.
- Write App Store subtitle, description, keywords, and support URL.
- Decide whether the first public release is gambling-focused or broader impulse-control positioning.
- Confirm App Store metadata and screenshots make clear Hold10 does not offer betting, real-money gaming, lotteries, odds, tips, card counting, gambling account access, or gambling facilitation.
- Confirm product copy avoids treatment, cure, prevention, diagnosis, monitoring, crisis response, and guarantee claims unless reviewed by counsel and properly supported.
- Review all support and crisis wording for the launch countries.
- Run a production EAS build and confirm it does not require a development server.
- Submit production build to TestFlight before App Store review.

## Final Verification

- Run `npm run build` in the web project.
- Run `npx tsc --noEmit` in `native`.
- Run an EAS iOS development build.
- Test install on iPhone.
- Test Help Now links and phone links.
- Test data export and reset.
- Check mobile layout on small iPhone viewport.
- Confirm no fake live users or misleading claims are shown.
