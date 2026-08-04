$ErrorActionPreference = 'Stop'

$port = '5180'
$url = "http://127.0.0.1:$port"
$projectRoot = Split-Path -Parent $PSScriptRoot

$chromeCandidates = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LocalAppData\Google\Chrome\Application\chrome.exe"
)

$chromePath = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', 'dev', '--', '--host', '127.0.0.1', '--port', $port, '--strictPort') -WorkingDirectory $projectRoot -WindowStyle Minimized
Start-Sleep -Seconds 2

if ($chromePath) {
  Start-Process -FilePath $chromePath -ArgumentList $url
} else {
  Start-Process -FilePath 'chrome.exe' -ArgumentList $url
}
