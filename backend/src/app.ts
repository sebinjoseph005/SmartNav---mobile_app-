import express from 'express';
import cors from 'cors';

const app = express();

/* -------------------- GLOBAL MIDDLEWARE -------------------- */

// Enable CORS for mobile app
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- ROUTES -------------------- */

// Import controllers
import { PlacesController } from './controllers/maps/Places.controller';
import { generateItinerary } from './controllers/trip/Itinerary.controller';

// Async error wrapper
const asyncHandler = (fn: any) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// API Routes
app.get('/api/places/search', asyncHandler(PlacesController.search));

// AI Trip Generation - Uses Groq AI + Real Places
app.post('/api/trip/generate', asyncHandler(generateItinerary));

// AI Travel Companion Chat
app.post('/api/ai/companion', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { message, history, context } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  const Groq = (await import('groq-sdk')).default;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'AI not configured' });
  }

  const client = new Groq({ apiKey });

  const systemPrompt = `You are SmartNav AI, a friendly and knowledgeable travel companion built into the SmartNav mobile app. You help tourists with safety advice, local insights, trip planning, and general travel questions.

PERSONALITY:
- Warm, concise, and helpful — like a local friend
- Use emojis occasionally to keep it friendly
- Keep responses SHORT (2-4 paragraphs max)
- Be specific and actionable, not generic

CONTEXT ABOUT THE USER:
- You ALREADY know the user's location based on the data below. NEVER ask them where they are. If the user asks for their location, you MUST tell them using this data.
${context?.location ? `- Current location: ${context.location}` : '- Location string: not available but you can use coordinates'}
${context?.coordinates ? `- Exact GPS Coordinates: Latitude ${context.coordinates.lat}, Longitude ${context.coordinates.lon}` : ''}
${context?.weather ? `- Weather: ${context.weather}` : ''}
${context?.nearbyScams ? `- Nearby scam reports: ${context.nearbyScams}` : '- No scam reports nearby'}
${context?.savedTrips ? `- Saved Trips Data: ${JSON.stringify(context.savedTrips)}` : ''}

CAPABILITIES & RULES:
- CRITICAL: You are STRICTLY a travel and navigation assistant. NEVER answer questions outside of travel, local culture, safety, navigation, or app features. Answering questions about the user's current location is ALWAYS ALLOWED.
- CRITICAL: If asked something off-topic (e.g., coding, math, general history not related to a place, politics), you MUST reply: "I'm your SmartNav travel companion! I can only help with travel, safety, and local recommendations."
- CRITICAL: DO NOT hallucinate. If you do not know the answer or a specific place, honestly say "I don't have information on that specific place/topic."
- Safety advice (scam awareness, solo travel tips, emergency info)
- Local recommendations (food, attractions, hidden gems)
- Trip planning tips (best times to visit, budget advice)
- Cultural etiquette and local customs
- Weather-based activity suggestions
- CRITICAL RULE FOR SAVED TRIPS: You have access to the user's saved trips data above. DO NOT mention these trips proactively. Only talk about their saved trips if the user EXPLICITLY asks about them.
- CRITICAL RULE FOR LOCATION: If the user asks "where am I" or asks for their location, you MUST explicitly answer with the "Current location" and "Exact GPS Coordinates" provided in your context. Do not act like you don't know their location.
- CRITICAL RULE FOR DISTANCES: When calculating travel distances or estimated drive times, rely on the exact coordinates provided above rather than just the city name.

Always prioritize safety. If asked about a dangerous area, be honest but not alarmist.`;

  let dynamicPlacesText = '';
  if (context?.coordinates && /(nearest|nearby|closest|any|find|where is|where are|show me|looking for)/i.test(message)) {
    try {
      const { MapsAPIService } = await import('./services/external/MapsAPI.service');

      // Map common user terms → OSM category tags
      const placeTypeMap: Record<string, string> = {
        // Accommodation
        hotel: 'hotel', hotels: 'hotel', motel: 'motel', hostel: 'hostel', hostels: 'hostel',
        guesthouse: 'guest_house', 'guest house': 'guest_house', lodge: 'hotel', resort: 'hotel',
        airbnb: 'hotel', accommodation: 'hotel',
        // Food & drink
        restaurant: 'restaurant', restaurants: 'restaurant', cafe: 'cafe', cafes: 'cafe',
        coffee: 'cafe', 'coffee shop': 'cafe', bar: 'bar', bars: 'bar', pub: 'pub',
        bakery: 'bakery', 'fast food': 'fast_food', 'food court': 'food_court',
        canteen: 'restaurant', dhaba: 'restaurant', mess: 'restaurant',
        // Education
        college: 'college', university: 'university', school: 'school', institute: 'college',
        campus: 'university',
        // Health
        hospital: 'hospital', clinic: 'clinic', pharmacy: 'pharmacy', chemist: 'pharmacy',
        'medical store': 'pharmacy', doctor: 'clinic', 'medical college': 'hospital',
        // Finance
        atm: 'atm', bank: 'bank', banks: 'bank',
        // Transport
        'bus stop': 'bus_stop', 'bus stand': 'bus_stop', 'metro station': 'subway_entrance',
        metro: 'subway_entrance', station: 'train_station', 'railway station': 'train_station',
        airport: 'aerodrome', taxi: 'taxi', 'auto stand': 'taxi',
        parking: 'parking', 'petrol station': 'fuel', 'petrol pump': 'fuel', 'fuel station': 'fuel',
        // Shopping
        supermarket: 'supermarket', 'grocery store': 'supermarket', mall: 'mall',
        market: 'market', shop: 'shop', store: 'supermarket',
        // Recreation & religion
        park: 'park', garden: 'park', playground: 'playground', gym: 'gym',
        temple: 'temple', mosque: 'mosque', church: 'church', gurudwara: 'place_of_worship',
        // Services
        'police station': 'police', police: 'police', 'fire station': 'fire_station',
        'post office': 'post_office', library: 'library', museum: 'museum',
        cinema: 'cinema', theatre: 'theatre', theater: 'theatre',
      };

      // Extract the place type — check multi-word phrases first (longest match wins)
      const msgLower = message.toLowerCase();
      let cat: string | null = null;
      let rawTerm: string | null = null;

      const sortedKeys = Object.keys(placeTypeMap).sort((a, b) => b.length - a.length);
      for (const key of sortedKeys) {
        if (msgLower.includes(key)) {
          cat = placeTypeMap[key];
          rawTerm = key;
          break;
        }
      }

      // Fallback: extract noun after trigger words
      if (!cat) {
        const extracted = message.match(
          /(?:nearest|nearby|closest|find|looking for|show me|where(?:'s| is| are)?)\s+(?:a\s+|an\s+|the\s+)?([a-zA-Z\s]{2,25})(?:\s+near|\s+around|\s+close|\?|$)/i
        );
        if (extracted) {
          rawTerm = extracted[1].trim().toLowerCase();
          cat = rawTerm;
        }
      }

      if (cat) {
        const nearbyPlaces = await MapsAPIService.getPlacesByCategory(
          context.coordinates.lat, context.coordinates.lon, cat, 25000
        );
        if (nearbyPlaces.length > 0) {
          dynamicPlacesText = `\n\nCRITICAL CONTEXT FROM LIVE MAP DETECTED FOR QUERY "${rawTerm}":\nHere are the REAL, EXACT matches near the user's coordinates right now, sorted by distance: ${JSON.stringify(nearbyPlaces.slice(0, 5))}. ALWAYS use these real places instead of guessing. Remember to still answer general queries about other cities using your own knowledge!`;
        } else {
          dynamicPlacesText = `\n\nCRITICAL CONTEXT FROM LIVE MAP DETECTED FOR QUERY "${rawTerm}":\nThere are no "${rawTerm}" found reliably on the map near the user's coordinates. Let the user know honestly, but feel free to suggest places from your own knowledge if they ask about a DIFFERENT city entirely.`;
        }
      }
    } catch (err: any) {
      console.warn(`⚠️ Could not inject live map data. Reason: ${err.message || 'Timeout'}`);
    }
  }

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.75,
    max_tokens: 800,
    messages: [
      { role: 'system', content: systemPrompt + dynamicPlacesText },
      ...(history || []),
      { role: 'user', content: message },
    ],
  });

  const reply = response.choices[0]?.message?.content || 'Sorry, I couldn\'t process that right now.';
  res.json({ success: true, reply });
}));

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend API is working!',
    timestamp: new Date().toISOString(),
    env: {
      usingOpenStreetMap: true, // No API key needed!
      hasGroqKey: !!process.env.GROQ_API_KEY,
      groqKeyLength: process.env.GROQ_API_KEY?.length || 0,
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  });
});

// Test OpenStreetMap API
app.get('/api/test/osm', async (req, res) => {
  try {
    const { MapsAPIService } = await import('./services/external/MapsAPI.service');
    // Test with Delhi coordinates
    const places = await MapsAPIService.getPlacesByCategory(28.6139, 77.2090, 'museum,attraction,restaurant');
    res.json({
      success: true,
      source: 'OpenStreetMap Overpass API',
      placesCount: places.length,
      samplePlaces: places.slice(0, 5).map((p: any) => ({ name: p.name, category: p.categories, distance: `${p.distance?.toFixed(1)}km` }))
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint - Groq/OpenAI
app.get('/api/test/openai', async (req, res) => {
  try {
    const { OpenAIService } = await import('./services/ai/OpenAI.service');
    const testPrompt = 'Generate a simple JSON object with a welcome message for Delhi travel';
    const result = await OpenAIService.generateItineraryJson(testPrompt);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* -------------------- HEALTH CHECK -------------------- */

app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'SmartNav backend is running 🚀',
  });
});

/* -------------------- ERROR HANDLER -------------------- */

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Error:', err);
  console.error('❌ Error stack:', err?.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

export default app;
