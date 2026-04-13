@echo off
echo Testing Commentary Broadcasting
echo ===============================

echo Step 1: Login to get JWT token
curl -X POST http://localhost:8000/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"test-user\",\"email\":\"test@example.com\"}"

echo.
echo Step 2: Create a match (replace TOKEN with actual JWT)
echo curl -X POST http://localhost:8000/matches ^
echo   -H "Content-Type: application/json" ^
echo   -H "Authorization: Bearer TOKEN" ^
echo   -d "{\"sport\":\"football\",\"homeTeam\":\"Team A\",\"awayTeam\":\"Team B\",\"startTime\":\"2024-01-01T15:00:00Z\",\"endTime\":\"2024-01-01T17:00:00Z\"}"

echo.
echo Step 3: In another terminal, connect to WebSocket and subscribe
echo wscat -c "ws://localhost:8000/ws?token=TOKEN"
echo Then send: {"type":"subscribe","matchId":1}

echo.
echo Step 4: Create commentary (replace TOKEN and match ID)
echo curl -X POST http://localhost:8000/matches/1/commentary ^
echo   -H "Content-Type: application/json" ^
echo   -H "Authorization: Bearer TOKEN" ^
echo   -d "{\"minutes\":45,\"message\":\"Great goal!\",\"eventType\":\"goal\",\"actor\":\"Player X\",\"team\":\"Team A\"}"

echo.
echo You should see the commentary broadcast in the WebSocket terminal!