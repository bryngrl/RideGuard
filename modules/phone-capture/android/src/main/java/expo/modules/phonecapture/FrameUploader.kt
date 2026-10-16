package expo.modules.phonecapture

import android.os.Handler
import android.os.HandlerThread
import java.util.concurrent.TimeUnit
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString.Companion.toByteString
import org.json.JSONObject

// Sends one JPEG per binary WebSocket message to model-api. Never queues more
// than MAX_QUEUED_BYTES: when the socket is slow or down, new frames are
// dropped instead of building a backlog, and nothing is replayed after a
// reconnect.
class FrameUploader(
  private val url: String,
  private val token: String,
  private val clock: SessionClock,
  private val events: Events,
) {
  interface Events {
    fun onConnected()
    fun onDisconnected(willRetry: Boolean)
    fun onAck(received: Long, sampled: Long)
    // Server said the token is no longer valid (ended, replaced, or expired).
    fun onRejected(message: String)
    fun onExpired()
  }

  private val thread = HandlerThread("phone-capture-net").apply { start() }
  private val handler = Handler(thread.looper)
  private val backoff = Backoff()
  private val client = OkHttpClient.Builder()
    .connectTimeout(10, TimeUnit.SECONDS)
    .pingInterval(20, TimeUnit.SECONDS)
    .build()

  @Volatile private var socket: WebSocket? = null
  @Volatile private var open = false
  @Volatile private var stopped = false

  fun start() {
    handler.post { connect() }
  }

  fun canSend(): Boolean {
    val current = socket ?: return false
    return open && !stopped && !clock.isExpired() && current.queueSize() < MAX_QUEUED_BYTES
  }

  fun send(jpeg: ByteArray): Boolean {
    val current = socket ?: return false
    if (!canSend()) return false
    return current.send(jpeg.toByteString())
  }

  // discardPending drops frames still in the send queue (used on expiry).
  fun stop(discardPending: Boolean) {
    if (stopped) return
    stopped = true
    handler.removeCallbacksAndMessages(null)
    socket?.let { if (discardPending) it.cancel() else it.close(NORMAL_CLOSURE, "stopped") }
    socket = null
    open = false
    thread.quitSafely()
    client.dispatcher.executorService.shutdown()
  }

  private fun connect() {
    // Checked before every attempt, so a reconnect can never outlive the
    // session.
    if (stopped) return
    if (clock.isExpired()) {
      events.onExpired()
      return
    }
    val request = Request.Builder()
      .url(url)
      .header("Authorization", "Bearer $token")
      .build()
    socket = client.newWebSocket(request, Listener())
  }

  private fun scheduleReconnect() {
    if (stopped) return
    val delay = backoff.nextDelayMs()
    if (delay >= clock.remainingMs()) {
      // The session would be over before the retry; do not bother.
      events.onDisconnected(willRetry = false)
      return
    }
    events.onDisconnected(willRetry = true)
    handler.postDelayed({ connect() }, delay)
  }

  private inner class Listener : WebSocketListener() {
    private fun isCurrent(webSocket: WebSocket) = !stopped && webSocket === socket

    override fun onOpen(webSocket: WebSocket, response: Response) {
      if (!isCurrent(webSocket)) return
      open = true
      backoff.reset()
      events.onConnected()
    }

    override fun onMessage(webSocket: WebSocket, text: String) {
      if (!isCurrent(webSocket)) return
      try {
        val message = JSONObject(text)
        if (message.optString("type") == "ack") {
          events.onAck(message.optLong("received"), message.optLong("sampled"))
        }
      } catch (_: Exception) {
        // Unknown text messages are ignored.
      }
    }

    override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
      webSocket.close(NORMAL_CLOSURE, null)
      if (!isCurrent(webSocket)) return
      open = false
      handler.post {
        when (code) {
          CLOSE_REJECTED -> events.onRejected("Upload access was rejected. Start a new session.")
          CLOSE_REPLACED -> events.onRejected("Another connection took over this camera.")
          CLOSE_EXPIRED -> events.onExpired()
          else -> scheduleReconnect()
        }
      }
    }

    override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
      if (!isCurrent(webSocket)) return
      open = false
      handler.post { scheduleReconnect() }
    }
  }

  companion object {
    // About three 640x480 frames. Anything beyond that is stale.
    const val MAX_QUEUED_BYTES = 256L * 1024L
    const val NORMAL_CLOSURE = 1000
    const val CLOSE_REJECTED = 4401
    const val CLOSE_EXPIRED = 4408
    const val CLOSE_REPLACED = 4409
  }
}
