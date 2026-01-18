# 🚀 SETUP INSTRUCTIONS - READ THIS FIRST!

## ⚠️ CRITICAL: Update Your IP Address

Your mobile app **CANNOT connect to the backend** until you update your computer's IP address.

### Step-by-Step Instructions:

1. **Find Your Computer's IP Address:**
   - Press `Windows Key + R`
   - Type `cmd` and press Enter
   - Type `ipconfig` and press Enter
   - Look for **"IPv4 Address"** under your Wi-Fi or Ethernet adapter
   - It will look like: `192.168.x.x` (example: `192.168.0.105`)

2. **Update the Frontend Code:**
   - Open file: `frontend/src/services/api.ts`
   - Go to **Line 13**
   - Replace `'YOUR_IP_HERE'` with your actual IP
   - Example: `const LOCAL_IP = '192.168.0.105';`
   - Save the file

3. **Start the Backend Server:**
   - Open a terminal
   - Navigate to: `cd backend`
   - Run: `npm run dev`
   - You should see: `🚀 Server running on http://localhost:3000`

4. **Start the Mobile App:**
   - Open another terminal
   - Navigate to: `cd frontend`
   - Run: `npm start` or `expo start`
   - Press `a` for Android or `i` for iOS
   - The app should now connect to your backend!

## ✅ How to Test It's Working:

1. Open the mobile app
2. Go to "Trip" tab
3. Enter a destination (e.g., "Paris")
4. Select dates and budget
5. Choose your interests
6. Tap "Generate with AI"
7. You should see personalized activities based on your interests!

## 🎯 What Changed:

- ✅ **Backend now generates data instantly** - No external API calls
- ✅ **Activities match your interests** - Picks from History, Food, Nature, Adventure, Shopping, or Relaxation
- ✅ **Budget-aware planning** - Distributes costs across days
- ✅ **Fast loading** - No delays from third-party APIs
- ✅ **Always works** - No API key requirements

## ❓ Troubleshooting:

**"Network request failed" error:**
- Make sure you updated LOCAL_IP in `api.ts`
- Make sure backend is running (`npm run dev` in backend folder)
- Make sure your phone and computer are on the **same Wi-Fi network**

**"Cannot connect" error:**
- Check if backend shows: `📡 Network access: http://0.0.0.0:3000`
- Try restarting the backend server
- Check Windows Firewall isn't blocking port 3000

**Backend shows errors:**
- Make sure you're in the backend folder when running `npm run dev`
- Check that all dependencies are installed: `npm install`

## 📱 Current Features:

- ✅ Destination search with autocomplete
- ✅ Date selection (From/To dates)
- ✅ Budget input with slider (max ₹2 lakh)
- ✅ Interest selection (6 categories)
- ✅ AI itinerary generation from backend
- ✅ Multi-day trip planning
- ✅ Activity costs and durations
- ✅ Ratings and badges for activities

---

**Need Help?** Check the console logs in:
- Backend terminal (shows API requests)
- Expo terminal (shows mobile app logs)
- Mobile app console (React Native debugger)
