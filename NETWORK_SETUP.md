# 🌐 Network Setup Instructions

## Find Your Computer's IP Address

### Windows:
1. Open Command Prompt (cmd)
2. Type: `ipconfig`
3. Look for "IPv4 Address" under your active network adapter
4. Example: `192.168.1.100`

### Example Output:
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.100  <-- THIS ONE
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
```

## Update the API URL

1. Copy your IPv4 address
2. Open: `frontend/src/services/api.ts`
3. Find line 7: `const LOCAL_IP = '192.168.1.100';`
4. Replace with YOUR IP address
5. Save the file

## Make Sure Backend is Accessible

1. Backend must listen on `0.0.0.0` (already configured ✅)
2. Run backend: `cd backend && npm run dev`
3. Should see:
   ```
   🚀 Server running on http://localhost:3000
   📡 Network access: http://0.0.0.0:3000
   ```

## Test the Connection

1. Open browser on your phone
2. Go to: `http://YOUR_IP:3000/api/test`
3. Should see: `{"status":"ok","message":"Backend API is working!"}`

If you see this, the API is working! ✅

## Common Issues

### Firewall Blocking
- Windows Firewall might block port 3000
- Allow Node.js through Windows Firewall

### Wrong Network
- Phone and computer must be on SAME WiFi network
- Check both devices are connected to same router

### Port Already in Use
- Kill any process using port 3000
- Restart backend server

## Current Setup

✅ Backend listening on all interfaces (0.0.0.0:3000)
✅ CORS enabled for all origins
✅ Test endpoint available at /api/test
✅ Structured itinerary generation
✅ Foursquare integration for real places

## What You'll Get from Backend

When working, you'll receive:
- 📍 Real places from Foursquare based on your destination
- 🎯 Activities filtered by your interests
- 💰 Costs calculated based on your budget
- 📅 Day-by-day itinerary with times and durations
- ⭐ Ratings and badges for each activity
