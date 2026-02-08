# Test the backend trip generation API
$body = @{
    destination = 'Kochi'
    lat = 9.9312
    lon = 76.2673
    fromDate = '2026-02-01'
    toDate = '2026-02-03'
    travelers = 2
    budget = 3000
    currency = 'INR'
    interests = @('Food', 'History')
} | ConvertTo-Json

Write-Host "Sending request to backend..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/trip/generate' -ContentType 'application/json' -Body $body
    
    Write-Host "`n✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Destination: $($response.itinerary.destination)"
    Write-Host "Days: $($response.itinerary.days)"
    Write-Host "Source: $($response.itinerary.source)" -ForegroundColor Yellow
    Write-Host "Mock Data: $($response.itinerary.isMockData)"
    Write-Host "Timeline Days: $($response.itinerary.timeline.Count)"
    
    if ($response.itinerary.timeline[0].activities) {
        Write-Host "`nDay 1 Activities: $($response.itinerary.timeline[0].activities.Count)"
        Write-Host "First activity: $($response.itinerary.timeline[0].activities[0].title)"
    }
} catch {
    Write-Host "`n❌ ERROR: $_" -ForegroundColor Red
}
