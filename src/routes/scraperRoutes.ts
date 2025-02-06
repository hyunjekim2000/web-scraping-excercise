import { Router } from 'express';
import { getZillowListings } from '../controllers/scraperController';

const router = Router();

router.get('/', getZillowListings);

export { router as scraperRoutes };