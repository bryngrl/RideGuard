# Run RideGuard on your phone

RideGuard needs its own **development build**. Expo Go cannot run the project's native Google Sign-In.

## Android: first-time setup

1. Install **Android Studio** and its **Android SDK tools** on your computer.
2. On your phone, turn on **Developer options > USB debugging**.
3. Connect your phone by USB. Accept the debugging prompt on the phone.
4. Open PowerShell in the project folder and run:

   ```powershell
   npx.cmd expo run:android --device
   ```

5. Select your phone. Wait for RideGuard to build, install, and open.

The first build can take several minutes.

## Android: every time after setup

1. Connect your phone and computer to the **same Wi-Fi**.
2. In the project folder, run:

   ```powershell
   npx.cmd expo start --dev-client
   ```

3. Open the installed **RideGuard** app and scan the terminal QR code with its scanner.
4. Keep the terminal running. Code changes appear on your phone automatically.

**Can't connect?** Stop the server with `Ctrl+C`, then run:

```powershell
npm.cmd install --save-dev "@expo/ngrok@^4.1.0"
npx.cmd expo start --dev-client --tunnel
```

The install command is only needed once per project setup. After that, run just the tunnel command and scan the new QR code.

## Alternative: build without Android Studio

Your Expo account needs access to the team's `rideguard` project.

```powershell
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest build --platform android --profile development
```

Open the completed build link on your phone and install the APK. Then follow **every time after setup** above.

## iPhone

From Windows, use an **EAS iOS development build**. It needs a paid Apple Developer account and the project's iOS configuration completed first.

## Project setup

- If dependencies are missing, run `npm.cmd install`.
- Get the correct `.env` values from the team.
- For Android builds, make sure `google-services.json` is present.
- The app defaults to the hosted backend. A local backend is only needed if you configure one in `.env`.
- Rebuild the development app when native dependencies, native settings, or the Expo SDK change.

References: [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/), [device connections](https://docs.expo.dev/get-started/start-developing/), [Google Sign-In](https://docs.expo.dev/guides/google-authentication/).
