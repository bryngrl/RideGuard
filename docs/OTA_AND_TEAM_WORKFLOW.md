# RideGuard OTA and Team Workflow

This guide explains how the team should change, test, and release RideGuard.

## Two separate services

The team needs access to both services:

| Service | Used for |
| --- | --- |
| GitHub | Source code, branches, pull requests, and code reviews |
| Expo organization `rideguard` | EAS builds, OTA updates, credentials, and releases |

GitHub access does not give Expo access. Expo access does not give GitHub access.

Each developer must use their own GitHub and Expo accounts. Do not share passwords.

## One-time setup for a developer

1. Ask a GitHub repository admin to add you to `bryngrl/RideGuard`. The admin can use **Repository settings > Collaborators > Add people**.
2. Ask an Expo Owner or Admin to invite you to the `rideguard` organization.
3. Use the **Developer** role in Expo for normal development work.
4. Clone the repository and install its packages:

```powershell
git clone git@github.com:bryngrl/RideGuard.git
cd RideGuard
npm install
```

Copy the environment template, then ask the team lead for the correct values:

```powershell
Copy-Item .env.example .env
```

Never commit `.env`. Never put private server secrets in an `EXPO_PUBLIC_` variable.

5. Sign in to Expo with your own account:

```powershell
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest whoami
npx.cmd eas-cli@latest project:info
```

`project:info` must show:

```text
@rideguard/RideGuard
```

## Git workflow for every task

The shared branch for this project is `develop`. Do not code directly on it.

### 1. Get the latest code

```powershell
git switch develop
git pull --ff-only origin develop
```

### 2. Create a branch

Use a short name that describes the task:

```powershell
git switch -c feature/add-emergency-contact
```

Other examples:

```text
fix/login-crash
fix/map-location
docs/update-ota-guide
```

### 3. Make and test the change

```powershell
npm run start
npm run lint
```

Test the changed screens and the related user flow. Do not test only the first screen.

### 4. Commit and push

Check which files changed:

```powershell
git status
git diff
```

Add only the files for your task:

```powershell
git add src/path/to/changed-file.tsx
git commit -m "fix: prevent login crash"
git push -u origin fix/login-crash
```

### 5. Open a pull request

Open a GitHub pull request from your branch into `develop`.

The pull request must:

- Explain what changed.
- Explain how it was tested.
- Pass lint and other checks.
- Be reviewed before merge.

Do not publish an OTA update or create a release build from an unmerged feature branch.

## What OTA means

An OTA update sends new JavaScript, TypeScript, and bundled assets to an already installed app. The user does not need to scan another QR code or reinstall the app.

The installed app receives an OTA update only when all of these match:

- Platform: Android or iOS.
- Channel: `development`, `preview`, or `production`.
- Runtime version: the native app version that can run the update.

The app normally downloads an update when it starts. The update is applied on the next restart. For testing, fully close and reopen the app up to two times.

## Channels used by this project

| Build profile | OTA channel | Who should use it |
| --- | --- | --- |
| `development` | `development` | Developers |
| `preview` | `preview` | Internal testers using the QR-installed app |
| `production` | `production` | Store users |

Never send an untested update directly to `production`.

## OTA update or new build?

Use this quick rule:

- If only JavaScript, TypeScript, or a bundled image changed, use OTA.
- If native code or native configuration changed, create a new build.

### OTA is normally enough for

- Text changes.
- Colors, spacing, and layout.
- Screen and component logic.
- API calls and validation.
- Navigation written in JavaScript or TypeScript.
- Bug fixes that use libraries already included in the installed app.
- Images used inside the app, but not the app icon or splash screen.

### Create a new build for

- Adding, removing, or upgrading a package that contains native code.
- Changing Expo SDK or React Native versions.
- Changing files inside `android/` or `ios/`.
- Changing permissions, config plugins, URL schemes, or deep-link configuration.
- Changing the app icon, splash screen, package name, or bundle identifier.
- Changing Google services or other native service configuration.
- Any change that requires a different runtime version.

