package expo.modules.phonecapture

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.Matrix
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.os.SystemClock
import android.util.Log
import android.util.Size
import androidx.camera.core.CameraSelector
import androidx.camera.core.CameraState
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.resolutionselector.ResolutionSelector
import androidx.camera.core.resolutionselector.ResolutionStrategy
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleService
import java.io.ByteArrayOutputStream
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

// Owns the camera, the upload socket, the wake lock, and the notification for
// one session, independent of any React screen. JS hands over timing; this
// service schedules capture and enforces the deadline.
class PhoneCaptureService : LifecycleService() {
  private val main = Handler(Looper.getMainLooper())
  private val stopping = AtomicBoolean(false)
  private var clock: SessionClock? = null
  private var uploader: FrameUploader? = null
  private var analysisExecutor: ExecutorService? = null
  private var cameraProvider: ProcessCameraProvider? = null
  private var wakeLock: PowerManager.WakeLock? = null
  private var lastNotifiedState: String? = null
  private val deadlineCheck = Runnable { checkDeadline() }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    super.onStartCommand(intent, flags, startId)
    when (intent?.action) {
      ACTION_STOP -> stopSession("stopped", null, discardPending = false)
      ACTION_START -> startSession()
      else -> if (!PhoneCaptureState.isActive()) stopSelf()
    }
    // A killed session is not restarted. The user starts a new one.
    return START_NOT_STICKY
  }

  private fun startSession() {
    val config = PhoneCaptureState.pendingStart
    PhoneCaptureState.pendingStart = null
    if (PhoneCaptureState.isActive() || clock != null) {
      // Repeated Start never restarts or extends a running session.
      return
    }
    if (config == null) {
      stopSelf()
      return
    }

    val sessionClock = SessionClock(config.intervalMs, config.durationMs) {
      SystemClock.elapsedRealtime()
    }
    clock = sessionClock
    PhoneCaptureState.begin(config, sessionClock)
    PhoneCaptureState.markRunning(this)
    PhoneCaptureState.setNotificationsAllowed(
      NotificationManagerCompat.from(this).areNotificationsEnabled(),
    )

    try {
      val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
      } else {
        0
      }
      ensureChannel()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        startForeground(NOTIFICATION_ID, buildNotification("connecting"), type)
      } else {
        startForeground(NOTIFICATION_ID, buildNotification("connecting"))
      }
    } catch (error: Exception) {
      // Thrown when the camera permission is missing or the app was not
      // visible at Start.
      Log.w(TAG, "Could not start the camera foreground service", error)
      stopSession("error", "Android did not allow background camera capture. Open the app and try again.", true)
      return
    }

    acquireWakeLock(sessionClock.durationMs)
    PhoneCaptureState.addListener(notificationListener)
    scheduleDeadlineCheck()

    uploader = FrameUploader(config.uploadUrl, config.uploadToken, sessionClock, uploaderEvents).also {
      it.start()
    }
    bindCamera(config.lens)
  }

  private val uploaderEvents = object : FrameUploader.Events {
    override fun onConnected() = PhoneCaptureState.update { connected(true) }
    override fun onDisconnected(willRetry: Boolean) = PhoneCaptureState.update { connected(false) }
    override fun onAck(received: Long, sampled: Long) =
      PhoneCaptureState.update { ack(received, sampled) }
    override fun onRejected(message: String) {
      main.post { stopSession("error", message, discardPending = true) }
    }
    override fun onExpired() {
      main.post { checkDeadline() }
    }
  }

  private val notificationListener: (Map<String, Any?>) -> Unit = { status ->
    val state = status["state"] as? String
    if (state != null && state != lastNotifiedState && status["active"] == true) {
      lastNotifiedState = state
      main.post { notifyStatus(state) }
    }
  }

  private fun bindCamera(lens: String) {
    val selector = if (lens == "back") {
      CameraSelector.DEFAULT_BACK_CAMERA
    } else {
      CameraSelector.DEFAULT_FRONT_CAMERA
    }
    val executor = Executors.newSingleThreadExecutor().also { analysisExecutor = it }
    val future = ProcessCameraProvider.getInstance(this)

    future.addListener({
      if (stopping.get()) return@addListener
      try {
        val provider = future.get()
        cameraProvider = provider
        if (!provider.hasCamera(selector)) {
          stopSession("error", "The selected camera is not available on this phone.", true)
          return@addListener
        }

        val analysis = ImageAnalysis.Builder()
          .setResolutionSelector(
            ResolutionSelector.Builder()
              .setResolutionStrategy(
                ResolutionStrategy(
                  Size(TARGET_WIDTH, TARGET_HEIGHT),
                  ResolutionStrategy.FALLBACK_RULE_CLOSEST_HIGHER_THEN_LOWER,
                ),
              )
              .build(),
          )
          // Only the newest frame is kept; older ones are dropped before any
          // encoding work.
          .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
          .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
          .build()
        analysis.setAnalyzer(executor) { image -> analyze(image) }

        provider.unbindAll()
        val camera = provider.bindToLifecycle(this, selector, analysis)
        camera.cameraInfo.cameraState.observe(this) { state -> onCameraState(state) }
      } catch (error: Exception) {
        Log.w(TAG, "Camera bind failed", error)
        stopSession("error", "The camera could not be opened.", true)
      }
    }, ContextCompat.getMainExecutor(this))
  }

  private fun onCameraState(state: CameraState) {
    val error = state.error
    when {
      error != null -> PhoneCaptureState.update {
        cameraActive(false)
        reason(cameraErrorMessage(error.code))
      }
      state.type == CameraState.Type.OPEN -> PhoneCaptureState.update {
        cameraActive(true)
        reason(null)
      }
      state.type == CameraState.Type.PENDING_OPEN || state.type == CameraState.Type.CLOSED ->
        PhoneCaptureState.update { cameraActive(false) }
      else -> Unit
    }
  }

  // Runs on the single analysis thread, so at most one frame is encoded at a
  // time. Every ImageProxy is closed.
  private fun analyze(image: ImageProxy) {
    try {
      val sessionClock = clock ?: return
      if (sessionClock.isExpired()) {
        main.post { checkDeadline() }
        return
      }
      if (!sessionClock.shouldSample()) return

      val upload = uploader
      if (upload == null || !upload.canSend()) {
        PhoneCaptureState.update { dropped() }
        return
      }

      val jpeg = encode(image)
      PhoneCaptureState.update { captured() }
      if (jpeg.size > MAX_FRAME_BYTES || sessionClock.isExpired() || !upload.send(jpeg)) {
        PhoneCaptureState.update { dropped() }
        return
      }
      PhoneCaptureState.update { sent() }
    } catch (error: Exception) {
      Log.w(TAG, "Frame encode failed", error)
      PhoneCaptureState.update { dropped() }
    } finally {
      image.close()
    }
  }

  private fun encode(image: ImageProxy): ByteArray {
    val source = image.toBitmap()
    val rotation = image.imageInfo.rotationDegrees
    val upright = if (rotation == 0) {
      source
    } else {
      Bitmap.createBitmap(
        source, 0, 0, source.width, source.height,
        Matrix().apply { postRotate(rotation.toFloat()) }, true,
      )
    }
    val output = ByteArrayOutputStream(64 * 1024)
    upright.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, output)
    if (upright !== source) upright.recycle()
    source.recycle()
    return output.toByteArray()
  }

  private fun scheduleDeadlineCheck() {
    val remaining = clock?.remainingMs() ?: return
    main.removeCallbacks(deadlineCheck)
    // Re-checked each second near the end, because Handler time can lag
    // elapsed time while the CPU sleeps.
    main.postDelayed(deadlineCheck, minOf(remaining, DEADLINE_POLL_MS).coerceAtLeast(1L))
  }

  private fun checkDeadline() {
    val sessionClock = clock ?: return
    if (sessionClock.isExpired()) {
      stopSession("completed", "Session completed", discardPending = true)
    } else {
      scheduleDeadlineCheck()
    }
  }

  // Every stop path ends here. Releases the camera, socket, worker thread,
  // wake lock, and notification exactly once.
  private fun stopSession(terminalState: String, reason: String?, discardPending: Boolean) {
    if (!stopping.compareAndSet(false, true)) return
    main.removeCallbacks(deadlineCheck)
    PhoneCaptureState.removeListener(notificationListener)
    uploader?.stop(discardPending)
    uploader = null
    try {
      cameraProvider?.unbindAll()
    } catch (error: Exception) {
      Log.w(TAG, "Camera unbind failed", error)
    }
    cameraProvider = null
    analysisExecutor?.shutdownNow()
    analysisExecutor = null
    releaseWakeLock()
    PhoneCaptureState.finish(this, terminalState, reason)
    stopForeground(STOP_FOREGROUND_REMOVE)
    stopSelf()
  }

  override fun onDestroy() {
    stopSession("stopped", null, discardPending = true)
    super.onDestroy()
  }

  // A partial wake lock keeps the 1-second cadence while the screen is off.
  // It times out on its own a little after the session deadline, so a missed
  // release cannot drain the battery.
  private fun acquireWakeLock(durationMs: Long) {
    val power = getSystemService(Context.POWER_SERVICE) as PowerManager
    wakeLock = power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "RideGuard:PhoneCapture").apply {
      setReferenceCounted(false)
      acquire(durationMs + WAKE_LOCK_MARGIN_MS)
    }
  }

  private fun releaseWakeLock() {
    wakeLock?.let { if (it.isHeld) it.release() }
    wakeLock = null
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(NotificationManager::class.java)
    if (manager.getNotificationChannel(CHANNEL_ID) == null) {
      manager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Phone camera capture", NotificationManager.IMPORTANCE_LOW),
      )
    }
  }

  private fun notifyStatus(state: String) {
    if (stopping.get()) return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
      ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) !=
      PackageManager.PERMISSION_GRANTED
    ) {
      return
    }
    NotificationManagerCompat.from(this).notify(NOTIFICATION_ID, buildNotification(state))
  }

  private fun buildNotification(state: String): Notification {
    val stopIntent = PendingIntent.getService(
      this, 0,
      Intent(this, PhoneCaptureService::class.java).setAction(ACTION_STOP),
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )
    val openIntent = packageManager.getLaunchIntentForPackage(packageName)?.let {
      PendingIntent.getActivity(this, 1, it, PendingIntent.FLAG_IMMUTABLE)
    }
    val remaining = clock?.remainingMs() ?: 0L

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_menu_camera)
      .setContentTitle("RideGuard phone camera")
      .setContentText(notificationText(state))
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      // Counts down to the deadline on its own; no per-second updates needed.
      .setWhen(System.currentTimeMillis() + remaining)
      .setUsesChronometer(true)
      .setChronometerCountDown(true)
      .setShowWhen(true)
      .setContentIntent(openIntent)
      .addAction(0, "Stop", stopIntent)
      .build()
  }

  private fun notificationText(state: String) = when (state) {
    "uploading" -> "Sending frames for detection"
    "capturing" -> "Camera on. Waiting for the server to confirm frames"
    "interrupted" -> "Camera interrupted. Waiting for it to come back"
    else -> "Connecting to the server"
  }

  private fun cameraErrorMessage(code: Int) = when (code) {
    CameraState.ERROR_CAMERA_IN_USE, CameraState.ERROR_MAX_CAMERAS_IN_USE ->
      "Another app is using the camera."
    CameraState.ERROR_CAMERA_DISABLED -> "The camera is disabled on this phone."
    CameraState.ERROR_DO_NOT_DISTURB_MODE_ENABLED -> "Do Not Disturb is blocking the camera."
    else -> "The camera stopped unexpectedly."
  }

  companion object {
    const val ACTION_START = "expo.modules.phonecapture.START"
    const val ACTION_STOP = "expo.modules.phonecapture.STOP"
    private const val TAG = "PhoneCapture"
    private const val CHANNEL_ID = "rideguard_phone_capture"
    private const val NOTIFICATION_ID = 7341
    private const val TARGET_WIDTH = 640
    private const val TARGET_HEIGHT = 480
    private const val JPEG_QUALITY = 70
    // Matches model-api's default INFERENCE_MAX_FRAME_BYTES (2 MiB).
    private const val MAX_FRAME_BYTES = 2 * 1024 * 1024
    private const val DEADLINE_POLL_MS = 1_000L
    private const val WAKE_LOCK_MARGIN_MS = 60_000L
  }
}
