package expo.modules.phonecapture

import kotlin.math.min
import kotlin.random.Random

// Timing for one capture session. Runs on a monotonic clock
// (SystemClock.elapsedRealtime in the app) so wall-clock changes cannot stretch
// a session. The deadline is fixed when the session is created and nothing
// resets it: not reconnects, not camera errors, not repeated Start calls.
class SessionClock(
  val intervalMs: Long,
  val durationMs: Long,
  private val now: () -> Long,
) {
  private val startedAt = now()
  val deadline = startedAt + durationMs
  private var nextSampleAt = startedAt

  init {
    validate(intervalMs, durationMs)
  }

  fun elapsedMs(): Long = now() - startedAt

  fun remainingMs(): Long = maxOf(0L, deadline - now())

  fun isExpired(): Boolean = now() >= deadline

  // True at most once per interval. A late frame takes the slot it is in and
  // the next slot is one interval later, so missed intervals never turn into a
  // burst of catch-up frames.
  @Synchronized
  fun shouldSample(): Boolean {
    val current = now()
    if (current >= deadline || current < nextSampleAt) {
      return false
    }
    val scheduled = nextSampleAt + intervalMs
    nextSampleAt = if (scheduled > current) scheduled else current + intervalMs
    return true
  }

  companion object {
    const val MIN_INTERVAL_MS = 100L
    const val MAX_INTERVAL_MS = 60_000L
    const val MIN_DURATION_MS = 10_000L
    const val MAX_DURATION_MS = 60 * 60_000L

    fun validate(intervalMs: Long, durationMs: Long) {
      require(intervalMs in MIN_INTERVAL_MS..MAX_INTERVAL_MS) {
        "intervalMs must be between $MIN_INTERVAL_MS and $MAX_INTERVAL_MS"
      }
      require(durationMs in MIN_DURATION_MS..MAX_DURATION_MS) {
        "durationMs must be between $MIN_DURATION_MS and $MAX_DURATION_MS"
      }
    }
  }
}

// Capped exponential backoff with jitter for reconnects.
class Backoff(
  private val baseMs: Long = 1_000L,
  private val maxMs: Long = 30_000L,
  private val random: Random = Random.Default,
) {
  private var attempt = 0

  fun nextDelayMs(): Long {
    val ceiling = min(maxMs, baseMs shl min(attempt, 20))
    attempt++
    // Between half and all of the ceiling, so many phones do not retry in step.
    return ceiling / 2 + random.nextLong(ceiling / 2 + 1)
  }

  fun reset() {
    attempt = 0
  }
}
