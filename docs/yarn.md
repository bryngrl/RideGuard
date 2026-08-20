# Yarn Guide

RideGuard uses Yarn Classic (`yarn.lock` lockfile v1) for dependency management.
Use Yarn for installs, scripts, and dependency changes in this project.

## Requirements

- Node.js 22.13.x or newer compatible Node 22 release for Expo SDK 57.
- Yarn Classic 1.x. This repo was generated with Yarn 1.22.22.
- Corepack enabled, if Yarn is not already available on your machine.

```bash
corepack enable # run in your powershell as Administrator
yarn --version
```

On Windows PowerShell, `yarn` may be blocked by the local execution policy because
PowerShell tries to run `yarn.ps1`. Use one of these forms instead:

```powershell
yarn.cmd --version
cmd /c yarn --version
```

## First-Time Setup

Install dependencies from the lockfile:

```bash
yarn install
```

For CI or a clean verification install, make sure the lockfile is not changed:

```bash
yarn install --frozen-lockfile
```

## Daily Commands

Run the Expo development server:

```bash
yarn start
```

Run platform targets:

```bash
yarn android
yarn ios
yarn web
```

Run linting:

```bash
yarn lint
```

Run an Expo CLI command directly:

```bash
yarn expo start
yarn expo lint
```

## Adding Dependencies

Use Expo's installer for Expo SDK packages and React Native packages that need
version alignment with the active Expo SDK:

```bash
yarn expo install expo-camera
yarn expo install react-native-safe-area-context
```

Use Yarn directly for ordinary JavaScript packages:

```bash
yarn add package-name
yarn add -D package-name
```

Remove packages with:

```bash
yarn remove package-name
```

After changing dependencies, commit both `package.json` and `yarn.lock`.

## Yarn-Only Rules

- Keep `yarn.lock`.
- Do not add `package-lock.json` or `pnpm-lock.yaml`.
- Do not run `npm install`, `npm update`, or `pnpm install` in this repo.
- Prefer `yarn <script>` over `npm run <script>`.
- Prefer `yarn expo <command>` over `npx expo <command>`.

If another package manager creates a lockfile by accident, delete that lockfile
and run:

```bash
yarn install
```

## Troubleshooting

Clear Expo's local cache if the bundler behaves strangely after dependency
changes:

```bash
yarn expo start --clear
```

Rebuild dependencies from scratch:

```bash
rm -rf node_modules
yarn install
```

Windows PowerShell equivalent:

```powershell
Remove-Item -Recurse -Force node_modules
yarn.cmd install
```
