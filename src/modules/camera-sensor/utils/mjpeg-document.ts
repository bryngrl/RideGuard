// GET /v1/stream/{deviceId}/live.mjpeg returns an open multipart response,
// with Content-Type: image/jpeg on each part. Let the browser decode it in an
// img element; no fetch buffering, base64 bridge, or per-frame HTTP requests.
export function createMjpegDocument(streamUrl: string): string {
  // Escape script delimiters as well as JavaScript quotes in the URL.
  const safeUrl = JSON.stringify(streamUrl).replace(/</g, "\\u003c");

  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #000; }
    img { display: block; width: 100%; height: 100%; object-fit: cover; }
  </style>
</head>
<body>
  <img id="stream" alt="">
  <script>
    (function () {
      var img = document.getElementById('stream');
      var playing = false;
      var failed = false;
      var started = Date.now();
      var timer;

      function report(status) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage('mjpeg:' + status);
        } else {
          window.parent.postMessage('mjpeg:' + status, '*');
        }
      }

      function fail() {
        if (failed) return;
        failed = true;
        clearInterval(timer);
        report('error');
      }

      function checkImage() {
        if (failed) return;
        // A streaming img may never fire load or become complete. Dimensions
        // detect the first decoded image while the response stays open.
        if (!playing && img.naturalWidth > 0 && img.naturalHeight > 0) {
          playing = true;
          clearInterval(timer);
          report('playing');
        } else if (!playing && Date.now() - started > 15000) {
          fail();
        }
      }

      img.onerror = fail;
      img.onload = checkImage;
      timer = setInterval(checkImage, 200);
      img.src = ${safeUrl};

      window.addEventListener('pagehide', function () {
        clearInterval(timer);
        img.onerror = null;
        img.onload = null;
        img.removeAttribute('src');
      });
    })();
  </script>
</body>
</html>`;
}
