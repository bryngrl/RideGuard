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
  $manifestEntry = $archive.GetEntry('assets/app.manifest')
  if (!$manifestEntry) { throw 'Missing embedded Expo asset manifest.' }
  $reader = [IO.StreamReader]::new($manifestEntry.Open())
  try { $manifest = $reader.ReadToEnd() | ConvertFrom-Json }
  finally { $reader.Dispose() }
  foreach ($asset in @('hardware/red-button.png', 'hardware/red-button-pressed.png',
    'hardware/white-button.png', 'hardware/white-button-pressed.png',
    'all-set-icon.png', 'backgrounds/contact-information-dark.png')) {
    $resourceName = 'assets_images_' + $asset.Replace('.png', '').Replace('-', '').Replace('/', '_')
    $sourcePath = Join-Path $projectRoot "assets/images/$asset"
    $sourceHash = (Get-FileHash -LiteralPath $sourcePath -Algorithm MD5).Hash.ToLowerInvariant()
    $listed = @($manifest.assets | Where-Object {
      $_.resourcesFilename -eq $resourceName -and $_.type -eq 'png' -and
      $_.packagerHash -eq $sourceHash
    })
    if ($listed.Count -ne 1) { throw "Stale Expo asset manifest: $asset is missing or has an outdated hash." }
    $match = [regex]::Match($resources, ('resource [^\n]+drawable/' + $resourceName + '\n\s+\(mdpi\) \(file\) (\S+)'))
    if (!$match.Success) { throw "Missing packaged resource: $resourceName" }
    $entry = $archive.GetEntry($match.Groups[1].Value)
    if (!$entry) { throw "Missing packaged PNG: $resourceName" }
    $stream = $entry.Open()
    $source = $null
    $packaged = $null
    try {
      $source = [Drawing.Image]::FromFile($sourcePath)
      $packaged = [Drawing.Image]::FromStream($stream)
      if ($packaged.Width -ne $source.Width -or $packaged.Height -ne $source.Height) {
        throw "Unexpected packaged dimensions for $asset"
      }
      [pscustomobject]@{ Asset = $asset; Entry = $entry.FullName; Width = $packaged.Width; Height = $packaged.Height }
    } finally {
      if ($packaged) { $packaged.Dispose() }
      if ($source) { $source.Dispose() }
      $stream.Dispose()
    }
  }
} finally { $archive.Dispose() }
