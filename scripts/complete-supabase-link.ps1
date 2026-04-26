param(
  [string]$ProjectRef = "hsosfeynosulypnpwbet"
)

$ErrorActionPreference = "Stop"

Write-Host "Checking Supabase CLI..."
npx supabase --version

Write-Host ""
Write-Host "Logging into Supabase..."
npx supabase login

Write-Host ""
Write-Host "Linking this repo to project $ProjectRef..."
npx supabase link --project-ref $ProjectRef

Write-Host ""
Write-Host "Previewing remote migration changes..."
npx supabase db push --linked --dry-run

Write-Host ""
Write-Host "If the dry run looks correct, run the real push next:"
Write-Host "npx supabase db push --linked"
Write-Host ""
Write-Host "Then regenerate database types with:"
Write-Host "npx supabase gen types typescript --linked > src/integrations/supabase/types.ts"
