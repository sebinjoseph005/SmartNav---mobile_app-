import { Request, Response } from "express";
import { ItineraryService } from "../../services/trip/Itinerary.service";

export const generateItinerary = async (req: Request, res: Response) => {
  try {
    console.log('\n\n');
    console.log('========================================');
    console.log('📥 ITINERARY REQUEST RECEIVED');
    console.log('========================================');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('========================================\n');
    
    const result = await ItineraryService.generateTrip(req.body);
    
    console.log('\n========================================');
    console.log('✅ ITINERARY GENERATED SUCCESSFULLY');
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('========================================\n\n');
    
    res.json({ itinerary: result });
  } catch (error: any) {
    console.error('\n========================================');
    console.error('❌ ERROR GENERATING ITINERARY');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('========================================\n');
    
    res.status(500).json({ 
      error: 'Failed to generate itinerary',
      message: error.message 
    });
  }
};
