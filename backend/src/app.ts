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
- You ALREADY know the user's location based on the data below. NEVER ask them where they are.
${context?.location ? `- Current location: ${context.location}` : '- Location: not shared'}
${context?.coordinates ? `- Exact GPS Coordinates: Latitude ${context.coordinates.lat}, Longitude ${context.coordinates.lon}` : ''}
${context?.weather ? `- Weather: ${context.weather}` : ''}
${context?.nearbyScams ? `- Nearby scam reports: ${context.nearbyScams}` : '- No scam reports nearby'}
${context?.savedTrips ? `- Saved Trips Data: ${JSON.stringify(context.savedTrips)}` : ''}

CAPABILITIES & RULES:
- CRITICAL: You are STRICTLY a travel and navigation assistant. NEVER answer questions outside of travel, local culture, safety, navigation, or app features.
- CRITICAL: If asked something off-topic (e.g., coding, math, general history not related to a place, politics), you MUST reply: "I'm your SmartNav travel companion! I can only help with travel, safety, and local recommendations."
- CRITICAL: DO NOT hallucinate. If you do not know the answer or a specific place, honestly say "I don't have information on that specific place/topic."
- Safety advice (scam awareness, solo travel tips, emergency info)
- Local recommendations (food, attractions, hidden gems)
- Trip planning tips (best times to visit, budget advice)
- Cultural etiquette and local customs
- Weather-based activity suggestions
- CRITICAL RULE FOR SAVED TRIPS: You have access to the user's saved trips data above. DO NOT mention these trips proactively. Only talk about their saved trips if the user EXPLICITLY asks about them.
- CRITICAL RULE FOR LOCATION: If the user asks "where am I" or asks for nearby places without specifying a city, you MUST implicitly use the "Current location" and "Exact GPS Coordinates" provided in your context. Do not act like you don't know their location.
- CRITICAL RULE FOR DISTANCES: When calculating travel distances or estimated drive times, rely on the exact coordinates provided above rather than just the city name.

Always prioritize safety. If asked about a dangerous area, be honest but not alarmist.`;

  let dynamicPlacesText = '';
  if (context?.coordinates && /(nearest|nearby|closest|any).*(college|university|school|hospital|clinic|pharmacy)/i.test(message)) {
    try {
      const { MapsAPIService } = await import('./services/external/MapsAPI.service');
      const match = message.match(/(college|university|school|hospital|clinic|pharmacy)/i);
      if (match) {
        const cat = match[0].toLowerCase();
        // Use 25km (25000) radius for local essential places rather than default 50km
        const nearbyPlaces = await MapsAPIService.getPlacesByCategory(context.coordinates.lat, context.coordinates.lon, cat, 25000);
        if (nearbyPlaces.length > 0) {
          dynamicPlacesText = `\n\nCRITICAL CONTEXT FROM LIVE MAP DETECTED FOR QUERY "${cat}":\nHere are the REAL, EXACT matches near the user's coordinates right now, sorted by distance: ${JSON.stringify(nearbyPlaces.slice(0, 5))}. ALWAYS use these real places instead of guessing. Remember to still answer general queries about other cities using your own knowledge!`;
        } else {
          dynamicPlacesText = `\n\nCRITICAL CONTEXT FROM LIVE MAP DETECTED FOR QUERY "${cat}":\nThere are no ${cat}s found reliably on the map near the user's coordinates. Let the user know, but feel free to suggest places from your own knowledge if they ask about a DIFFERENT city entirely.`;
        }
      }
    } catch (err) {
      console.error('Failed to inject nearby places:', err);
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
