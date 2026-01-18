import { Router } from "express";
import { generateItinerary } from "../../controllers/trip/Itinerary.controller";

const router = Router();
router.post("/generate", generateItinerary);

export default router;
