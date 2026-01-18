import { Router } from 'express';
import { PlacesController } from '../controllers/maps/Places.controller';

const router = Router();

// Places routes
router.get('/places/search', PlacesController.search);

export default router;