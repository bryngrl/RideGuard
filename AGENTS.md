# Expo HAS CHANGED

copy existing pattern

## Reference designs

- Treat pasted images as references for UI layout and structure.
- Keep the project's existing colors, theme backgrounds, typography, shared components, and interaction patterns unless the user explicitly requests a design-system change.
- Use theme tokens and the existing theme hooks so screens follow light/dark changes and existing theme transitions. Do not copy hardcoded colors from reference images.

For an Android APK when EAS Build is unavailable or its quota is exhausted, follow [the local Android build guide](docs/LOCAL_ANDROID_BUILD.md). Use the existing native Gradle project and verify the generated APK. Do not delete or regenerate `android/` as a routine build step.
