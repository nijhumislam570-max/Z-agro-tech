param(
  [Parameter(Mandatory = $true)]
  [string]$PgUri,

  [string]$AdminBootstrapSqlPath
)

$ErrorActionPreference = "Stop"

$bundleDir = Join-Path $PSScriptRoot "..\supabase\migration-bundle"
$schemaSql = Join-Path $bundleDir "01_schema_all_migrations.sql"
$dataSql = Join-Path $bundleDir "02_data_inserts.sql"
$storageSql = Join-Path $bundleDir "03_storage.sql"

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
  throw "psql was not found on PATH. Install PostgreSQL client tools first."
}

Write-Host "Applying schema bundle..."
psql "$PgUri" -f "$schemaSql"

Write-Host ""
Write-Host "Applying row data bundle..."
psql "$PgUri" -f "$dataSql"

Write-Host ""
Write-Host "Applying storage bundle..."
psql "$PgUri" -f "$storageSql"

if ($AdminBootstrapSqlPath) {
  Write-Host ""
  Write-Host "Applying admin bootstrap SQL..."
  psql "$PgUri" -f "$AdminBootstrapSqlPath"
}

Write-Host ""
Write-Host "Migration bundle applied successfully."