If you are unsure, create a new preview build and test it. An OTA update cannot add native code that is missing from the installed app.

## Safe OTA release process

Only the release lead should publish to `production`.

### 1. Start from the merged code

```powershell
git switch develop
git pull --ff-only origin develop
git status
```

`git status` must say the working tree is clean. This prevents local or unfinished files from being published.

Record the commit being released:

```powershell
git rev-parse --short HEAD
```

### 2. Publish to preview

```powershell
npx.cmd eas-cli@latest update --channel preview --environment preview --message "fix: prevent login crash"
```

This update goes to installed builds that use the `preview` channel and the same runtime version.

### 3. Test the preview update

On the QR-installed preview app:

1. Connect the device to the internet.
2. Fully close the app.
3. Open it and wait a few seconds.
4. Fully close and open it again.
5. Test the changed flow and nearby flows.

If the update does not appear, check that the installed app is a `preview` build and has the same runtime version.

### 4. Publish the same commit to production

Do not edit files after preview testing. Confirm the working tree is still clean:

```powershell
git status
npx.cmd eas-cli@latest update --channel production --environment production --message "fix: prevent login crash"
```

This sends the update to compatible production builds.

## Creating a new build

Use this process when the change includes native code or native configuration.

This repository contains an `android/` folder. Some `app.json` changes must also be applied to the native Android project. Ask the release lead if you are not sure whether the native files are in sync.

### 1. Update the app and runtime version

This project currently uses app version `1.0.0`.

Before the next native release, update these values in `app.json` to the same new version, for example `1.0.1`:

- `expo.version`
- `expo.android.runtimeVersion`

iOS uses the `appVersion` runtime policy, so its runtime version follows `expo.version`.

Commit the version change with the native change.

### 2. Create and test a preview build

For Android:

```powershell
npx.cmd eas-cli@latest build --profile preview --platform android
```

Install the result from its QR code and test it. This build listens to the `preview` OTA channel.

For iOS, replace `android` with `ios`.

### 3. Create the production build

After the preview build passes testing:

```powershell
npx.cmd eas-cli@latest build --profile production --platform android
```

To build both platforms:

```powershell
npx.cmd eas-cli@latest build --profile production --platform all
```

A production build still needs to be submitted to the app store:

```powershell
npx.cmd eas-cli@latest submit --profile production --platform android
```

Store users must install this new version before they can receive OTA updates for its new runtime version.

## If an OTA update is broken

Tell the team immediately and stop publishing more changes.

Run the rollback command:

```powershell
npx.cmd eas-cli@latest update:rollback
```

The command will ask which update to roll back. Test the rollback on the affected channel.

Do not try to repair production by quickly publishing several untested updates.

## Release checklist

Before any OTA update:

- The change is merged into `develop`.
- `develop` is up to date.
- The working tree is clean.
- Lint passes.
- The change does not require native code.
- The preview OTA was tested on a real device.
- The channel name is correct.
- The update message explains the change.

Before any new build:

- The new version and runtime version are correct.
- A preview build was installed and tested.
- Android and iOS were both considered.
- Production credentials and environment variables are correct.
- The release was approved by the team.

## Common mistakes

- Publishing from a dirty working tree.
- Publishing a feature branch before its pull request is merged.
- Sending a preview change to the production channel.
- Expecting an OTA update to add a native package.
- Forgetting to increase the app/runtime version for a native release.
- Testing only in Expo Go instead of the installed preview build.
- Sharing one Expo or GitHub login between developers.

## Official references

- [Expo SDK 57 Updates documentation](https://docs.expo.dev/versions/v57.0.0/sdk/updates/)
- [Get started with EAS Update](https://docs.expo.dev/eas-update/getting-started/)
- [Deploy EAS updates](https://docs.expo.dev/eas-update/deployment/)
- [Roll back an update](https://docs.expo.dev/eas-update/rollbacks/)
- [Expo organization roles](https://docs.expo.dev/accounts/account-types/#manage-access)
