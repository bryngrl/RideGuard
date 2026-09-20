# RideGuard - Android setup

This app uses Expo SDK 57 and React Native. Requirements for local development: Node.js 22.13 or newer, Java 17, Android SDK 36, and an Android phone with a USB data cable. Gradle may download additional build tools and NDK components on the first build.

For local development, copy `.env.example` to `.env` and obtain the Firebase configuration from the team. Firebase and Google sign-in cloud settings must remain valid. Downloading a standalone APK does not require a local `.env` file.

## Standalone QA app

Download `RideGuard-qa-arm64.apk` from a QA prerelease on the [GitHub Releases page](https://github.com/bryngrl/RideGuard/releases). Each prerelease identifies the source commit on `qa`; select the desired QA build and expand Assets. Access to a private repository requires signing in with an authorized GitHub account.

Transfer the APK to an ARM64 Android phone, open it, and allow installation from that source when prompted. You can also install it over USB with `adb install -r RideGuard-qa-arm64.apk`.

The standalone app starts without a laptop, QR code, or Expo server. Google sign-in and the hosted API still require internet access. These QA builds use the repository's debug signing key and package `com.rideguard.app`, so they replace a development build signed with that same key. They are for testing, not Play Store publishing. Phone startup and sign-in must be tested separately from build success.

APK downloads are attached to releases, not stored in Git. Pulling `qa` downloads source code; it does not install the APK or automatically update an installed app. New code requires a new standalone build and installation.

To build a standalone QA APK locally from the repository root after `npm ci` and `.env` setup:

```cmd
cd android
gradlew.bat :app:assembleRelease -PreactNativeArchitectures=arm64-v8a
```

The output is `android/app/build/outputs/apk/release/app-release.apk`. The ARM64 build does not support 32-bit-only phones or x86 emulators.

Google sign-in requires the RideGuard development build; Expo Go cannot run this native sign-in library.

## First run (Windows Command Prompt)

Enable Developer options on your phone (usually tap Build number seven times), enable USB debugging, connect by USB, and accept the debugging authorization prompt.

```cmd
cd /d C:\path\to\RideGuard
npm ci
adb devices
npx expo run:android --device
```

Select your phone if prompted. The first build can take several minutes. Keep the terminal open. The phone must appear with status `device`; if it says `unauthorized`, unlock it and accept the prompt. You can skip `npm ci` if dependencies are already installed.

## Later runs over Wi-Fi

Connect the PC and phone to the same Wi-Fi, then run:

```cmd
cd /d C:\path\to\RideGuard
npx expo start --dev-client
```

Open the installed RideGuard app and select the development server, or scan the QR code using the development client's scanner. Allow Node.js through Windows Firewall on your private network if prompted.

## Later runs over USB

```cmd
cd /d C:\path\to\RideGuard
adb reverse tcp:8081 tcp:8081
npx expo start --dev-client --localhost
```

Open RideGuard and connect to `http://localhost:8081` if needed. Press Ctrl+C in the terminal to stop. Rebuild with `npx expo run:android --device` after native dependency or Android code changes.

## Backend and sign-in

The app defaults to the hosted Azure API in src/services/api.ts. A local backend is not required. EXPO_PUBLIC_API_BASE_URL can override it.

If Google sign-in reports DEVELOPER_ERROR, ask the Firebase project owner to verify the Android package com.rideguard.app, web OAuth client ID, and debug signing SHA-1. Display the local fingerprint with:

```cmd
keytool -list -v -keystore android\app\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Do not commit .env. EXPO_PUBLIC_ values are included in the app bundle and must not contain server secrets.

## Checks

```cmd
npx expo install --check
npx tsc --noEmit
npx expo export --platform android
```

Official documentation: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) and [development builds](https://docs.expo.dev/develop/development-builds/introduction/).
