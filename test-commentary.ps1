Write-Host "Testing Commentary Broadcasting" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

Write-Host "`nStep 1: Login to get JWT token" -ForegroundColor Yellow
Write-Host "curl -X POST http://localhost:8000/auth/login -H 'Content-Type: application/json' -d '{\"userId\":\"test-user\",\"email\":\"test@example.com\"}'" -ForegroundColor Cyan

Write-Host "`nStep 2: Create a match (replace TOKEN with actual JWT)" -ForegroundColor Yellow
Write-Host "curl -X POST http://localhost:8000/matches -H 'Content-Type: application/json' -H 'Authorization: Bearer TOKEN' -d '{\"sport\":\"football\",\"homeTeam\":\"Team A\",\"awayTeam\":\"Team B\",\"startTime\":\"2024-01-01T15:00:00Z\",\"endTime\":\"2024-01-01T17:00:00Z\"}'" -ForegroundColor Cyan

Write-Host "`nStep 3: In another terminal, connect to WebSocket and subscribe" -ForegroundColor Yellow
Write-Host "wscat -c 'ws://localhost:8000/ws?token=TOKEN'" -ForegroundColor Cyan
Write-Host "Then send: {'type':'subscribe','matchId':1}" -ForegroundColor White

Write-Host "`nStep 4: Create commentary (replace TOKEN and match ID)" -ForegroundColor Yellow
Write-Host "curl -X POST http://localhost:8000/matches/1/commentary -H 'Content-Type: application/json' -H 'Authorization: Bearer TOKEN' -d '{\"minutes\":45,\"message\":\"Great goal!\",\"eventType\":\"goal\",\"actor\":\"Player X\",\"team\":\"Team A\"}'" -ForegroundColor Cyan

Write-Host "`nYou should see the commentary broadcast in the WebSocket terminal!" -ForegroundColor Green