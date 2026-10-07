param(
  [string]$ProjectRoot = "."
)
$ErrorActionPreference = "Stop"
$packageRoot = Split-Path -Parent $PSScriptRoot
$source = Join-Path $packageRoot "media\uploads"
$backend = Join-Path $ProjectRoot "backend"
$target = Join-Path $backend "uploads"
if (-not (Test-Path $backend)) { throw "No encuentro la carpeta backend en: $ProjectRoot" }
Write-Host "ATENCION: se limpiará el almacenamiento de prueba en $target" -ForegroundColor Yellow
if (Test-Path $target) { Remove-Item $target -Recurse -Force }
New-Item -ItemType Directory -Path $target -Force | Out-Null
Copy-Item (Join-Path $source '*') $target -Recurse -Force
Write-Host "Media de prueba preparada en $target" -ForegroundColor Green
