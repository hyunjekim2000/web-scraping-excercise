import express, { Request, Response } from 'express';
import { scrapeZillowListings } from './scraper';

const app = express();
const port = 3000;

app.use(express.json());

app.get('/scrape', async (req: Request, res: Response): Promise<void> => {
  try {
    const city = req.query.city as string;
    if (!city) {
      res.status(400).json({ error: "City is required. Example: /scrape?city=chicago-il" });
      return;
    }

    const url = `https://www.zillow.com/${city}/`;
    console.log(`Fetching data from: ${url}`);

    const data = await scrapeZillowListings(url);
    console.log("Scraped Data:", data);

    res.json({
      message: "Successfully scraped Zillow home listings!",
      listings: data,
    });
  } catch (error) {
    console.error("Error during Zillow scraping:", error);
    res.status(500).json({ error: "Error during scraping" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
