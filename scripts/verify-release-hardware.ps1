param(
  [string]$ApkPath = (Join-Path $PSScriptRoot '../android/app/build/outputs/apk/release/app-release.apk')
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$sdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA 'Android/Sdk' }
$aapt = Join-Path $sdkRoot 'build-tools/36.0.0/aapt2.exe'
$resolvedApk = (Resolve-Path -LiteralPath $ApkPath).Path
$resources = (& $aapt dump resources $resolvedApk) -join "`n"
if ($LASTEXITCODE -ne 0) { throw 'Could not inspect the APK resource table.' }
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Drawing
$archive = [IO.Compression.ZipFile]::OpenRead($resolvedApk)
try {
  foreach ($name in @('red-button', 'red-button-pressed', 'white-button', 'white-button-pressed')) {
    $resourceName = 'assets_images_hardware_' + $name.Replace('-', '')
    $match = [regex]::Match($resources, ('resource [^\n]+drawable/' + $resourceName + '\n\s+\(mdpi\) \(file\) (\S+)'))
    if (!$match.Success) { throw "Missing packaged resource: $resourceName" }
    $entry = $archive.GetEntry($match.Groups[1].Value)
    if (!$entry) { throw "Missing packaged PNG: $resourceName" }
    $stream = $entry.Open()
    $source = $null
    $packaged = $null
    try {
      $source = [Drawing.Image]::FromFile((Join-Path $projectRoot "assets/images/hardware/$name.png"))
      $packaged = [Drawing.Image]::FromStream($stream)
      if ($packaged.Width -ne $source.Width -or $packaged.Height -ne $source.Height) {
        throw "Unexpected packaged dimensions for $name"
      }
      [pscustomobject]@{ Asset = "$name.png"; Entry = $entry.FullName; Width = $packaged.Width; Height = $packaged.Height }
    } finally {
      if ($packaged) { $packaged.Dispose() }
      if ($source) { $source.Dispose() }
      $stream.Dispose()
    }
  }
} finally { $archive.Dispose() }
