import { Router } from 'express';
import { PlacesController } from '../../controllers/maps/Places.controller';

const router = Router();

router.get('/search', PlacesController.search);

export default router;
