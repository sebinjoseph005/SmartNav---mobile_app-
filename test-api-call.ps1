# Test the trip generation API
$body = @{
    destination = "Kochi"
    lat = 0
    lon = 0
    fromDate = "2026-01-20"
    toDate = "2026-01-22"
    travelers = 2
    budget = 3000
    currency = "INR"
    interests = @("Food", "History")
} | ConvertTo-Json

Write-Host "Testing API at http://localhost:3000/api/trip/generate"
Write-Host "Request body:" -ForegroundColor Cyan
Write-Host $body

try {
    $response = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/trip/generate" -ContentType "application/json" -Body $body
    
    Write-Host "`n✅ SUCCESS!" -ForegroundColor Green
    Write-Host "`nResponse:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    
    Write-Host "`n📊 Summary:" -ForegroundColor Yellow
    Write-Host "  Destination: $($response.itinerary.destination)"
    Write-Host "  Days: $($response.itinerary.days)"
    Write-Host "  Total Budget: $($response.itinerary.currency) $($response.itinerary.totalBudget)"
    Write-Host "  Timeline Days: $($response.itinerary.timeline.Count)"
    Write-Host "  First Activity: $($response.itinerary.timeline[0].activities[0].title)"
    Write-Host "  Source: $($response.itinerary.source)"
    Write-Host "  Is Mock Data: $($response.itinerary.isMockData)"
    
} catch {
    Write-Host "`n❌ ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseText = $reader.ReadToEnd()
        Write-Host "Response:" -ForegroundColor Red
        Write-Host $responseText
    }
}
