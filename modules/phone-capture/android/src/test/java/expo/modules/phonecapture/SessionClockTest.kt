package expo.modules.phonecapture

import kotlin.random.Random
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SessionClockTest {
  private var time = 1_000_000L
  private fun clock(intervalMs: Long = 1_000L, durationMs: Long = 600_000L) =
    SessionClock(intervalMs, durationMs) { time }

  @Test
  fun samplesTheFirstFrameThenOncePerInterval() {
    val clock = clock()
    assertTrue(clock.shouldSample())
    time += 500
    assertFalse(clock.shouldSample())
    time += 500
    assertTrue(clock.shouldSample())
  }

  @Test
  fun aLongGapDoesNotCauseCatchUpFrames() {
    val clock = clock()
    assertTrue(clock.shouldSample())
    time += 10_500
    assertTrue(clock.shouldSample())
    // The next slot is one interval after the late frame, not the missed ones.
    time += 100
    assertFalse(clock.shouldSample())
    time += 900
    assertTrue(clock.shouldSample())
  }

  @Test
  fun followsTheConfiguredInterval() {
    val clock = clock(intervalMs = 250L)
    var sampled = 0
    repeat(40) {
      if (clock.shouldSample()) sampled++
      time += 50
    }
    // 2000 ms of 50 ms frames at a 250 ms interval.
    assertEquals(8, sampled)
  }

  @Test
  fun expiresAtTheFixedDeadlineAndStopsSampling() {
    val clock = clock(durationMs = 600_000L)
    time += 599_999
    assertFalse(clock.isExpired())
    assertEquals(1L, clock.remainingMs())
    time += 1
    assertTrue(clock.isExpired())
    assertFalse(clock.shouldSample())
    assertEquals(0L, clock.remainingMs())
  }

  @Test
  fun aSessionYieldsAboutOneFramePerSecondForTenMinutes() {
    val clock = clock()
    var sampled = 0
    // A 30 fps sensor for the whole session.
    while (!clock.isExpired()) {
      if (clock.shouldSample()) sampled++
      time += 33
    }
    assertEquals(600, sampled)
  }

  @Test(expected = IllegalArgumentException::class)
  fun rejectsAnIntervalBelowTheMinimum() {
    clock(intervalMs = 10L)
  }

  @Test(expected = IllegalArgumentException::class)
  fun rejectsADurationAboveTheMaximum() {
    clock(durationMs = 2 * 60 * 60_000L)
  }

  @Test
  fun backoffGrowsAndStaysCapped() {
    val backoff = Backoff(baseMs = 1_000L, maxMs = 30_000L, random = Random(42))
    val delays = List(10) { backoff.nextDelayMs() }
    assertTrue(delays[0] in 500L..1_000L)
    assertTrue(delays[1] in 1_000L..2_000L)
    assertTrue(delays.all { it <= 30_000L })
    assertTrue(delays.last() >= 15_000L)
    backoff.reset()
    assertTrue(backoff.nextDelayMs() <= 1_000L)
  }
}
