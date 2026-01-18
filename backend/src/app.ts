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

// API Routes
app.get('/api/places/search', PlacesController.search);
app.post('/api/trip/generate', generateItinerary);

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend API is working!',
    timestamp: new Date().toISOString()
  });
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

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
