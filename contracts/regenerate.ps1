<#
.SYNOPSIS
    Regenerates contracts/openapi.json from the running API.

.DESCRIPTION
    The committed spec is what the UI project generates its client types from, so it has to be
    refreshed whenever a controller signature or a DTO changes. Nothing enforces that automatically —
    if this is not run, the UI keeps building against a shape the API no longer returns.

    The spec is served only in Development (Program.cs guards MapOpenApi), so this starts the API in
    that environment, fetches the document, writes it, and stops the API again.

    The JWT secret is environment-only and the app refuses to start without one. The throwaway value
    below never signs anything a client sees — the process is killed as soon as the document is
    fetched — so it is deliberately not a real secret.

.EXAMPLE
    ./contracts/regenerate.ps1
#>

[CmdletBinding()]
param(
    [int]$Port = 5199,
    [string]$OutFile = "$PSScriptRoot/openapi.json"
)

$ErrorActionPreference = 'Stop'

<#
.SYNOPSIS
    Rewrites the generated stats block in API-CONTEXT.md.

.DESCRIPTION
    The counts are useful orientation for whoever picks up the UI -- how big is this API, how much of
    it is permission-gated -- but a number typed into prose is wrong the next time an endpoint is
    added, and nothing catches it. Written from the document instead, between markers, so refreshing
    the spec refreshes the prose with it.
#>
function Update-ContextStats
{
    param($Spec, [int]$PathCount, [int]$OperationCount, [string]$ContextFile = "$PSScriptRoot/API-CONTEXT.md")

    if (-not (Test-Path $ContextFile))
    {
        Write-Warning "$ContextFile not found; skipping the stats block."
        return
    }

    $withPermission = 0
    $anonymous = 0
    $signedInOnly = 0
    $methods = 'get', 'post', 'put', 'delete', 'patch'

    foreach ($path in $Spec.paths.PSObject.Properties)
    {
        foreach ($op in $path.Value.PSObject.Properties)
        {
            if ($op.Name -notin $methods) { continue }

            $keys = $op.Value.PSObject.Properties.Name

            if ($keys -contains 'x-required-permission') { $withPermission++ }
            elseif ($keys -contains 'x-anonymous')       { $anonymous++ }
            else                                         { $signedInOnly++ }
        }
    }

    $schemaCount = @($Spec.components.schemas.PSObject.Properties).Count

    $enumCount = @($Spec.components.schemas.PSObject.Properties |
        Where-Object { $_.Value.PSObject.Properties.Name -contains 'enum' }).Count

    $block = @"
| | |
|---|---|
| Version | OpenAPI $($Spec.openapi) |
| Paths | $PathCount |
| Operations | $OperationCount |
| Schemas | $schemaCount |
| Permission-gated operations | $withPermission |
| Anonymous operations | $anonymous |
| Signed-in, no permission | $signedInOnly |
| Enums with named values | $enumCount |

"@

    $begin = '<!-- BEGIN GENERATED contract-stats'
    $end = '<!-- END GENERATED contract-stats -->'

    $text = [System.IO.File]::ReadAllText($ContextFile)

    $beginIndex = $text.IndexOf($begin)
    $endIndex = $text.IndexOf($end)

    if ($beginIndex -lt 0 -or $endIndex -lt $beginIndex)
    {
        Write-Warning 'The contract-stats markers were not found; skipping the stats block.'
        return
    }

    # Keep the whole BEGIN comment line, replace only what sits between the markers.
    $beginLineEnd = $text.IndexOf("`n", $beginIndex) + 1

    $updated = $text.Substring(0, $beginLineEnd) + $block + $text.Substring($endIndex)

    [System.IO.File]::WriteAllText($ContextFile, $updated, [System.Text.UTF8Encoding]::new($false))

    Write-Host "Updated the stats block in $ContextFile"
}

$api = Join-Path $PSScriptRoot '../Barkfield.Administration.API'
$url = "http://localhost:$Port/openapi/v1.json"

$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:ASPNETCORE_URLS = "http://localhost:$Port"
$env:JwtSettings__Secret = 'local-only-throwaway-key-for-generating-the-openapi-spec-0123456789'

Write-Host "Starting the API on port $Port..."

$proc = Start-Process dotnet -ArgumentList 'run', '--no-launch-profile', '--project', $api `
    -PassThru -NoNewWindow

try
{
    $spec = $null

    # The first run after a change includes a build, so allow a generous window.
    foreach ($attempt in 1..60)
    {
        Start-Sleep -Seconds 1

        if ($proc.HasExited)
        {
            throw "The API exited with code $($proc.ExitCode) before serving the spec."
        }

        try
        {
            $spec = Invoke-RestMethod -Uri $url -TimeoutSec 5
            break
        }
        catch
        {
            # Not up yet.
        }
    }

    if ($null -eq $spec) { throw "The spec was not served at $url within 60 seconds." }

    # WriteAllText with an explicit no-BOM encoding, NOT Set-Content -Encoding utf8: in Windows
    # PowerShell 5.1 that writes a byte-order mark, and a BOM makes this file unparseable by
    # JSON.parse and by most client generators -- which is the only thing it exists for.
    $json = $spec | ConvertTo-Json -Depth 100
    [System.IO.File]::WriteAllText($OutFile, $json, [System.Text.UTF8Encoding]::new($false))

    $operations = ($spec.paths.PSObject.Properties |
        ForEach-Object { $_.Value.PSObject.Properties.Name } |
        Where-Object { $_ -in 'get', 'post', 'put', 'delete', 'patch' }).Count

    Write-Host "Wrote $OutFile"
    $pathCount = @($spec.paths.PSObject.Properties).Count
    Write-Host "  $pathCount paths, $operations operations"

    Update-ContextStats -Spec $spec -PathCount $pathCount -OperationCount $operations
}
finally
{
    if (-not $proc.HasExited)
    {
        Write-Host 'Stopping the API...'
        Stop-Process -Id $proc.Id -Force
    }
}
