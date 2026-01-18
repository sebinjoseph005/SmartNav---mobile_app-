import { Request, Response } from 'express';
import { MapsAPIService } from '../../services/external/MapsAPI.service';

export class PlacesController {
  static async search(req: Request, res: Response) {
    const { q, lat, lon, categories } = req.query;

    const data = await MapsAPIService.getPlacesByCategory(
      Number(lat),
      Number(lon),
      categories as string || ''
    );

    res.json(data);
  }
}
