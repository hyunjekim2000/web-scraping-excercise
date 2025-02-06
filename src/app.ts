import express from 'express';
import { scraperRoutes } from './routes/scraperRoutes';

const app = express();
app.use(express.json());

app.use('/scrape', scraperRoutes);

export { app };