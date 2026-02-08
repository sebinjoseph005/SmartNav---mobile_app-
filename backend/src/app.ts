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

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend API is working!',
    timestamp: new Date().toISOString(),
    env: {
      hasFoursquareKey: !!process.env.FOURSQUARE_API_KEY,
      hasGroqKey: !!process.env.GROQ_API_KEY,
      foursquareKeyLength: process.env.FOURSQUARE_API_KEY?.length || 0,
      groqKeyLength: process.env.GROQ_API_KEY?.length || 0,
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  });
});

// Test Foursquare API directly
app.get('/api/test/foursquare', async (req, res) => {
  try {
    const { MapsAPIService } = await import('./services/external/MapsAPI.service');
    // Test with Delhi coordinates
    const places = await MapsAPIService.getPlacesByCategory(28.6139, 77.2090, '13000');
    res.json({ 
      success: true, 
      placesCount: places.length,
      samplePlaces: places.slice(0, 5).map((p: any) => ({ name: p.name, rating: p.rating }))
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
