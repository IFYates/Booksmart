$Version = (Get-Content "$PSScriptRoot/src/manifest.json" -Raw | ConvertFrom-Json).version
Write-Host "Packaging Booksmart v$Version"

$dest = "$PSScriptRoot/v$Version.zip"
if (Test-Path $dest) {
    Write-Warning "Package already exists for v$Version"
    $inp = (Read-Host -Prompt "Do you want to overwrite it? [Yn]")
    $inp = "$inp".Trim().ToLower()
    if ($inp -eq 'n' -or $inp -eq 'no') {
        exit
    }
}

$info = (Get-Content "$PSScriptRoot/src/code/ui/dialog/info.js" -Raw)
if ($info -match '(?m)\/\*\$date\*\/.*$') {
    $info = $info.Replace($Matches[0], "/*`$date*/'v$Version $(Get-Date -Format 'MMMM yyyy')'")
    Set-Content "$PSScriptRoot/src/code/ui/dialog/info.js" $info -NoNewline
}

Write-Output "Compressing..."
Compress-Archive -Path "$PSScriptRoot/src/*" -DestinationPath $dest -Force
Write-Output "Compressed to $dest"