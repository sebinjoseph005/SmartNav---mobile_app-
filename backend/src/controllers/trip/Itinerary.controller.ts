import { Request, Response } from "express";
import { ItineraryService } from "../../services/trip/Itinerary.service";

export const generateItinerary = async (req: Request, res: Response) => {
  try {
    console.log('📥 Received itinerary request:', req.body);
    
    const result = await ItineraryService.generateTrip(req.body);
    
    console.log('✅ Itinerary generated successfully');
    res.json({ itinerary: result });
  } catch (error: any) {
    console.error('❌ Error generating itinerary:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate itinerary',
      message: error.message 
    });
  }
};
