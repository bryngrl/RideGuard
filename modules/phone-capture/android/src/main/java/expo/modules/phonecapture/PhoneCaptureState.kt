package expo.modules.phonecapture

import android.content.Context
import android.os.SystemClock

// Session state shared by the service, the notification, and the JS module.
// Lives in the app process, so it survives the React screen unmounting. The
// last terminal state is also saved, so reopening the app after the process
// was reclaimed still shows how the session ended.
object PhoneCaptureState {
  // Start parameters handed from the module to the service. Kept in memory
  // instead of Intent extras so the upload token never leaves the process.
  data class StartConfig(
    val uploadUrl: String,
    val uploadToken: String,
    val deviceId: String,
    val sessionId: String,
    val lens: String,
    val intervalMs: Long,
    val durationMs: Long,
  )

  private const val PREFS = "rideguard.phone_capture"
  private val TERMINAL = setOf("stopped", "completed", "error")

  private val listeners = mutableSetOf<(Map<String, Any?>) -> Unit>()

  @Volatile var pendingStart: StartConfig? = null

  private var state = "idle"
  private var active = false
  private var lens: String? = null
  private var deviceId: String? = null
  private var sessionId: String? = null
  private var clock: SessionClock? = null
  private var cameraActive = false
  private var connected = false
  private var framesCaptured = 0L
  private var framesSent = 0L
  private var framesDropped = 0L
  private var serverReceived = 0L
  private var serverSampled = 0L
  private var lastAckAt: Long? = null
  private var reason: String? = null
  private var endedAt: Long? = null
  private var notificationsAllowed = true

  @Synchronized
  fun isActive(): Boolean = active

  @Synchronized
  fun begin(config: StartConfig, sessionClock: SessionClock) {
    active = true
    state = "connecting"
    lens = config.lens
    deviceId = config.deviceId
    sessionId = config.sessionId
    clock = sessionClock
    cameraActive = false
    connected = false
    framesCaptured = 0
    framesSent = 0
    framesDropped = 0
    serverReceived = 0
    serverSampled = 0
    lastAckAt = null
    reason = null
    endedAt = null
  }

  @Synchronized
  fun clockOrNull(): SessionClock? = clock

  fun update(block: Mutable.() -> Unit) {
    val snapshot = synchronized(this) {
      if (!active) return
      Mutable.block()
      state = derivedState()
      snapshotLocked()
    }
    notify(snapshot)
  }

  // Moves to stopped, completed, or error once. Later calls are ignored.
  fun finish(context: Context, terminalState: String, why: String?) {
    val snapshot = synchronized(this) {
      if (!active) return
      active = false
      state = terminalState
      reason = why
      cameraActive = false
      connected = false
      endedAt = System.currentTimeMillis()
      saveTerminal(context)
      snapshotLocked()
    }
    notify(snapshot)
  }

  @Synchronized
  fun setNotificationsAllowed(allowed: Boolean) {
    notificationsAllowed = allowed
  }

  fun snapshot(context: Context): Map<String, Any?> {
    synchronized(this) {
      if (!active && state == "idle") {
        restoreTerminal(context)
      }
      return snapshotLocked()
    }
  }

  @Synchronized
  fun addListener(listener: (Map<String, Any?>) -> Unit) {
    listeners.add(listener)
  }

  @Synchronized
  fun removeListener(listener: (Map<String, Any?>) -> Unit) {
    listeners.remove(listener)
  }

  // Field setters used inside update { }.
  object Mutable {
    fun cameraActive(value: Boolean) { PhoneCaptureState.cameraActive = value }
    fun connected(value: Boolean) { PhoneCaptureState.connected = value }
    fun captured() { framesCaptured++ }
    fun sent() { framesSent++ }
    fun dropped() { framesDropped++ }
    fun reason(value: String?) { PhoneCaptureState.reason = value }
    fun ack(received: Long, sampled: Long) {
      serverReceived = received
      serverSampled = sampled
      lastAckAt = SystemClock.elapsedRealtime()
    }
  }

  // "uploading" needs a recent server ack, because a local socket send does not
  // prove the server got the frame.
  private fun derivedState(): String {
    val ack = lastAckAt
    return when {
      !cameraActive && reason != null -> "interrupted"
      !connected -> "connecting"
      ack != null && SystemClock.elapsedRealtime() - ack <= ACK_FRESH_MS -> "uploading"
      else -> "capturing"
    }
  }

  private fun notify(snapshot: Map<String, Any?>) {
    val targets = synchronized(this) { listeners.toList() }
    targets.forEach { it(snapshot) }
  }

  private fun snapshotLocked(): Map<String, Any?> {
    val sessionClock = clock
    val remaining = if (active && sessionClock != null) sessionClock.remainingMs() else 0L
    return mapOf(
      "state" to state,
      "active" to active,
      "lens" to lens,
      "deviceId" to deviceId,
      "sessionId" to sessionId,
      "intervalMs" to sessionClock?.intervalMs?.toDouble(),
      "durationMs" to sessionClock?.durationMs?.toDouble(),
      "remainingMs" to remaining.toDouble(),
      // For display only. Scheduling uses the monotonic clock.
      "deadlineAt" to if (active) (System.currentTimeMillis() + remaining).toDouble() else null,
      "cameraActive" to cameraActive,
      "connected" to connected,
      "framesCaptured" to framesCaptured.toDouble(),
      "framesSent" to framesSent.toDouble(),
      "framesDropped" to framesDropped.toDouble(),
      "serverReceived" to serverReceived.toDouble(),
      "serverSampled" to serverSampled.toDouble(),
      "reason" to reason,
      "endedAt" to endedAt?.toDouble(),
      "notificationsAllowed" to notificationsAllowed,
    )
  }

  private fun saveTerminal(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .putString("state", state)
      .putString("reason", reason)
      .putString("deviceId", deviceId)
      .putString("sessionId", sessionId)
      .putString("lens", lens)
      .putLong("endedAt", endedAt ?: 0L)
      .apply()
  }

  private fun restoreTerminal(context: Context) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val saved = prefs.getString("state", null) ?: return
    if (saved !in TERMINAL) return
    state = saved
    reason = prefs.getString("reason", null)
    deviceId = prefs.getString("deviceId", null)
    sessionId = prefs.getString("sessionId", null)
    lens = prefs.getString("lens", null)
    endedAt = prefs.getLong("endedAt", 0L).takeIf { it > 0L }
  }

  // Marks a session that was running when the process died. Called when the
  // service is created with no active session but a "running" marker exists.
  fun markRunning(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .putString("state", "running")
      .apply()
  }

  fun recoverInterrupted(context: Context) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    if (prefs.getString("state", null) == "running" && !isActive()) {
      prefs.edit()
        .putString("state", "stopped")
        .putString("reason", "The app was closed during capture. Start again to resume.")
        .putLong("endedAt", System.currentTimeMillis())
        .apply()
    }
  }

  private const val ACK_FRESH_MS = 5_000L
}
