$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer sk-ant-api03-6ZrSBaEmEpVm0uzok9kO04K2Q1k47UfSPJnXYHUjLb7KUtD47s67O41l2C9x3Iy-xkECvcEBX8YG8Nmw-HNycTAAA"
    "anthropic-version" = "2023-06-01"
}

$body = @{
    "model" = "claude-3-sonnet-20240229"
    "max_tokens" = 1000
    "messages" = @(
        @{
            "role" = "user"
            "content" = "Testing. Just say hi and nothing else."
        }
    )
} | ConvertTo-Json -Depth 10

try {
    Write-Host "Sending request to Anthropic API..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "https://api.anthropic.com/v1/messages" -Method Post -Headers $headers -Body $body
    
    Write-Host "`nResponse received:" -ForegroundColor Green
    Write-Host $response.content[0].text -ForegroundColor Cyan
    
    Write-Host "`nFull response object:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 10
}
catch {
    Write-Host "Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "`nError details:" -ForegroundColor Red
        Write-Host $responseBody -ForegroundColor Red
    }
}