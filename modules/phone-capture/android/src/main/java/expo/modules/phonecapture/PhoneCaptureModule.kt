package expo.modules.phonecapture

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import androidx.core.content.ContextCompat
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class StartOptions : Record {
  @Field val uploadUrl: String = ""
  @Field val uploadToken: String = ""
  @Field val deviceId: String = ""
  @Field val sessionId: String = ""
  @Field val lens: String = "front"
  @Field val intervalMs: Double = 0.0
  @Field val durationMs: Double = 0.0
}

class PhoneCaptureModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val listener: (Map<String, Any?>) -> Unit = { status ->
    sendEvent(STATUS_EVENT, status)
  }

  override fun definition() = ModuleDefinition {
    Name("PhoneCapture")

    Events(STATUS_EVENT)

    OnCreate {
      PhoneCaptureState.recoverInterrupted(context)
    }

    OnStartObserving {
      PhoneCaptureState.addListener(listener)
    }

    OnStopObserving {
      PhoneCaptureState.removeListener(listener)
    }

    Function("getStatus") {
      PhoneCaptureState.snapshot(context)
    }

    Function("getAvailableLenses") {
      availableLenses()
    }

    // Returns the current status. If a session is already running it is left
    // alone: Start never restarts it or moves its deadline.
    Function("start") { options: StartOptions ->
      if (PhoneCaptureState.isActive()) {
        return@Function PhoneCaptureState.snapshot(context)
      }

      val intervalMs = options.intervalMs.toLong()
      val durationMs = options.durationMs.toLong()
      try {
        SessionClock.validate(intervalMs, durationMs)
      } catch (error: IllegalArgumentException) {
        throw InvalidOptionsException(error.message ?: "Invalid timing")
      }
      if (!options.uploadUrl.startsWith("ws://") && !options.uploadUrl.startsWith("wss://")) {
        throw InvalidOptionsException("uploadUrl must be a ws:// or wss:// URL")
      }
      if (options.uploadToken.isBlank() || options.deviceId.isBlank()) {
        throw InvalidOptionsException("uploadToken and deviceId are required")
      }
      if (options.lens !in availableLenses()) {
        throw InvalidOptionsException("The ${options.lens} camera is not available")
      }
      if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) !=
        PackageManager.PERMISSION_GRANTED
      ) {
        throw CameraPermissionException()
      }

      PhoneCaptureState.pendingStart = PhoneCaptureState.StartConfig(
        uploadUrl = options.uploadUrl,
        uploadToken = options.uploadToken,
        deviceId = options.deviceId,
        sessionId = options.sessionId,
        lens = options.lens,
        intervalMs = intervalMs,
        durationMs = durationMs,
      )
      ContextCompat.startForegroundService(
        context,
        Intent(context, PhoneCaptureService::class.java).setAction(PhoneCaptureService.ACTION_START),
      )
      PhoneCaptureState.snapshot(context) + ("state" to "starting")
    }

    Function("stop") {
      if (PhoneCaptureState.isActive()) {
        context.startService(
          Intent(context, PhoneCaptureService::class.java).setAction(PhoneCaptureService.ACTION_STOP),
        )
      }
    }
  }

  private fun availableLenses(): List<String> {
    val manager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
    return manager.cameraIdList.mapNotNull { id ->
      when (manager.getCameraCharacteristics(id).get(CameraCharacteristics.LENS_FACING)) {
        CameraCharacteristics.LENS_FACING_FRONT -> "front"
        CameraCharacteristics.LENS_FACING_BACK -> "back"
        else -> null
      }
    }.distinct()
  }

  companion object {
    const val STATUS_EVENT = "onStatus"
  }
}

class InvalidOptionsException(message: String) :
  CodedException("ERR_PHONE_CAPTURE_OPTIONS", message, null)

class CameraPermissionException :
  CodedException("ERR_CAMERA_PERMISSION", "Camera permission is required", null)
