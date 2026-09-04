# RideGuard

Before cloning please check the npm and Node version:

```bash
node -v
npm -v
```

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd RideGuard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install Expo dependencies

If you add or reinstall Expo-related packages, use:

```bash
npx expo install
```

## Firebase Setup

Copy the .env code from discord

## Backend Setup

RideGuard requires the RideGuard backend API to be running.
Kaso binago na 'to so hindi na need

The mobile application currently uses:

```text
http://localhost:5565/v1
```

The API URL is configured in:

```text
src/services/api.ts
```

```ts
const API_BASE_URL = "http://localhost:5565/v1";
```

P

### Using an Android Emulator

If the backend is running on your computer and the application is running on an Android emulator, `localhost` may need to be changed to:

```text
http://10.0.2.2:5565/v1
```

### Using a Physical Device

When using a physical phone, use your computer's local network IP address instead:

```text
http://YOUR_LOCAL_IP:5565/v1
```

For example:

```text
http://192.168.1.100:5565/v1
```

Make sure the phone and computer are connected to the same network.

## Running the Application

Start the Expo development server:

```bash
npx expo start
```

You can then choose how to run the application.

### Android Emulator

Start your Android emulator through Android Studio, then run:

```bash
npx expo start
```

Press:

```text
a
```

in the Expo terminal.

### Physical Android Device

Install Expo Go or the project's development build on your device, then run:

```bash
npx expo start
```

Scan the QR code displayed by Expo.
