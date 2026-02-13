# GET FOURSQUARE API KEY

## Quick Steps:

1. **Go to**: https://foursquare.com/developers/signup

2. **Sign up** with email or Google

3. **Create a new project**:
   - Project name: "SmartNav"
   - Click "Create Project"

4. **Copy your API key**:
   - Look for "API Keys" section
   - Copy the key (starts with `fsq3...`)

5. **Update `.env` file**:
   ```
   EXPO_PUBLIC_FOURSQUARE_API_KEY=fsq3YourKeyHere
   ```

6. **Restart Expo**:
   ```bash
   cd frontend
   npx expo start
   ```

## Alternative: Google Places API

If Foursquare doesn't work, use Google Places:

1. Go to: https://console.cloud.google.com
2. Create new project
3. Enable "Places API"
4. Create credentials (API Key)
5. Add to `.env`:
   ```
   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaYourKeyHere
   ```

---

**Note**: Both have free tiers. Foursquare is easier to set up (no billing required).
