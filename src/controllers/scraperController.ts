import { Request, Response } from 'express';
import { scrapeZillowListings } from '../services/scraperService';

export const getZillowListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const city = req.query.city as string;
    if (!city) {
      res.status(400).json({ error: "City is required. Example: /scrape?city=chicago-il" });
      return;
    }

    const url = `https://www.zillow.com/${city}/`;
    console.log(`Fetching data from: ${url}`);

    const data = await scrapeZillowListings(url);

    if (data.length === 0) {
      res.status(403).json({
        error: "Bot detected, please try again",
      });
      return;
    }

    console.log("Scraped Data:", data);

    res.json({
      message: `Successfully scraped ${data.length} home listings for ${city}!`,
      listings: data,
    });
  } catch (error) {
    console.error("Error during Zillow scraping:", error);
    res.status(500).json({ error: "Error during scraping" });
  }
};