$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

function Assert-Command($Name, $InstallHint) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "Command not found: $Name" -ForegroundColor Red
    Write-Host $InstallHint
    Read-Host "Press Enter to exit"
    exit 1
  }
}

Assert-Command "node" "Install Node.js from https://nodejs.org/ and reopen this terminal."

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  Assert-Command "corepack" "Install a recent Node.js version with Corepack, or install pnpm manually."
  Write-Host "pnpm not found. Preparing pnpm with Corepack..."
  corepack enable
  corepack prepare pnpm@latest --activate
}

Assert-Command "pnpm" "Install pnpm, or enable it with Corepack."

if (-not (Test-Path ".\chromedriver.exe")) {
  Write-Host ""
  Write-Host "chromedriver.exe was not found." -ForegroundColor Red
  Write-Host "Put the chromedriver.exe matching your Chrome major version in this project folder:"
  Write-Host $ProjectRoot
  Read-Host "Press Enter to exit"
  exit 1
}

if (-not (Test-Path ".\node_modules")) {
  Write-Host "node_modules not found. Installing dependencies..."
  pnpm install
}

Write-Host ""
Write-Host "Starting project..." -ForegroundColor Green
pnpm run dev

Write-Host ""
Read-Host "Program exited. Press Enter to close"
