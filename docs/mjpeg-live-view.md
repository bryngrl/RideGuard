# MJPEG camera view

`LiveCameraView` opens one connection to
`${EXPO_PUBLIC_INFERENCE_BASE_URL}/stream/{deviceId}/live.mjpeg` while the
camera is online, the screen is focused, and the app is active. The default
base URL is `http://3.26.225.222:8000/v1`.

The endpoint returns `multipart/x-mixed-replace; boundary=frame`, with JPEG
images in its parts. The native app displays these through an HTML `img` in
`react-native-webview`. The web build uses the same document in an iframe.
This replaces the repeated requests to `latest.jpg`.

The viewer checks image dimensions to detect the first decoded image without
waiting for a page load event on the open stream. It shows a small connecting
message instead of hiding the image behind a loading screen. A failure or
15-second first-frame timeout closes the viewer and retries after 3 seconds.
Leaving the screen or backgrounding the app unmounts the viewer.

The first-frame indicator does not measure ongoing frame freshness. A server
that stops sending frames but leaves the connection open can leave the last
image visible until the connection fails or camera status becomes offline.

## Checks

Run `node --test scripts/test-mjpeg-document.cjs` for the document's status,
timeout, error, URL escaping, and cleanup checks.

On an Android device with the existing WebView-enabled development build:

1. Open the Camera tab with `CAM-793-MAU` linked and online.
2. Confirm that frames move continuously and the connecting message clears.
3. Switch tabs and background/restore the app. Playback should reconnect.
4. Disconnect and restore networking. A reported image/network failure should
   show the retry message and reconnect after connectivity returns.

Android HTTP access is already enabled in `app.json` and the native manifest.
An installed build must contain `react-native-webview` and that HTTP setting.
An HTTPS web page cannot necessarily embed this HTTP endpoint; use HTTPS for
the endpoint when hosting the web app over HTTPS. iOS HTTP policy and actual
device playback need separate verification.

The endpoint was checked for HTTP 200, the multipart content type, and multiple
JPEG parts. Android playback has not been verified without a connected device.
