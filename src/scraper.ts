import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

interface Listing {
  price: string;
  address: string;
  bedrooms: string;
  baths: string;
  sqft: string;
  link: string;
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomUserAgent(): string {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; rv:109.0) Gecko/20100101 Firefox/109.0',
    'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:58.0) Gecko/20100101 Firefox/58.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:65.0) Gecko/20100101 Firefox/65.0',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36 Edge/18.18362',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0',
    'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:62.0) Gecko/20100101 Firefox/62.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:62.0) Gecko/20100101 Firefox/62.0',
    'Mozilla/5.0 (X11; Linux x86_64; rv:62.0) Gecko/20100101 Firefox/62.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:61.0) Gecko/20100101 Firefox/61.0',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36 Edge/14.14393',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36 Edge/17.17134'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

export async function scrapeZillowListings(url: string): Promise<Listing[]> {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process'
    ],
  });

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
        let beds = 'N/A', baths = 'N/A', sqft = 'N/A';

        const detailsElement = card.querySelector('.StyledPropertyCardHomeDetailsList-c11n-8-107-0__sc-1j0som5-0');
        if (detailsElement && detailsElement instanceof HTMLElement) {
          const detailsArray = detailsElement.querySelectorAll('li');
          if (detailsArray[0]) {
            beds = detailsArray[0].querySelector('b')?.textContent?.trim() || 'N/A';
          }
          if (detailsArray[1]) {
            baths = detailsArray[1].querySelector('b')?.textContent?.trim() || 'N/A';
          }
          if (detailsArray[2]) {
            sqft = detailsArray[2].querySelector('b')?.textContent?.trim() || 'N/A';
          }
        }

        return {
          price: card.querySelector('[data-test="property-card-price"]')?.textContent?.trim() || 'N/A',
          address: card.querySelector('[data-test="property-card-addr"]')?.textContent?.trim() || 'N/A',
          bedrooms: beds,
          baths: baths,
          sqft: sqft,
          link: card.querySelector('a')?.href || 'N/A',
        };
      });
    });

    listings.push(...results);
    console.log(`Extracted ${results.length} listings from page ${pageNumber}.`);

    await delay(2000);

    const nextButton = await page.$('a[title="Next page"], button[aria-label="Next page"]');
    if (!nextButton) {
      console.log(`No more pages found. Stopping pagination at page ${pageNumber}.`);
      hasNext = false;
      break;
    }

    console.log(`➡️ Navigating to page ${pageNumber + 1}...`);
    await nextButton.click();
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {
      console.log("Navigation timeout, assuming last page reached.");
      hasNext = false;
      return;
    });

    pageNumber++;
  }

  console.log(`Total scraped listings: ${listings.length}.`);

  fs.writeFileSync('listings.json', JSON.stringify({ listings }, null, 2));

  await browser.close();
  return listings;
}
