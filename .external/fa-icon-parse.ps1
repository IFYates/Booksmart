$result = @{
}

$icons = (ConvertFrom-Json (Get-Content "$PSScriptRoot/icons.json" -Raw) -AsHashtable)
Write-Host "Icon definition: $($icons.Count)"

$icons.Keys | ?{ $icons[$_].free?.Count -gt 0 } | %{
    $key = "fa-$_"
    $icon = $icons[$_]
    $result[$key] = @()
    if ($icon.styles.Contains('brands')) {
        $result[$key] += 'fab'
    }
    if ($icon.styles.Contains('solid')) {
        $result[$key] += 'fas'
    }
    if ($icon.styles.Contains('regular')) {
        $result[$key] += 'far'
    }
    if ($result[$key].Count -eq 0) {
        $result.Remove($key)
    }
}

Write-Host "Icon items: $(($result.Values.Length | Measure-Object -Sum).Sum)"
Set-Clipboard -Value (ConvertTo-Json $result -Depth 99 -Compress)