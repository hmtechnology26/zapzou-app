$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$workspaceRoot = Split-Path -Parent $root
$scriptPath = Join-Path $PSScriptRoot 'import-roteiro-comercial.mjs'
$previewPath = Join-Path $PSScriptRoot 'preview-cache.json'
$logPath = Join-Path $PSScriptRoot 'instagram-import.log'
$withoutInstagramPath = Join-Path $PSScriptRoot 'without-instagram.json'
$chunkSize = 10

function Write-Log {
  param([string]$Message)
  $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
  Add-Content -LiteralPath $logPath -Value $line
  Write-Output $line
}

if (-not (Test-Path -LiteralPath $previewPath)) {
  throw "Preview nao encontrado em $previewPath"
}

$preview = Get-Content -LiteralPath $previewPath -Raw | ConvertFrom-Json
$records = @($preview.reviewRecords)
$withInstagram = @($records | Where-Object { $_.instagram -and "$($_.instagram)".Trim() -ne '' })
$withoutInstagram = @($records | Where-Object { -not $_.instagram -or "$($_.instagram)".Trim() -eq '' } | ForEach-Object {
  [pscustomobject]@{
    sourceId = "$($_.sourceId)"
    title = "$($_.title)"
    businessName = "$($_.businessName)"
    whatsapp = if ($_.whatsapp) { "$($_.whatsapp)" } else { $null }
  }
})

$withoutInstagram | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $withoutInstagramPath -Encoding UTF8
Set-Content -LiteralPath $logPath -Value ""
Write-Log "Inicio da importacao por Instagram. Com Instagram: $($withInstagram.Count). Sem Instagram: $($withoutInstagram.Count)."

for ($i = 0; $i -lt $withInstagram.Count; $i += $chunkSize) {
  $chunk = @($withInstagram[$i..([Math]::Min($i + $chunkSize - 1, $withInstagram.Count - 1))])
  $ids = ($chunk | ForEach-Object { "$($_.sourceId)" }) -join ','
  $batchNumber = [Math]::Floor($i / $chunkSize) + 1
  $batchTotal = [Math]::Ceiling($withInstagram.Count / $chunkSize)
  Write-Log "Lote $batchNumber/$batchTotal - sourceIds: $ids"

  $output = & node $scriptPath --apply --json --source-ids=$ids 2>&1
  $exitCode = $LASTEXITCODE
  Add-Content -LiteralPath $logPath -Value $output

  if ($exitCode -ne 0) {
    Write-Log "Falha no lote $batchNumber com exit code $exitCode"
    exit $exitCode
  }

  Write-Log "Lote $batchNumber concluido."
}

Write-Log "Importacao por Instagram concluida."
