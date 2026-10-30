# Build an Android APK without EAS Build

Use this when EAS Build is unavailable or the Expo cloud build quota is exhausted. Gradle builds on your computer. It uses no EAS build credits and needs no Expo login. The app still uses its installed Expo libraries.

## 1. Prepare the computer

Install the project dependencies, JDK 17, and Android Studio with its Android SDK. The Gradle wrapper is included; do not install Gradle separately. Internet access is needed to download any missing build dependencies.

From the mobile repository root:

```powershell
npm.cmd ci
```

If dependencies are already installed, skip this command.

Set `ANDROID_HOME` to your SDK location if it is not already configured. The usual Windows location is:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
```

Use Android Studio's SDK Manager to install missing SDK components and accept their licenses. This project's build currently requests Android SDK/build tools 36 and NDK 27.1.12297006.

## 2. Check settings and signing

1. Populate your local `.env` with the team's mobile configuration. Confirm `EXPO_PUBLIC_API_BASE_URL` points to a backend your phone can reach. `localhost` on a phone means the phone itself.
2. Local Gradle builds do not load EAS environment variables or the `preview` settings from `eas.json`. Phone capture is enabled by default in Android builds; `EXPO_PUBLIC_PHONE_CAPTURE_ENABLED=false` explicitly hides it. Expo Go cannot provide the custom native capture service. Never commit credentials or environment files.
3. Confirm the native Firebase configuration (`android/app/google-services.json`) is present and correct.
4. To update an existing installation, use the same signing key. The existing Gradle configuration reads `RIDEGUARD_RELEASE_STORE_FILE`, `RIDEGUARD_RELEASE_STORE_PASSWORD`, `RIDEGUARD_RELEASE_KEY_ALIAS`, and `RIDEGUARD_RELEASE_KEY_PASSWORD` from Gradle properties. Keep their values in your private user Gradle properties file, not the repository.

Without release signing properties, the current build falls back to the debug key. This is for local testing; it may not update an EAS-signed installation. Google sign-in also requires the signing certificate's SHA fingerprint to be registered for the Android OAuth client. Do not uninstall an existing app without considering its local data.

## 3. Build the APK

Open PowerShell in the mobile repository. In this workspace:

```powershell
cd C:\Sharks\RideGuard\rideguard-mobile
$env:NODE_ENV = "production"
cd android
.\gradlew.bat app:assembleRelease -PreactNativeArchitectures=arm64-v8a
```

`arm64-v8a` targets modern 64-bit ARM Android phones. For an emulator or another architecture, choose its architecture or omit `-PreactNativeArchitectures=arm64-v8a` to build the architectures in `android/gradle.properties`.

Wait for **BUILD SUCCESSFUL**. Allow 10–30 minutes for a first build; cached builds can be faster. This command creates an APK with its JavaScript bundled, so it does not need a Metro development server.

The `android/` project is maintained in Git. Do not delete it or run `expo prebuild --clean` as a routine build step; that can overwrite native changes.

## 4. Install and test

The APK is written to:

```text
android/app/build/outputs/apk/release/app-release.apk
```

Copy it to your phone and install it. Or, with USB debugging enabled and the phone authorized, run from `android/`:

```powershell
adb install -r .\app\build\outputs\apk\release\app-release.apk
```

Test login, backend access, and the changed screens. A successful build does not prove those work. Auto archive also requires the updated backend, verified backfill/indexes, and enabled backend processing.

## 5. Troubleshoot

| Error | Action |
| --- | --- |
| Java or `JAVA_HOME` missing | Install JDK 17 and point `JAVA_HOME` to its installation folder. |
| SDK location not found | Set `ANDROID_HOME`, or set `sdk.dir` in the ignored `android/local.properties` file. |
| Dependency download fails | Check internet/proxy settings. AI agents must request the required network permission if sandbox access blocks Gradle. |
| Installation reports incompatible signatures | Use the existing installation's signing key. Do not automatically uninstall the app. |
| Google sign-in fails | Check the APK signing certificate and Android OAuth SHA fingerprint. |
| App connects to the wrong server | Correct the local environment and rebuild. EAS `preview` values are not loaded automatically. |

Direct Gradle builds do not automatically select the EAS `preview` OTA channel or apply EAS version increments. Check native update/channel and version configuration before distributing a release. Follow [the team workflow](OTA_AND_TEAM_WORKFLOW.md) for shared releases.

## Notes for AI agents

1. Use this Gradle workflow when asked for a local APK. EAS cloud builds are not required.
2. Inspect current native settings and local tool availability first. Do not print secret values or change signing credentials without authorization.
3. Keep waiting for Gradle to finish and report the actual result. After success, verify the APK exists and report its path and size.
4. Keep generated APKs, local environment files, and signing keys out of commits. Build success and phone verification are separate checks.

Verified in this workspace on 2026-10-21: the ARM64 release build succeeded in about five minutes and produced a 56.5 MB APK. Phone testing was still pending.

Reference: [Expo's local release build guide](https://docs.expo.dev/guides/local-app-production/).
