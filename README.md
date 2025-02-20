# Zillow Web Scraper

This is a web scraper that fetches home listings from Zillow based on the city provided in the query. It uses Puppeteer to navigate and scrape data from Zillow's property listing pages.

## Features
- Scrapes Zillow property listings including price, address, number of bedrooms, baths, and square feet.
- Uses pagination to scrape all available listings and store as json in local directory. 

## Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/hyunjekim2000/web-scraping-excercise.git

3. Install dependencies:
   ```bash
   npm install

## How to Run
1. **Start the server**:
   ```bash
   npm run dev
3. **Use Postman or Terminal**:

   ```bash
   http://localhost:3000/scrape?city=chicago-il
   ```

   ```bash
   curl "http://localhost:3000/scrape?city=chicago-il"
   ```
   Replace `naperville-il` with the city of your choice.

4. **Check the response**:
   The server will respond with the following JSON object containing the scraped listings on success:
   ```json
   {
     "message": "Successfully scraped 49 home listings for naperville-il!",
     "listings": [
       {
         "price": "$459,900",
         "address": "1318 E Braymore Cir, Naperville, IL 60564",
         "bedrooms": "3",
         "sqft": "7",
         "link": "https://www.zillow.com/homedetails/1318-E-Braymore-Cir-Naperville-IL-60564/4522022_zpid/"
       },
       ...
     ]
   }
   ```
   You can also check your directory for listings.json that will contain the copy of the response. Note that this will overwrite on every subsequent calls. 
