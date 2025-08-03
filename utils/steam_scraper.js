const puppeteer = require('puppeteer');

async function scrapeSteamSales() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
        const page = await browser.newPage();
        await page.goto('https://store.steampowered.com/search/?specials=1&cc=vn', {
            waitUntil: 'networkidle2',
            timeout: 60000,
        });

        const results = await page.evaluate(() => {
            const rows = document.querySelectorAll('#search_resultsRows > a');
            const items = [];

            for (const row of rows) {
                const title = row.querySelector('.search_name > span')?.textContent?.trim();
                const discount = row.querySelector('.discount_pct')?.textContent?.trim();
                const price = row.querySelector('.discount_final_price')?.textContent?.trim();
                const link = row.href;
                const image = row.querySelector('div.col.search_capsule > img')?.src;
                const releaseDate = row.querySelector('.search_released')?.textContent?.trim();

                if (title && discount && price) {
                    items.push({ title, discount, price, link, image, releaseDate });
                }
            }

            return items;
        });

        return results;
    } catch (err) {
        console.error('Steam Sales err: ', err);
        return [];
    } finally {
        await browser.close();
    }
}

module.exports = { scrapeSteamSales };