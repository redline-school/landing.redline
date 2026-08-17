param(
  [string]$Server = "89.108.81.82",
  [int]$Port = 22,
  [string]$User = "root"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeDirectory = Join-Path $env:USERPROFILE ".codex-temp"
$keyPath = Join-Path $runtimeDirectory "redline_deploy_runtime"
$knownHostsPath = Join-Path $runtimeDirectory "known_hosts"
$releaseId = Get-Date -Format "yyyyMMddHHmmss"
$archivePath = Join-Path $runtimeDirectory "redline-landing-$releaseId.tar.gz"
$remoteArchive = "/tmp/redline-landing-$releaseId.tar.gz"
$destination = "$User@$Server"

if (!(Test-Path -LiteralPath $keyPath)) {
  throw "SSH key not found: $keyPath"
}
if (!(Test-Path -LiteralPath $knownHostsPath)) {
  throw "Known hosts file not found: $knownHostsPath"
}

Push-Location $projectRoot
try {
  & npm.cmd run build:vps
  if ($LASTEXITCODE -ne 0) { throw "VPS build failed" }

  if (Test-Path -LiteralPath $archivePath) {
    Remove-Item -LiteralPath $archivePath -Force
  }
  & tar.exe -C (Join-Path $projectRoot "dist/vps-web") -czf $archivePath .
  if ($LASTEXITCODE -ne 0) { throw "Archive creation failed" }

  $scpOptions = @(
    "-i", $keyPath,
    "-P", $Port,
    "-o", "BatchMode=yes",
    "-o", "StrictHostKeyChecking=yes",
    "-o", "UserKnownHostsFile=$knownHostsPath"
  )
  $sshOptions = @(
    "-i", $keyPath,
    "-p", $Port,
    "-o", "BatchMode=yes",
    "-o", "StrictHostKeyChecking=yes",
    "-o", "UserKnownHostsFile=$knownHostsPath"
  )

  & scp @scpOptions $archivePath "${destination}:$remoteArchive"
  if ($LASTEXITCODE -ne 0) { throw "Archive upload failed" }
  & scp @scpOptions (Join-Path $projectRoot "deploy/landing-api-server.mjs") "${destination}:/tmp/redline-landing-api-server.mjs"
  if ($LASTEXITCODE -ne 0) { throw "API upload failed" }
  & scp @scpOptions (Join-Path $projectRoot "deploy/redline-landing-api.service") "${destination}:/tmp/redline-landing-api.service"
  if ($LASTEXITCODE -ne 0) { throw "Service upload failed" }
  & scp @scpOptions (Join-Path $projectRoot "deploy/landing.redline-tutors.ru.nginx.conf") "${destination}:/tmp/redline-landing.nginx.conf"
  if ($LASTEXITCODE -ne 0) { throw "Nginx upload failed" }
  & scp @scpOptions (Join-Path $projectRoot "deploy/install-vps.sh") "${destination}:/tmp/redline-landing-install.sh"
  if ($LASTEXITCODE -ne 0) { throw "Installer upload failed" }

  & ssh @sshOptions $destination "chmod 700 /tmp/redline-landing-install.sh && /tmp/redline-landing-install.sh '$remoteArchive' '$releaseId'"
  if ($LASTEXITCODE -ne 0) { throw "Remote deployment failed" }
}
finally {
  Pop-Location
  if (Test-Path -LiteralPath $archivePath) {
    Remove-Item -LiteralPath $archivePath -Force
  }
}
