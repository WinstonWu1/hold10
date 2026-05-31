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

## Before Public App Store Submission

- Confirm Apple Developer Program membership is active.
- Run an iOS development build with EAS.
- Install and test the development build on iPhone.
- Choose a public support email for App Store Connect.
- Add the Privacy Policy URL in App Store Connect.
- Complete App Privacy labels based on the shipped build.
- Prepare App Store screenshots for required iPhone sizes.
- Write App Store subtitle, description, keywords, and support URL.
- Decide whether the first public release is gambling-focused or broader impulse-control positioning.
- Review all support and crisis wording for the launch countries.

## Final Verification

- Run `npm run build` in the web project.
- Run `npx tsc --noEmit` in `native`.
- Run an EAS iOS development build.
- Test install on iPhone.
- Test Help Now links and phone links.
- Test data export and reset.
- Check mobile layout on small iPhone viewport.
- Confirm no fake live users or misleading claims are shown.
