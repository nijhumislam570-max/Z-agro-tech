param(
  [string]$PublicSiteUrl,
  [string]$SteadfastApiKey,
  [string]$SteadfastSecretKey,
  [string]$OpenAiApiKey,
  [string]$OpenAiModel = "gpt-4o-mini"
)

$ErrorActionPreference = "Stop"

$secretArgs = @()

if ($PublicSiteUrl) {
  $secretArgs += "PUBLIC_SITE_URL=$PublicSiteUrl"
}
if ($SteadfastApiKey) {
  $secretArgs += "STEADFAST_API_KEY=$SteadfastApiKey"
}
if ($SteadfastSecretKey) {
  $secretArgs += "STEADFAST_SECRET_KEY=$SteadfastSecretKey"
}
if ($OpenAiApiKey) {
  $secretArgs += "OPENAI_API_KEY=$OpenAiApiKey"
}
if ($OpenAiModel) {
  $secretArgs += "OPENAI_MODEL=$OpenAiModel"
}

if ($secretArgs.Count -gt 0) {
  Write-Host "Updating Supabase function secrets..."
  npx supabase secrets set $secretArgs
}

$functions = @(
  "delete-user",
  "geocode",
  "parse-product-pdf",
  "sitemap",
  "steadfast",
  "upload-image-url"
)

foreach ($fn in $functions) {
  Write-Host ""
  Write-Host "Deploying function: $fn"
  npx supabase functions deploy $fn --no-verify-jwt
}

Write-Host ""
Write-Host "All edge functions deployed."
