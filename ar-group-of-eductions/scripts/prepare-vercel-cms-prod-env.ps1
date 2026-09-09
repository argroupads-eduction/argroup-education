# Sets CMS Vercel production env for Cockroach cutover. Does not print secrets.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot\..

function Get-EnvValue([string]$path, [string]$key) {
  if (!(Test-Path $path)) { return $null }
  foreach ($line in Get-Content -LiteralPath $path) {
    if ($line -match "^\s*$key\s*=\s*(.*)$") {
      return $Matches[1].Trim().Trim('"').Trim("'")
    }
  }
  return $null
}

$db = Get-EnvValue '.\.env.cockroachdb' 'DATABASE_URL'
if (-not $db) { $db = Get-EnvValue '.\.env' 'DATABASE_URL' }
if (-not $db -or $db -notmatch 'cockroachlabs\.cloud') {
  Write-Host 'ERROR: Cockroach DATABASE_URL missing'
  exit 1
}

$prodDb = $db -replace 'sslmode=verify-full', 'sslmode=require'
if ($prodDb -notmatch 'sslmode=') {
  $prodDb = if ($prodDb.Contains('?')) { "$prodDb&sslmode=require" } else { "$prodDb?sslmode=require" }
}

$cmsUrl = 'https://argroup-education-cms-livid.vercel.app'
$cron = Get-EnvValue '.\.env' 'CRON_SECRET'
if (-not $cron) {
  $bytes = New-Object byte[] 24
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $cron = ($bytes | ForEach-Object { $_.ToString('x2') }) -join ''
  Add-Content -Path '.\.env' -Value "`nCRON_SECRET=$cron"
}

function Upsert-VercelEnv([string]$name, [string]$value, [string[]]$envs) {
  foreach ($envName in $envs) {
    Write-Host "upsert $name ($envName)"
    vercel env rm $name $envName --yes 2>$null | Out-Null
    $value | vercel env add $name $envName --sensitive
    if ($LASTEXITCODE -ne 0) { throw "Failed to add $name ($envName)" }
  }
}

Write-Host "DATABASE_URL host=$(([Uri]$prodDb).Host)"
Write-Host "NEXT_PUBLIC_SERVER_URL=$cmsUrl"

Upsert-VercelEnv 'DATABASE_URL' $prodDb @('production', 'preview')
Upsert-VercelEnv 'NEXT_PUBLIC_SERVER_URL' $cmsUrl @('production', 'preview')
Upsert-VercelEnv 'BACKEND_API_URL' 'https://www.argroupofeducation.com' @('production')
Upsert-VercelEnv 'FRONTEND_APP_URL' 'https://www.argroupofeducation.com' @('production')
Upsert-VercelEnv 'PAYLOAD_DATABASE_PUSH' 'false' @('production', 'preview')
Upsert-VercelEnv 'CRON_SECRET' $cron @('production', 'preview')

Write-Host 'DONE env upsert'
