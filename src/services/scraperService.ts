import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Listing } from '../interfaces/listing';
import { getRandomUserAgent } from '../utils/getRandomUserAgent';
import { delay } from '../utils/delay';

puppeteer.use(StealthPlugin());

export async function scrapeZillowListings(url: string): Promise<Listing[]> {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-setuid-sandbox',
      '--disable-gpu',
    ],
  });

  // Pick random user agent to reduce bot detection in subsequent uses
  const page = await browser.newPage();
  await page.setUserAgent(getRandomUserAgent());

  console.log(`Navigating to: ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  let listings: Listing[] = [];
  let hasNext = true;
  let pageNumber = 1;

  while (hasNext) {
    console.log(`Scraping page ${pageNumber}...`);

    const results = await page.evaluate(() => {
      return [...document.querySelectorAll('[data-test="property-card"]')].map(card => {
        const price = card.querySelector('[data-test="property-card-price"]')?.textContent?.trim() || 'N/A';
        const address = card.querySelector('[data-test="property-card-addr"]')?.textContent?.trim() || 'N/A';
        const link = card.querySelector('a')?.href || 'N/A';

        // The detailsElement contains an unordered list (ul) with list items (li)
        // Each list item (li) has a <b> tag containing one of the details:
        // - The first <li> contains the number of bedrooms (e.g., <li><b>3</b> bds</li>)
        // - The second <li> contains the number of bathrooms (e.g., <li><b>2</b> ba</li>)
        // - The third <li> contains the square footage (e.g., <li><b>1,200</b> sqft</li>)
        const detailsElement = card.querySelector('ul[class^="StyledPropertyCardHomeDetailsList"]');
        const [beds, baths, sqft] = detailsElement 
          ? [...detailsElement.querySelectorAll('li')].map(item => item.querySelector('b')?.textContent?.trim() || 'N/A') 
          : ['N/A', 'N/A', 'N/A'];
        
        return {
          price,
          address,
          bedrooms: beds[0],
          baths: baths[1],
          sqft: sqft[2],
          link,
        };
      });
    });

    listings.push(...results);
    console.log(`Extracted ${results.length} listings from page ${pageNumber}.`);

    // Needed to properly fetch all pagination results
    await delay(2000);

    const nextButton = await page.$('a[title="Next page"], button[aria-label="Next page"]');

    if (!nextButton) {
      console.log(`No more pages found. Stopping pagination at page ${pageNumber}.`);
      hasNext = false;
      break;
    }

    console.log(`Navigating to page ${pageNumber + 1}...`);
    await nextButton.click();
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {
      console.log("Navigation timeout, assuming last page reached.");
      hasNext = false;
      return;
    });

    pageNumber++;
  }

  console.log(`Total scraped listings: ${listings.length}.`);
  await browser.close();
  return listings;
}