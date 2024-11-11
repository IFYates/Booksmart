$result = [ordered]@{}
$emojis = ConvertFrom-Json (Get-Content "$PSScriptRoot/data-by-emoji.jsonc" -Raw -Encoding utf8) -AsHashtable
$emojis.Keys | %{ @{ name = $emojis[$_].name; emoji = $_ } } | Sort-Object { $_.name } | %{
    $result[$_.name] = $_.emoji
}
#Set-Content "$PSScriptRoot/emojis.json" -Value (ConvertTo-Json $result -Depth 99 -Compress) -Encoding utf8
Set-Clipboard -Value (ConvertTo-Json $result -Depth 99 -Compress)