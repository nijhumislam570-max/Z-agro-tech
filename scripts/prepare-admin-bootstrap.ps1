param(
  [Parameter(Mandatory = $true)]
  [string]$AdminUserId
)

$ErrorActionPreference = "Stop"

$templatePath = Join-Path $PSScriptRoot "..\supabase\migration-bundle\04_bootstrap_admin.sql"
$outputPath = Join-Path $PSScriptRoot "..\supabase\migration-bundle\04_bootstrap_admin.ready.sql"

$template = Get-Content -Raw $templatePath
$resolved = $template.Replace("<NEW_ADMIN_USER_ID>", $AdminUserId)

Set-Content -Path $outputPath -Value $resolved -NoNewline

Write-Host "Prepared bootstrap SQL:"
Write-Host $outputPath
