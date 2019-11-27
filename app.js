const _express = require('express');
const _app = _express();
const _bodyParser = require('body-parser');
const _httpClient = require('./services/http-client');
const _steamScraper = require('./services/steam-scraper');
const _logger = require('./services/logger');

const PORT = process.env.PORT || 8080;

function main() {
    _app.use(_express.static('public'));
    _app.use(_bodyParser.urlencoded({ extended: false }))
    _app.use(_bodyParser.json());

    _app.post('/api/app-scrape', async (req, res) => {
        let appUrl = req.body.url;

        let appPageHtml;
        try {
            appPageHtml = await _httpClient.get(appUrl);
        } catch (error) {
            _logger.error(error);
            res.status(500).json({ message: "Error retrieving page HTML." })
            return;
        }

        try {
            let appPageData = _steamScraper.getAppPageData(appPageHtml);
            res.status(200).json(appPageData);
            return;
        } catch (error) {
            if (error.type == "NO_GAME_ELEMENTS") {
                res.status(400).json({ message: error.message });
                return;
            }

            _logger.error(error);
            res.status(500).json({ message: "Error scraping page data." });
            return;
        }
    });

    _app.post('/api/search-scrape', async (req, res) => {
        let searchUrl = req.body.url;
        let searchPageHtml;
        try {
            searchPageHtml = await _httpClient.get(searchUrl);
        } catch (error) {
            _logger.error(error);
            res.status(500).json({ message: "Error retrieving page HTML." })
            return;
        }

        try {
            let searchPageData = _steamScraper.getSearchPageData(searchPageHtml);
            res.status(200).json(searchPageData);
            return;
        } catch (error) {
            _logger.error(error);
            res.status(500).json({ message: "Error scraping page data." });
            return;
        }
    });

    _app.post('/api/search-app-scrape', async (req, res) => {
        let appUrl = req.body.url;
        let appPageHtml;
        try {
            appPageHtml = await _httpClient.get(appUrl);
        } catch (error) {
            _logger.error(error);
            res.status(500).json({ message: "Error retrieving page HTML." })
            return;
        }

        try {
            let appPageData = _steamScraper.getSearchAppPageData(appPageHtml);
            res.status(200).json(appPageData);
            return;
        } catch (error) {
            if (error.type == "NO_GAME_ELEMENTS") {
                res.status(400).json({ message: error.message });
                return;
            }

            _logger.error(error);
            res.status(500).json({ message: "Error scraping page data." });
            return;
        }
    });

    _app.listen(PORT, () => {
        console.log(`App listening on port ${PORT}!`);
    });
}

main();
