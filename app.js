require('dotenv').config();
const _express = require('express');
const _app = _express();
const _bodyParser = require('body-parser');
const _puppeteer = require('puppeteer');

const _httpClient = require('./services/http-client');
const _steamScraper = require('./services/steam-scraper');
const _oculusScraper = require('./services/oculus-scraper');
const _logger = require('./services/logger');

const PORT = process.env.PORT || 8080;
let browser;

async function main() {
    _app.use(_express.static('public'));
    _app.use(_bodyParser.urlencoded({ extended: false }));
    _app.use(_bodyParser.json());

    _app.post('/api/steam/app-scrape', async (req, res) => {
        let appUrl = req.body.url;

        let appPageHtml;
        try {
            appPageHtml = await _httpClient.get(appUrl);
        } catch (error) {
            _logger.error(error);
            res.status(500).json({ message: 'Error retrieving page HTML.', error });
            return;
        }

        try {
            let appPageData = _steamScraper.getAppPageData(appPageHtml);
            appPageData.link = appUrl;
            res.status(200).json(appPageData);
            return;
        } catch (error) {
            if (error.type == 'NO_GAME_ELEMENTS') {
                res.status(400).json({ message: 'No game elements.', error });
                return;
            }

            _logger.error(error);
            res.status(500).json({ message: 'Error scraping page data.', error });
            return;
        }
    });

    _app.post('/api/steam/search-scrape', async (req, res) => {
        let searchUrl = req.body.url;
        let searchPageHtml;
        try {
            searchPageHtml = await _httpClient.get(searchUrl);
        } catch (error) {
            _logger.error(error);
            res.status(500).json({ message: 'Error retrieving page HTML.', error });
            return;
        }

        try {
            let searchPageData = _steamScraper.getSearchPageData(searchPageHtml);
            res.status(200).json(searchPageData);
            return;
        } catch (error) {
            _logger.error(error);
            res.status(500).json({ message: 'Error scraping page data.', error });
            return;
        }
    });

    _app.post('/api/steam/search-app-scrape', async (req, res) => {
        let appUrl = req.body.url;
        let appPageHtml;
        try {
            appPageHtml = await _httpClient.get(appUrl);
        } catch (error) {
            _logger.error(error);
            res.status(500).json({ message: 'Error retrieving page HTML.', error });
            return;
        }

        try {
            let appPageData = _steamScraper.getSearchAppPageData(appPageHtml);
            res.status(200).json(appPageData);
            return;
        } catch (error) {
            if (error.type == 'NO_GAME_ELEMENTS') {
                res.status(400).json({ message: 'No game elements.', error });
                return;
            }

            _logger.error(error);
            res.status(500).json({ message: 'Error scraping page data.', error });
            return;
        }
    });

    _app.post('/api/oculus/experience-scrape', async (req, res) => {
        let experienceUrl = req.body.url;
        let page;
        try {
            page = await browser.newPage();
        } catch (error) {
            _logger.error(error);
            res.status(500).json({ message: 'Could not create a new page.', error });
            return;
        }

        try {
            let experiencePageData = await _oculusScraper.scrapePage(page, experienceUrl);
            res.status(200).json(experiencePageData);
            return;
        } catch (error) {
            _logger.error(error);
            res.status(500).json({ message: 'Error scraping page data.', error });
            return;
        } finally {
            try {
                await page.close();
            } catch (error) {
                _logger.error('CRITICAL: Could not close page after encountering error.', error);
            }
        }
    });

    browser = await _puppeteer.launch({ args: ['--no-sandbox'], headless: true });

    _app.listen(PORT, () => {
        _logger.info(`App listening on port ${PORT}!`);
    });
}

main();
