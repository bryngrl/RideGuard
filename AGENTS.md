# Expo HAS CHANGED

copy existing pattern

## Reference designs

- Treat pasted images as references for UI layout and structure.
- Keep the project's existing colors, theme backgrounds, typography, shared components, and interaction patterns unless the user explicitly requests a design-system change.
- Use theme tokens and the existing theme hooks so screens follow light/dark changes and existing theme transitions. Do not copy hardcoded colors from reference images.

For an Android APK when EAS Build is unavailable or its quota is exhausted, follow [the local Android build guide](docs/LOCAL_ANDROID_BUILD.md). Use the existing native Gradle project and verify the generated APK. Do not delete or regenerate `android/` as a routine build step.

## Domain vocabulary

Terms are defined once, for every repository, in the ecosystem glossary: `GLOSSARY.md` at the root of [the `RideGuard-Documentations` repository](https://github.com/XpnsiveSharks/RideGuard-Documentations), or `../docs/GLOSSARY.md` when the repositories sit side by side. Read it before naming a type, field, route or event. If the code disagrees with the glossary, fix the code or fix the glossary — do not introduce a second word for the same thing. In particular, an alert is never an incident, and a ride is not part of this domain.
