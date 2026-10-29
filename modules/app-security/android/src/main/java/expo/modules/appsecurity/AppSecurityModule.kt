package expo.modules.appsecurity

import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.PowerManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Observes screen state only. It never reads or dismisses device credentials. */
class AppSecurityModule : Module() {
  private var registeredContext: Context? = null
  private val context: Context
    get() = appContext.reactContext?.applicationContext ?: throw Exceptions.ReactContextLost()

  private val receiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      if (intent.action == Intent.ACTION_SCREEN_OFF) {
        val prefs = context.getSharedPreferences("rideguard-screen-state", Context.MODE_PRIVATE)
        prefs.edit().putLong("screenOffCount", prefs.getLong("screenOffCount", 0) + 1).apply()
      }
      sendEvent("onScreenState", snapshot(context))
    }
  }

  private fun snapshot(context: Context): Map<String, Any> {
    val power = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    val keyguard = context.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
    return mapOf(
      "screenOffCount" to context.getSharedPreferences("rideguard-screen-state", Context.MODE_PRIVATE)
        .getLong("screenOffCount", 0).toDouble(),
      "interactive" to power.isInteractive,
      "locked" to keyguard.isDeviceLocked
    )
  }

  private fun register() {
    if (registeredContext != null) return
    val app = context
    val filter = IntentFilter().apply {
      addAction(Intent.ACTION_SCREEN_OFF)
      addAction(Intent.ACTION_SCREEN_ON)
      addAction(Intent.ACTION_USER_PRESENT)
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      app.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      @Suppress("DEPRECATION")
      app.registerReceiver(receiver, filter)
    }
    registeredContext = app
  }

  override fun definition() = ModuleDefinition {
    Name("AppSecurity")
    Events("onScreenState")
    OnCreate { register() }
    Function("getScreenState") { register(); snapshot(context) }
    OnDestroy {
      registeredContext?.unregisterReceiver(receiver)
      registeredContext = null
    }
  }
}
