$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$backend = Join-Path $root 'backend-app'
$frontend = Join-Path $root 'my-react-app'
$url = 'http://127.0.0.1:5180'

function Stop-ListeningProcess {
  param([int]$Port)

  $line = netstat -ano |
    Select-String "127.0.0.1:$Port" |
    Select-String 'LISTENING' |
    Select-Object -First 1

  if (-not $line) {
    return
  }

  $processId = ($line.ToString().Trim() -split '\s+')[-1]

  if ($processId -and $processId -ne '0') {
    Stop-Process -Id ([int]$processId) -Force -ErrorAction SilentlyContinue
  }
}

$chromeCandidates = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LocalAppData\Google\Chrome\Application\chrome.exe"
)
$chromePath = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

Stop-ListeningProcess -Port 8000
Stop-ListeningProcess -Port 5180

Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-File', 'start-api.ps1') -WorkingDirectory $backend
Start-Sleep -Seconds 2
Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', 'dev', '--', '--host', '127.0.0.1', '--port', '5180', '--strictPort') -WorkingDirectory $frontend -WindowStyle Minimized
Start-Sleep -Seconds 2

if ($chromePath) {
  Start-Process -FilePath $chromePath -ArgumentList $url
} else {
  Start-Process -FilePath 'chrome.exe' -ArgumentList $url
}
